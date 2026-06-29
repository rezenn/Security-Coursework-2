import { Request, Response } from "express";
import {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
} from "../services/transaction.service";
import Transaction from "../models/transaction.model";
import { logSecurityEvent } from "../utils/logger.utils";

const ip = (req: Request) => req.ip || "unknown";

// POST /api/payments/initiate
export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { courseId } = req.body;
  if (!courseId) { res.status(400).json({ error: "courseId is required" }); return; }

  try {
    const result = await initiateKhaltiPayment(req.user.sub, courseId, ip(req));
    res.status(200).json(result);
  } catch (err: any) {
    const msgMap: Record<string, [number, string]> = {
      ALREADY_ENROLLED: [409, "You are already enrolled in this course."],
      COURSE_NOT_FOUND: [404, "Course not found or not published."],
      MIN_AMOUNT: [400, "Course price must be at least Rs. 10 for Khalti payments."],
    };
    const [status, message] = msgMap[err.message] || [500, "Payment initiation failed."];
    res.status(status).json({ error: message });
  }
};

// POST /api/payments/verify
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { pidx } = req.body;
  if (!pidx) { res.status(400).json({ error: "pidx is required" }); return; }

  try {
    const result = await verifyKhaltiPayment(pidx, req.user.sub, ip(req));
    res.status(200).json(result);
  } catch (err: any) {
    const msgMap: Record<string, [number, string]> = {
      TRANSACTION_NOT_FOUND: [404, "Transaction not found."],
      PAYMENT_NOT_COMPLETED: [402, "Khalti payment not completed."],
      AMOUNT_MISMATCH: [400, "Payment amount mismatch — possible tampering."],
    };
    const [status, message] = msgMap[err.message] || [500, "Verification failed."];
    logSecurityEvent("payment_verify_failed", req.user.sub, ip(req), { pidx, error: err.message });
    res.status(status).json({ error: message });
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

// GET /api/admin/transactions
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
