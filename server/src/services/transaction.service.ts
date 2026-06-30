import Stripe from "stripe";
import crypto from "crypto";
import config from "../config/env.config";
import Transaction from "../models/transaction.model";
import Course from "../models/course.model";
import User from "../models/user.model";
import logger, { logSecurityEvent } from "../utils/logger.utils";
import mongoose from "mongoose";

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-02-24.acacia",
});

const HMAC_KEY = Buffer.from(config.encryption.key);

// ── HMAC signature for transaction integrity ──────────────────────────────────
export const signTransaction = (
  userId: string,
  courseId: string,
  amountCents: number,
  timestamp: string,
): string => {
  const payload = `${userId}|${courseId}|${amountCents}|${timestamp}`;
  return crypto.createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
};

// ── Verify HMAC signature ─────────────────────────────────────────────────────
export const verifyTransactionSignature = (
  userId: string,
  courseId: string,
  amountCents: number,
  timestamp: string,
  signature: string,
): boolean => {
  const expected = signTransaction(userId, courseId, amountCents, timestamp);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

// ── Create Stripe PaymentIntent ──────────────────────────────────────────────
export const createStripePaymentIntent = async (
  userId: string,
  courseId: string,
  userIp: string,
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
}> => {
  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) throw new Error("COURSE_NOT_FOUND");

  const existing = await Transaction.findOne({
    user: userId,
    course: courseId,
    status: "completed",
  });
  if (existing) throw new Error("ALREADY_ENROLLED");

  const amountCents = course.priceCents; // stored in cents
  const timestamp = new Date().toISOString();
  const signature = signTransaction(userId, courseId, amountCents, timestamp);

  // Free course — enroll directly without Stripe
  if (amountCents === 0) {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const freeIntentId = `free_${Date.now()}_${userId.slice(-6)}`;
      await Transaction.create(
        [
          {
            user: userId,
            course: courseId,
            amountCents: 0,
            currency: "USD",
            status: "completed",
            stripePaymentIntentId: freeIntentId,
            signature,
            metadata: { timestamp, free: true },
          },
        ],
        { session },
      );
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { enrolledCourses: courseId } },
        { session },
      );
      await Course.findByIdAndUpdate(
        courseId,
        { $inc: { enrolledCount: 1 } },
        { session },
      );
    });
    session.endSession();
    logSecurityEvent("payment_completed", userId, userIp, {
      courseId,
      amountCents: 0,
      free: true,
    });
    return {
      clientSecret: "free",
      paymentIntentId: freeIntentId,
      amountCents: 0,
    };
  }

  // Paid course — create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata: {
      userId,
      courseId,
      amountCents: amountCents.toString(),
      timestamp,
      signature, // HMAC stored in Stripe metadata for webhook verification
    },
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "always",
    },
  });

  // Store transaction in pending state
  await Transaction.create({
    user: userId,
    course: courseId,
    amountCents,
    currency: "USD",
    status: "pending",
    stripePaymentIntentId: paymentIntent.id,
    signature,
    metadata: { timestamp },
  });

  logSecurityEvent("payment_intent_created", userId, userIp, {
    courseId,
    amountCents,
    paymentIntentId: paymentIntent.id,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    amountCents,
  };
};

// ── Handle Stripe Webhook ────────────────────────────────────────────────────
export const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string,
): Promise<void> => {
  let event: Stripe.Event;

  try {
    // Verify Stripe webhook signature
    const webhookSecret = config.stripe.webhookSecret;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", { err });
    throw new Error("WEBHOOK_SIGNATURE_INVALID");
  }

  // Only handle payment_intent.succeeded
  if (event.type !== "payment_intent.succeeded") {
    logger.info(`Ignoring webhook event type: ${event.type}`);
    return;
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const {
    userId,
    courseId,
    amountCents,
    timestamp,
    signature: hmacSignature,
  } = paymentIntent.metadata;

  // ── Re-verify HMAC integrity (prevents tampering) ──────────────────────
  if (!userId || !courseId || !amountCents || !timestamp || !hmacSignature) {
    logger.error("Missing metadata in Stripe PaymentIntent", {
      paymentIntentId: paymentIntent.id,
      metadata: paymentIntent.metadata,
    });
    throw new Error("MISSING_METADATA");
  }

  const isValid = verifyTransactionSignature(
    userId,
    courseId,
    parseInt(amountCents, 10),
    timestamp,
    hmacSignature,
  );

  if (!isValid) {
    logger.error("HMAC signature mismatch for Stripe webhook", {
      paymentIntentId: paymentIntent.id,
      userId,
      courseId,
    });
    throw new Error("HMAC_VERIFICATION_FAILED");
  }

  // ── Find and validate transaction ──────────────────────────────────────
  const txn = await Transaction.findOne({
    stripePaymentIntentId: paymentIntent.id,
    status: "pending",
  });

  if (!txn) {
    logger.warn("Transaction not found or already processed", {
      paymentIntentId: paymentIntent.id,
    });
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  // Verify amount matches
  if (txn.amountCents !== parseInt(amountCents, 10)) {
    logger.error("Amount mismatch in Stripe webhook", {
      expected: txn.amountCents,
      received: amountCents,
    });
    await Transaction.findByIdAndUpdate(txn._id, { status: "failed" });
    throw new Error("AMOUNT_MISMATCH");
  }

  // ── Atomic enrolment ────────────────────────────────────────────────────
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    await Transaction.findByIdAndUpdate(
      txn._id,
      {
        status: "completed",
        stripeChargeId: paymentIntent.latest_charge,
        $set: { "metadata.webhookReceivedAt": new Date().toISOString() },
      },
      { session },
    );

    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { enrolledCourses: txn.course } },
      { session },
    );

    await Course.findByIdAndUpdate(
      txn.course,
      { $inc: { enrolledCount: 1 } },
      { session },
    );
  });
  session.endSession();

  const course = await Course.findById(txn.course).select("title");

  logSecurityEvent("payment_completed", userId, "webhook", {
    courseId: txn.course.toString(),
    amountCents: txn.amountCents,
    paymentIntentId: paymentIntent.id,
    chargeId: paymentIntent.latest_charge,
  });

  logger.info("Payment completed via Stripe webhook", {
    paymentIntentId: paymentIntent.id,
    userId,
    courseId,
    amountCents: txn.amountCents,
  });
};

// ── Get user's transactions ──────────────────────────────────────────────────
export const getUserTransactions = async (userId: string) => {
  return Transaction.find({ user: userId })
    .populate("course", "title slug thumbnail")
    .sort({ createdAt: -1 });
};

// ── Get all transactions (admin) ────────────────────────────────────────────
export const getAllTransactions = async (
  filter: Record<string, unknown> = {},
  page = 1,
  limit = 50,
) => {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("user", "username email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);
  return { transactions, total };
};
