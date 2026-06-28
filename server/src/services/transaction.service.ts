import Stripe from "stripe";
import crypto from "crypto";
import config from "../config/env.config";
import Transaction from "../models/transaction.model";
import Course from "../models/course.model";
import User from "../models/user.model";
import logger, { logSecurityEvent } from "../utils/logger.utils";

const stripe = new Stripe(config.stripe.secretKey, { apiVersion: "2024-06-20" as any });

const HMAC_KEY = Buffer.from(config.encryption.key);

export const signTransaction = (
  userId: string,
  courseId: string,
  amountCents: number,
  currency: string,
  timestamp: string,
): string => {
  const payload = `${userId}|${courseId}|${amountCents}|${currency}|${timestamp}`;
  return crypto.createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
};

/**
 * Create a Stripe PaymentIntent for course purchase.
 * Returns clientSecret for frontend to confirm payment.
 */
export const createPaymentIntent = async (
  userId: string,
  courseId: string,
  userIp: string,
): Promise<{ clientSecret: string; paymentIntentId: string; amountCents: number }> => {
  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) throw new Error("Course not found");

  // Idempotency: check if already purchased
  const existing = await Transaction.findOne({
    user: userId,
    course: courseId,
    status: "completed",
  });
  if (existing) throw new Error("ALREADY_ENROLLED");

  const timestamp = new Date().toISOString();
  const signature = signTransaction(userId, courseId, course.priceCents, course.currency, timestamp);

  // Create Stripe PaymentIntent
  const intent = await stripe.paymentIntents.create(
    {
      amount: course.priceCents,
      currency: course.currency.toLowerCase(),
      metadata: {
        userId,
        courseId,
        signature,
        timestamp,
      },
      description: `GyanKosh: ${course.title}`,
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey: `${userId}-${courseId}-${Math.floor(Date.now() / 60000)}` },
  );

  // Create pending transaction record
  await Transaction.create({
    user: userId,
    course: courseId,
    amountCents: course.priceCents,
    currency: course.currency,
    status: "pending",
    stripePaymentIntentId: intent.id,
    signature,
    metadata: { timestamp },
  });

  logSecurityEvent("payment_intent_created", userId, userIp, {
    courseId,
    amountCents: course.priceCents,
    paymentIntentId: intent.id,
  });

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
    amountCents: course.priceCents,
  };
};

/**
 * Handle Stripe webhook — confirm payment and enroll user.
 * Verifies webhook signature to prevent spoofed events.
 */
export const handleStripeWebhook = async (
  rawBody: Buffer,
  sig: string,
): Promise<void> => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, config.stripe.webhookSecret);
  } catch (err) {
    logger.error("Webhook signature verification failed", { err });
    throw new Error("INVALID_WEBHOOK_SIGNATURE");
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { userId, courseId, signature, timestamp } = intent.metadata;

    if (!userId || !courseId || !signature || !timestamp) {
      logger.error("Webhook missing metadata", { intentId: intent.id });
      return;
    }

    // Re-verify HMAC to ensure data integrity
    const expectedSig = signTransaction(userId, courseId, intent.amount, intent.currency.toUpperCase(), timestamp);
    if (expectedSig !== signature) {
      logger.error("Webhook HMAC mismatch", { intentId: intent.id });
      return;
    }

    const session = await (await import("mongoose")).default.startSession();
    await session.withTransaction(async () => {
      await Transaction.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        {
          status: "completed",
          stripeChargeId: typeof intent.latest_charge === "string" ? intent.latest_charge : null,
        },
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

    logSecurityEvent("payment_completed", userId, "stripe-webhook", {
      courseId,
      amountCents: intent.amount,
      paymentIntentId: intent.id,
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: "failed" },
    );
    logger.warn("Payment failed", { intentId: intent.id });
  }
};
