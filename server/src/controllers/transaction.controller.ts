import { Request, Response } from "express";
import {
  createStripePaymentIntent,
  handleStripeWebhook,
  getUserTransactions,
  getAllTransactions,
} from "../services/transaction.service";
import { logSecurityEvent } from "../utils/logger.utils";

const ip = (req: Request) => req.ip || "unknown";

// POST /api/payments/create-intent
export const createIntent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { courseId } = req.body;
  if (!courseId) {
    res.status(400).json({ error: "courseId is required" });
    return;
  }

  try {
    const result = await createStripePaymentIntent(
      req.user.sub,
      courseId,
      ip(req),
    );
    res.status(200).json(result);
  } catch (err: any) {
    const msgMap: Record<string, [number, string]> = {
      ALREADY_ENROLLED: [409, "You are already enrolled in this course."],
      COURSE_NOT_FOUND: [404, "Course not found or not published."],
    };
    const [status, message] = msgMap[err.message] || [
      500,
      "Payment initiation failed.",
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
    await handleStripeWebhook(req.body, signature);
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
