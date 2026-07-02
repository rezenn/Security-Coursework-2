import { Request, Response } from "express";
import {
  createStripePaymentIntent,
  handleStripeWebhook,
  completePaymentIntent,
  getUserTransactions,
  getAllTransactions,
} from "../services/transaction.service";
import { logSecurityEvent } from "../utils/logger.utils";
import config from "../config/env.config";

const ip = (req: Request) => req.ip || "unknown";

// POST /api/payments/create-intent
// Returns a PaymentIntent clientSecret for the Stripe Payment Element (embedded
// in-page modal). This replaces the old Checkout Session redirect approach.
export const createCheckoutSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { courseId } = req.body;
  if (!courseId || typeof courseId !== "string") {
    res.status(400).json({ error: "courseId is required" });
    return;
  }

  try {
    const result = await createStripePaymentIntent(
      req.user.sub,
      courseId,
      ip(req),
    );
    // Return the publishable key so the client can initialise loadStripe()
    // without baking it into the bundle at build time from an env var.
    res.status(200).json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amountCents: result.amountCents,
      currency: result.currency,
      publishableKey: config.stripe.publishableKey,
    });
  } catch (err: any) {
    const msgMap: Record<string, [number, string]> = {
      ALREADY_ENROLLED: [409, "You are already enrolled in this course."],
      COURSE_NOT_FOUND: [404, "Course not found or not published."],
    };
    const [status, message] = msgMap[err.message] || [
      500,
      "Payment intent creation failed.",
    ];
    res.status(status).json({ error: message });
  }
};

// POST /api/payments/webhook
export const stripeWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    res.status(400).json({ error: "Stripe signature header missing" });
    return;
  }

  try {
    // express.raw() (registered in server.ts, ahead of express.json()) sets
    // req.body to the exact unparsed Buffer Stripe signed — required for
    // constructEvent's HMAC check.
    const bodyBuffer = req.body as Buffer;

    await handleStripeWebhook(bodyBuffer, signature);
    res.status(200).json({ received: true });
  } catch (err: any) {
    const msgMap: Record<string, [number, string]> = {
      WEBHOOK_SIGNATURE_INVALID: [401, "Invalid webhook signature"],
      MISSING_METADATA: [400, "Missing metadata in payment intent"],
      HMAC_VERIFICATION_FAILED: [403, "HMAC verification failed"],
      TRANSACTION_NOT_FOUND: [404, "Transaction not found"],
      AMOUNT_MISMATCH: [400, "Amount mismatch"],
    };
    const [status, message] = msgMap[err.message] || [
      500,
      "Webhook processing failed",
    ];

    logSecurityEvent("webhook_failed", null, ip(req), { error: err.message });
    res.status(status).json({ error: message });
  }
};

// POST /api/payments/complete-payment-intent
// Fallback finalizer for the in-page Payment Element flow, called by the
// client right after stripe.confirmPayment() resolves. See
// completePaymentIntent in transaction.service for why this exists.
export const completePaymentIntentHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { paymentIntentId } = req.body;
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    res.status(400).json({ error: "paymentIntentId is required" });
    return;
  }

  try {
    const result = await completePaymentIntent(req.user.sub, paymentIntentId);
    res
      .status(200)
      .json({ message: "Payment finalized", courseId: result.courseId });
  } catch (err: any) {
    const msgMap: Record<string, [number, string]> = {
      SESSION_NOT_PAID: [400, "Payment has not completed yet."],
      TRANSACTION_NOT_FOUND: [404, "Transaction not found."],
      USER_MISMATCH: [403, "Payment does not belong to this user."],
    };
    const [status, message] = msgMap[err.message] || [
      500,
      "Payment finalization failed.",
    ];
    logSecurityEvent("payment_finalize_failed", req.user.sub, ip(req), {
      error: err.message,
      paymentIntentId,
    });
    res.status(status).json({ error: message });
  }
};

// GET /api/payments/my-transactions
export const myTransactions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const transactions = await getUserTransactions(req.user.sub);
  res.status(200).json({ transactions });
};

// GET /api/admin/transactions
export const adminListTransactions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { status, page = "1", limit = "50" } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const result = await getAllTransactions(
    filter,
    parseInt(page as string),
    parseInt(limit as string),
  );
  res.status(200).json(result);
};
