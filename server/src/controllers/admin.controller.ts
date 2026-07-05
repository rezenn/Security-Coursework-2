import { Request, Response } from "express";
import User from "../models/user.model";
import { logSecurityEvent } from "../utils/logger.utils";
import fs from "fs";
import path from "path";
import { safeSearchRegex } from "../utils/sanitize.utils";
const ip = (req: Request) => req.ip || "unknown";

// GET /api/admin/users
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { page = "1", limit = "20", search } = req.query;
  const filter: Record<string, unknown> = {};
  if (search && typeof search === "string") {
    const searchRegex = safeSearchRegex(search);
    filter.$or = [
      { email: { $regex: searchRegex } },
      { username: { $regex: searchRegex } },
    ];
  }
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const [users, total] = await Promise.all([
    User.find(filter)
      .select(
        "-password -mfa.secret -mfa.backupCodes -passwordHistory -activeRefreshTokens",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    User.countDocuments(filter),
  ]);
  res.status(200).json({ users, total });
};

// PATCH /api/admin/users/:id/toggle-active
export const toggleUserActive = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  // Prevent admin from deactivating themselves
  if (req.params.id === req.user.sub) {
    res.status(400).json({ error: "Cannot modify your own account status" });
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    [{ $set: { isActive: { $not: "$isActive" } } }],
    { new: true },
  );
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  logSecurityEvent("admin_toggle_user", req.user.sub, ip(req), {
    targetId: req.params.id,
    isActive: user.isActive,
  });
  res.status(200).json({
    message: `User ${user.isActive ? "activated" : "deactivated"}`,
    isActive: user.isActive,
  });
};

// DELETE /api/admin/users/:id
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.params.id === req.user.sub) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  logSecurityEvent("admin_delete_user", req.user.sub, ip(req), {
    targetId: req.params.id,
  });
  res.status(200).json({ message: "User deleted" });
};

// GET /api/admin/logs — returns recent audit log lines
export const getAuditLogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const logsDir = path.join(__dirname, "../../logs");
  const today = new Date().toISOString().split("T")[0];
  const logFile = path.join(logsDir, `audit-${today}.log`);

  if (!fs.existsSync(logFile)) {
    res.status(200).json({ logs: [] });
    return;
  }

  const lines = fs
    .readFileSync(logFile, "utf8")
    .split("\n")
    .filter(Boolean)
    .slice(-200) // last 200 events
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();

  res.status(200).json({ logs: lines });
};

// GET /api/admin/stats
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  const { default: Course } = await import("../models/course.model");
  const { default: Transaction } = await import("../models/transaction.model");

  const [totalUsers, totalCourses, totalTransactions, revenueAgg] =
    await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Transaction.countDocuments({ status: "completed" }),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amountCents" } } },
      ]),
    ]);

  res.status(200).json({
    totalUsers,
    totalCourses,
    totalTransactions,
    totalRevenueCents: revenueAgg[0]?.total ?? 0,
  });
};
