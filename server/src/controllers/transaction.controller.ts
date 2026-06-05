import { Request, Response } from "express";
import Transaction from "../models/transaction.model";
import { logSecurityEvent } from "../utils/logger.utils";
import { signTransaction } from "../services/transaction.service";

export const purchaseResource = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { resourceId, amountCents, currency = "USD" } = req.body;
  const normalizedCurrency = currency.toUpperCase();
  const timestamp = new Date().toISOString();
  const signature = signTransaction(
    req.user.sub,
    resourceId,
    Number(amountCents),
    normalizedCurrency,
    timestamp,
  );

  const transaction = await Transaction.create({
    user: req.user.sub,
    resourceId,
    amountCents: Number(amountCents),
    currency: normalizedCurrency,
    status: "completed",
    signature,
  });

  logSecurityEvent("resource_purchase", req.user.sub, req.ip || "unknown", {
    transactionId: transaction._id,
    resourceId,
    amountCents,
    currency: normalizedCurrency,
  });

  res.status(201).json({
    message: "Purchase recorded successfully",
    transactionId: transaction._id,
    signature,
  });
};

export const listUserTransactions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const transactions = await Transaction.find({ user: req.user.sub }).sort({
    createdAt: -1,
  });
  res.status(200).json({ transactions });
};
