import { Request, Response } from "express";
import User from "../models/user.model";
import { logSecurityEvent } from "../utils/logger.utils";
import { validatePasswordPolicy } from "../services/password.service";

const ip = (req: Request) => req.ip || "unknown";

// GET /api/profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const user = await User.findById(req.user.sub).populate("enrolledCourses", "title slug thumbnail level category");
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.status(200).json({ user });
};

// PATCH /api/profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }

  // Whitelist only safe profile fields — prevents mass assignment
  const allowed = ["firstName", "lastName", "bio", "avatarUrl"];
  const updates: Record<string, unknown> = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[`profile.${f}`] = req.body[f]; });

  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  logSecurityEvent("profile_updated", user._id.toHexString(), ip(req), { fields: Object.keys(updates) });
  res.status(200).json({ message: "Profile updated", profile: user.profile });
};

// POST /api/profile/change-password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.sub).select("+password +passwordHistory");
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (!await user.comparePassword(currentPassword)) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const policy = validatePasswordPolicy(newPassword);
  if (!policy.valid) { res.status(400).json({ error: "Password policy violation", details: policy.errors }); return; }

  if (await user.isPasswordInHistory(newPassword)) {
    res.status(400).json({ error: "Cannot reuse a recent password." });
    return;
  }

  user.passwordHistory.push({ hash: user.password, changedAt: new Date() });
  user.password = newPassword;
  await user.save();

  logSecurityEvent("password_changed", user._id.toHexString(), ip(req), {});
  res.status(200).json({ message: "Password changed successfully." });
};

// GET /api/profile/export — GDPR-style data export
export const exportProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const user = await User.findById(req.user.sub).populate("enrolledCourses", "title");
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  logSecurityEvent("profile_exported", user._id.toHexString(), ip(req), {});
  res.setHeader("Content-Disposition", "attachment; filename=gyankosh-profile.json");
  res.status(200).json({
    exportedAt: new Date().toISOString(),
    id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    profile: user.profile,
    enrolledCourses: user.enrolledCourses,
    createdAt: user.createdAt,
  });
};
