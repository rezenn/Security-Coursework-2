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
  apiVersion: "2023-10-16",
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
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual THROWS (rather than returning false) if the two
  // buffers differ in length. A garbled/truncated signature would
  // otherwise crash out of this function instead of just failing
  // verification, which then bubbles up as an unhandled 500 and leaves
  // the transaction stuck "pending" instead of a clean rejection.
  if (sigBuf.length !== expectedBuf.length) {
    logger.warn("Signature length mismatch during HMAC verification", {
      userId,
      courseId,
      expectedLength: expectedBuf.length,
      receivedLength: sigBuf.length,
    });
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
};

// ── Create a Stripe-hosted checkout session for paid courses ──────────────
export const createStripeCheckoutSession = async (
  userId: string,
  courseId: string,
  userIp: string,
): Promise<{
  checkoutUrl: string;
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
}> => {
  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) throw new Error("COURSE_NOT_FOUND");

  const existing = await Transaction.findOne({
    user: userId,
    course: courseId,
    status: "completed",
  });
  if (existing) throw new Error("ALREADY_ENROLLED");

  const amountCents = course.priceCents;
  const timestamp = new Date().toISOString();
  const signature = signTransaction(userId, courseId, amountCents, timestamp);

  if (amountCents === 0) {
    const freeIntentId = `free_${Date.now()}_${userId.slice(-6)}`;
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Transaction.create(
        [
          {
            user: userId,
            course: courseId,
            amountCents: 0,
            currency: "NPR",
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
      checkoutUrl: `${config.frontendUrl}/payment/success`,
      clientSecret: "free",
      paymentIntentId: freeIntentId,
      amountCents: 0,
      currency: "npr",
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "npr",
          unit_amount: amountCents,
          product_data: {
            name: course.title,
            description: course.description.slice(0, 140),
          },
        },
      },
    ],
    metadata: {
      userId,
      courseId,
      amountCents: amountCents.toString(),
      timestamp,
      signature,
    },
    payment_intent_data: {
      metadata: {
        userId,
        courseId,
        amountCents: amountCents.toString(),
        timestamp,
        signature,
      },
    },
    success_url: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/courses/${course.slug}`,
  });

  await Transaction.create({
    user: userId,
    course: courseId,
    amountCents,
    currency: "NPR",
    status: "pending",
    stripePaymentIntentId: checkoutSession.id,
    signature,
    metadata: { timestamp, checkoutSessionId: checkoutSession.id },
  });

  logSecurityEvent("checkout_session_created", userId, userIp, {
    courseId,
    amountCents,
    checkoutSessionId: checkoutSession.id,
  });

  return {
    checkoutUrl: checkoutSession.url || "",
    clientSecret: checkoutSession.client_secret || "",
    paymentIntentId: checkoutSession.id,
    amountCents,
    currency: "npr",
  };
};

// ── Finalize a Stripe Checkout Session when Stripe redirects back to the
// frontend and the webhook may not yet have been delivered.
export const completeCheckoutSession = async (
  userId: string,
  sessionId: string,
): Promise<{ courseId: string }> => {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  if (!session || session.id !== sessionId) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  const metadata = session.metadata as {
    userId?: string;
    courseId?: string;
    amountCents?: string;
    timestamp?: string;
    signature?: string;
  } | null;

  const normalizedSessionPaymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id || null;

  const metadataSource =
    metadata ??
    ((session.payment_intent as Stripe.PaymentIntent | null)?.metadata as {
      userId?: string;
      courseId?: string;
      amountCents?: string;
      timestamp?: string;
      signature?: string;
    } | null);

  let sessionUserId = metadataSource?.userId;
  let courseId = metadataSource?.courseId;
  let amountCents = metadataSource?.amountCents;
  let timestamp = metadataSource?.timestamp;
  let signature = metadataSource?.signature;

  const txnBySession = await Transaction.findOne({
    stripePaymentIntentId: session.id,
    status: "pending",
  });

  const txnByIntent = normalizedSessionPaymentIntentId
    ? await Transaction.findOne({
        stripePaymentIntentId: normalizedSessionPaymentIntentId,
        status: "pending",
      })
    : null;

  const txn = txnBySession || txnByIntent;
  if (!txn) {
    logger.warn("Checkout transaction not found", {
      sessionId: session.id,
      paymentIntentId: normalizedSessionPaymentIntentId,
    });
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  if (!sessionUserId || !courseId || !amountCents || !timestamp || !signature) {
    logger.warn(
      "Checkout session metadata incomplete, using transaction fallback",
      {
        sessionId: session.id,
        paymentIntentId: normalizedSessionPaymentIntentId,
      },
    );
    sessionUserId = txn.user.toString();
    courseId = txn.course.toString();
    amountCents = String(txn.amountCents);
    timestamp = new Date().toISOString();
    signature = txn.signature;
  } else {
    if (sessionUserId !== userId) {
      logger.warn("Checkout session user mismatch", {
        sessionId: session.id,
        expectedUserId: userId,
        metadataUser: sessionUserId,
      });
      throw new Error("USER_MISMATCH");
    }

    const isValid = verifyTransactionSignature(
      sessionUserId,
      courseId,
      parseInt(amountCents, 10),
      timestamp,
      signature,
    );

    if (!isValid) {
      logger.error("HMAC signature mismatch", { sessionId: session.id });
      throw new Error("HMAC_VERIFICATION_FAILED");
    }
  }

  if (txn.amountCents !== parseInt(amountCents, 10)) {
    logger.error("Amount mismatch", {
      expected: txn.amountCents,
      received: amountCents,
    });
    await Transaction.findByIdAndUpdate(txn._id, { status: "failed" });
    throw new Error("AMOUNT_MISMATCH");
  }

  if (session.status !== "complete" && session.payment_status !== "paid") {
    logger.warn("Checkout session not paid", {
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
    });
    throw new Error("SESSION_NOT_PAID");
  }

  const existingCompleted = await Transaction.findOne({
    user: userId,
    course: courseId,
    status: "completed",
  });
  if (existingCompleted) {
    return { courseId };
  }

  await handleCheckoutSessionCompleted(session);
  return { courseId };
};

// ── Create Stripe PaymentIntent (for direct card payments) ──────────────────
export const createStripePaymentIntent = async (
  userId: string,
  courseId: string,
  userIp: string,
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
}> => {
  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) throw new Error("COURSE_NOT_FOUND");

  const existing = await Transaction.findOne({
    user: userId,
    course: courseId,
    status: "completed",
  });
  if (existing) throw new Error("ALREADY_ENROLLED");

  const amountCents = course.priceCents;
  const timestamp = new Date().toISOString();
  const signature = signTransaction(userId, courseId, amountCents, timestamp);

  // Free course
  if (amountCents === 0) {
    const freeIntentId = `free_${Date.now()}_${userId.slice(-6)}`;
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Transaction.create(
        [
          {
            user: userId,
            course: courseId,
            amountCents: 0,
            currency: "NPR",
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
      currency: "npr",
    };
  }

  // NPR — Stripe requires amounts in paisa (1 NPR = 100 paisa), same
  // scaling as USD cents. priceCents in the DB is stored as the smallest
  // currency unit already, so the value is correct; we just change currency.
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "npr",
    metadata: {
      userId,
      courseId,
      amountCents: amountCents.toString(),
      timestamp,
      signature,
    },
    // allow_redirects: "never" keeps the Payment Element fully in-page.
    // Stripe will only offer payment methods that don't require browser
    // redirects (card, etc.), which is what we want for the modal UX.
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });

  await Transaction.create({
    user: userId,
    course: courseId,
    amountCents,
    currency: "NPR",
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
    currency: "npr",
  };
};

// NOTE: An older `createStripeCheckoutSession` (redirect-based Stripe
// Checkout) used to live here. It was never called anywhere — the app
// switched to the in-page PaymentIntent + Payment Element flow above — and
// it still hardcoded "usd"/"USD" against an NPR-only schema, so it was
// removed rather than fixed. If a hosted-redirect checkout is ever needed
// again, rebuild it against createStripePaymentIntent's NPR conventions.

// ── Handle Stripe Webhook ────────────────────────────────────────────────────
export const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string,
): Promise<void> => {
  let event: Stripe.Event;

  try {
    const webhookSecret = config.stripe.webhookSecret;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    logger.info(`Webhook received: ${event.type}`, { eventId: event.id });
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", { err });
    throw new Error("WEBHOOK_SIGNATURE_INVALID");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutSessionCompleted(session);
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await handlePaymentIntentSucceeded(paymentIntent);
    return;
  }

  logger.info(`Ignoring webhook event type: ${event.type}`);
};

// ── Handle Checkout Session Completed ──────────────────────────────────────
const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const metadata = session.metadata as {
    userId: string;
    courseId: string;
    amountCents: string;
    timestamp: string;
    signature: string;
  } | null;

  const normalizedSessionPaymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id || null;

  const metadataSource =
    metadata ??
    ((session.payment_intent as Stripe.PaymentIntent | null)?.metadata as {
      userId?: string;
      courseId?: string;
      amountCents?: string;
      timestamp?: string;
      signature?: string;
    } | null);

  let userId = metadataSource?.userId;
  let courseId = metadataSource?.courseId;
  let amountCents = metadataSource?.amountCents;
  let timestamp = metadataSource?.timestamp;
  let hmacSignature = metadataSource?.signature;

  const txnBySession = await Transaction.findOne({
    stripePaymentIntentId: session.id,
    status: "pending",
  });

  const txnByIntent = normalizedSessionPaymentIntentId
    ? await Transaction.findOne({
        stripePaymentIntentId: normalizedSessionPaymentIntentId,
        status: "pending",
      })
    : null;

  const txn = txnBySession || txnByIntent;

  if (!txn) {
    logger.warn("Transaction not found", { sessionId: session.id });
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  if (!userId || !courseId || !amountCents || !timestamp || !hmacSignature) {
    logger.warn(
      "Checkout session metadata incomplete, completing by transaction lookup",
      {
        sessionId: session.id,
        paymentIntentId: normalizedSessionPaymentIntentId,
      },
    );
    userId = txn.user.toString();
    courseId = txn.course.toString();
    amountCents = String(txn.amountCents);
    timestamp = new Date().toISOString();
    hmacSignature = txn.signature;
  } else {
    const isValid = verifyTransactionSignature(
      userId,
      courseId,
      parseInt(amountCents, 10),
      timestamp,
      hmacSignature,
    );

    if (!isValid) {
      logger.error("HMAC signature mismatch", { sessionId: session.id });
      throw new Error("HMAC_VERIFICATION_FAILED");
    }
  }

  if (txn.amountCents !== parseInt(amountCents, 10)) {
    logger.error("Amount mismatch", {
      expected: txn.amountCents,
      received: amountCents,
    });
    await Transaction.findByIdAndUpdate(txn._id, { status: "failed" });
    throw new Error("AMOUNT_MISMATCH");
  }

  if (!txn) {
    logger.warn("Transaction not found", { sessionId: session.id });
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  if (txn.amountCents !== parseInt(amountCents, 10)) {
    logger.error("Amount mismatch", {
      expected: txn.amountCents,
      received: amountCents,
    });
    await Transaction.findByIdAndUpdate(txn._id, { status: "failed" });
    throw new Error("AMOUNT_MISMATCH");
  }

  // Atomic enrolment
  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      await Transaction.findByIdAndUpdate(
        txn._id,
        {
          status: "completed",
          stripeChargeId: session.payment_intent as string,
          $set: { "metadata.webhookReceivedAt": new Date().toISOString() },
        },
        { session: mongoSession },
      );

      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { enrolledCourses: txn.course } },
        { session: mongoSession },
      );

      await Course.findByIdAndUpdate(
        txn.course,
        { $inc: { enrolledCount: 1 } },
        { session: mongoSession },
      );
    });
  } catch (error) {
    logger.error("Transaction enrolment failed", {
      error,
      transactionId: txn._id,
    });
    throw error;
  } finally {
    mongoSession.endSession();
  }

  logSecurityEvent("payment_completed", userId, "webhook", {
    courseId: txn.course.toString(),
    amountCents: txn.amountCents,
    sessionId: session.id,
    chargeId: session.payment_intent,
  });

  logger.info("✅ Payment completed via Stripe Checkout", {
    sessionId: session.id,
    userId,
    courseId,
    transactionId: txn._id,
  });
};

// ── Handle Payment Intent Succeeded ──────────────────────────────────────
const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent,
) => {
  const metadata = paymentIntent.metadata as {
    userId?: string;
    courseId?: string;
    amountCents?: string;
    timestamp?: string;
    signature?: string;
  } | null;

  const userId = metadata?.userId;
  const courseId = metadata?.courseId;
  const amountCents = metadata?.amountCents;
  const timestamp = metadata?.timestamp;
  const hmacSignature = metadata?.signature;

  const txnByIntent = await Transaction.findOne({
    stripePaymentIntentId: paymentIntent.id,
    status: "pending",
  });

  let txn = txnByIntent;
  if (!txn && userId && courseId && amountCents) {
    txn = await Transaction.findOne({
      user: userId,
      course: courseId,
      amountCents: parseInt(amountCents, 10),
      status: "pending",
    }).sort({ createdAt: -1 });
  }

  if (!txn) {
    logger.warn("Transaction not found", {
      paymentIntentId: paymentIntent.id,
      metadata: paymentIntent.metadata,
    });
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  if (!userId || !courseId || !amountCents || !timestamp || !hmacSignature) {
    logger.warn(
      "PaymentIntent metadata incomplete, completing by transaction fallback",
      {
        paymentIntentId: paymentIntent.id,
        transactionId: txn._id,
      },
    );
  } else {
    const isValid = verifyTransactionSignature(
      userId,
      courseId,
      parseInt(amountCents, 10),
      timestamp,
      hmacSignature,
    );

    if (!isValid) {
      logger.error("HMAC signature mismatch", {
        paymentIntentId: paymentIntent.id,
      });
      throw new Error("HMAC_VERIFICATION_FAILED");
    }

    if (txn.amountCents !== parseInt(amountCents, 10)) {
      logger.error("Amount mismatch", {
        expected: txn.amountCents,
        received: amountCents,
      });
      await Transaction.findByIdAndUpdate(txn._id, { status: "failed" });
      throw new Error("AMOUNT_MISMATCH");
    }
  }

  const session = await mongoose.startSession();
  try {
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
        userId ?? txn.user,
        { $addToSet: { enrolledCourses: txn.course } },
        { session },
      );

      await Course.findByIdAndUpdate(
        txn.course,
        { $inc: { enrolledCount: 1 } },
        { session },
      );
    });
  } catch (error) {
    logger.error("Transaction enrolment failed", {
      error,
      transactionId: txn._id,
    });
    throw error;
  } finally {
    session.endSession();
  }

  logSecurityEvent(
    "payment_completed",
    userId ?? txn.user.toString(),
    "webhook",
    {
      courseId: txn.course.toString(),
      amountCents: txn.amountCents,
      paymentIntentId: paymentIntent.id,
      chargeId: paymentIntent.latest_charge,
    },
  );

  logger.info("✅ Payment completed via Stripe PaymentIntent", {
    paymentIntentId: paymentIntent.id,
    userId: userId ?? txn.user.toString(),
    courseId: txn.course.toString(),
    transactionId: txn._id,
  });
};

// ── Finalize a PaymentIntent from the client, as a fallback when the
// webhook hasn't landed yet (or at all — e.g. STRIPE_WEBHOOK_SECRET
// misconfigured, endpoint unreachable in dev, delivery delay). The
// Payment Element flow (unlike hosted Checkout) previously had NO
// server confirmation step after stripe.confirmPayment() resolved on
// the client — the frontend just showed "success" locally while the
// transaction silently stayed "pending" until the webhook (if it ever
// arrived) caught up. This closes that gap the same way
// completeCheckoutSession does for the hosted-Checkout flow.
//
// Safe to call even if the webhook wins the race: handlePaymentIntentSucceeded
// only matches transactions with status "pending", so a second call
// (whichever arrives second, this one or the webhook) is a no-op.
export const completePaymentIntent = async (
  userId: string,
  paymentIntentId: string,
): Promise<{ courseId: string }> => {
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent || paymentIntent.id !== paymentIntentId) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  const metadataUserId = (paymentIntent.metadata as { userId?: string } | null)
    ?.userId;
  if (metadataUserId && metadataUserId !== userId) {
    logger.warn("PaymentIntent user mismatch on client-side finalize", {
      paymentIntentId,
      expectedUserId: userId,
      metadataUserId,
    });
    throw new Error("USER_MISMATCH");
  }

  const txn = await Transaction.findOne({
    stripePaymentIntentId: paymentIntentId,
    user: userId,
  });
  if (!txn) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  if (txn.status === "completed") {
    return { courseId: txn.course.toString() };
  }

  if (paymentIntent.status !== "succeeded") {
    logger.warn(
      "Client-side finalize attempted before PaymentIntent succeeded",
      {
        paymentIntentId,
        status: paymentIntent.status,
      },
    );
    throw new Error("SESSION_NOT_PAID");
  }

  await handlePaymentIntentSucceeded(paymentIntent);
  const updated = await Transaction.findById(txn._id);
  return { courseId: (updated ?? txn).course.toString() };
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
