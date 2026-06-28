import { Request, Response } from "express";
import { createPaymentIntent, handleStripeWebhook } from "../services/transaction.service";
import Transaction from "../models/transaction.model";
import { logSecurityEvent } from "../utils/logger.utils";

const ip = (req: Request) => req.ip || "unknown";

// POST /api/payments/create-intent
export const createIntent = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }

  const { courseId } = req.body;
  if (!courseId) { res.status(400).json({ error: "courseId is required" }); return; }

  try {
    const result = await createPaymentIntent(req.user.sub, courseId, ip(req));
    res.status(200).json(result);
  } catch (err: any) {
    if (err.message === "ALREADY_ENROLLED") {
      res.status(409).json({ error: "You are already enrolled in this course." });
      return;
    }
    if (err.message === "Course not found") {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    throw err;
  }
};

// POST /api/payments/webhook — Stripe calls this
// Raw body is needed for signature verification (applied in router)
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) { res.status(400).json({ error: "Missing Stripe signature" }); return; }

  try {
    await handleStripeWebhook(req.body as Buffer, sig);
    res.status(200).json({ received: true });
  } catch (err: any) {
    if (err.message === "INVALID_WEBHOOK_SIGNATURE") {
      logSecurityEvent("webhook_signature_invalid", null, ip(req), {});
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }
    throw err;
  }
};

// GET /api/payments/my-transactions
export const myTransactions = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const txns = await Transaction.find({ user: req.user.sub })
    .populate("course", "title slug thumbnail")
    .sort({ createdAt: -1 });
  res.status(200).json({ transactions: txns });
};

// GET /api/admin/transactions — admin view all
export const adminListTransactions = async (req: Request, res: Response): Promise<void> => {
  const { status, page = "1", limit = "50" } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("user", "username email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json({ transactions, total });
};
