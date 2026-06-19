import { Request, Response } from "express";
import User from "../models/user.model";
import { logSecurityEvent } from "../utils/logger.utils";

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const user = await User.findById(req.user.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json({
    id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    mfaEnabled: user.mfa.enabled,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const updates: Record<string, unknown> = {};
  const allowedFields = ["firstName", "lastName", "bio", "avatarUrl"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { $set: { profile: updates } },
    { new: true, runValidators: true, context: "query" },
  );

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  logSecurityEvent(
    "profile_updated",
    user._id.toHexString(),
    req.ip || "unknown",
    { updatedFields: Object.keys(updates) },
  );

  res.status(200).json({ message: "Profile updated", profile: user.profile });
};

export const exportProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const user = await User.findById(req.user.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.setHeader("Content-Disposition", "attachment; filename=profile.json");
  res.status(200).json({
    id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};
