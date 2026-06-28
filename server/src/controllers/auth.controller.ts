import { Request, Response } from "express";
import User from "../models/user.model";
import config from "../config/env.config";
import { validatePasswordPolicy } from "../services/password.service";
import {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiryDate,
  hashToken,
  verifyRefreshToken,
} from "../services/token.service";
import {
  sendPasswordResetEmail,
  sendSecurityAlertEmail,
  sendVerificationEmail,
} from "../services/email.service";
import {
  generateMFASetup,
  verifyBackupCode,
  verifyTOTP,
} from "../services/mfa.service";
import { logSecurityEvent } from "../utils/logger.utils";

const ip = (req: Request) => req.ip || "unknown";
const ua = (req: Request) =>
  Array.isArray(req.headers["user-agent"])
    ? req.headers["user-agent"][0]
    : req.headers["user-agent"] || "unknown";

const setRefreshCookie = (res: Response, token: string) => {
  const maxAge = getTokenExpiryDate(config.jwt.refreshExpires).getTime() - Date.now();
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
    maxAge,
  });
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const username = (req.body.username as string)?.trim().replace(/\s+/g, "_");

  if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    res.status(400).json({ error: "Username can only contain letters, numbers, hyphens, underscores" });
    return;
  }

  const policy = validatePasswordPolicy(password);
  if (!policy.valid) {
    res.status(400).json({ error: "Password does not meet requirements", details: policy.errors });
    return;
  }

  if (await User.findOne({ $or: [{ email }, { username }] })) {
    res.status(409).json({ error: "Email or username already exists" });
    return;
  }

  try {
    const user = new User({ email, username, password });
    const verification = user.generateEmailVerificationToken();
    await user.save();
    // Save initial password to history
    await User.findByIdAndUpdate(user._id, {
      $push: { passwordHistory: { hash: user.password, changedAt: new Date() } },
    });
    await sendVerificationEmail(email, username, verification.token, verification.code);
    logSecurityEvent("user_registered", user._id.toHexString(), ip(req), { email, username });
    res.status(201).json({ message: "Registration successful. Check your email to verify your account." });
  } catch (err: any) {
    if (err.name === "ValidationError") {
      const msgs = Object.values(err.errors as Record<string, any>).map((e: any) => e.message);
      res.status(400).json({ error: msgs.join(". ") });
      return;
    }
    throw err;
  }
};

// POST /api/auth/verify-email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { email, code } = req.body;

  let user;
  if (token) {
    user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });
  } else if (email && code) {
    user = await User.findOne({
      email,
      emailVerificationCode: hashToken(code),
      emailVerificationCodeExpires: { $gt: new Date() },
    });
  } else {
    res.status(400).json({ error: "Verification token or code is required" });
    return;
  }

  if (!user) {
    res.status(400).json({ error: "Invalid or expired verification token" });
    return;
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  user.emailVerificationCode = null;
  user.emailVerificationCodeExpires = null;
  await user.save({ validateBeforeSave: false });

  logSecurityEvent("email_verified", user._id.toHexString(), ip(req), { email: user.email });
  res.status(200).json({ message: "Email verified successfully." });
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, mfaToken } = req.body;

  const user = await User.findOne({ email }).select(
    "+password +mfa.secret +mfa.backupCodes +failedLoginAttempts +lockedUntil +activeRefreshTokens",
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.isLocked()) {
    logSecurityEvent("login_blocked_locked", user._id.toHexString(), ip(req), { email });
    res.status(423).json({ error: "Account locked due to repeated failed attempts. Try again later." });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Account is disabled. Contact support." });
    return;
  }

  if (!user.isEmailVerified) {
    res.status(403).json({ error: "Please verify your email before logging in." });
    return;
  }

  if (!await user.comparePassword(password)) {
    await user.incrementFailedAttempts();
    logSecurityEvent("login_failed", user._id.toHexString(), ip(req), { email, attempts: user.failedLoginAttempts });
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // MFA check
  if (user.mfa.enabled) {
    if (!mfaToken) {
      const tempToken = generateAccessToken(user._id.toHexString(), user.email, user.role, hashToken(`${user._id}-${Date.now()}`), "3m");
      res.status(200).json({ mfaRequired: true, tempToken });
      return;
    }
    const valid =
      verifyTOTP(user.mfa.secret!, mfaToken) ||
      (await verifyBackupCode(user.mfa.backupCodes, mfaToken)) >= 0;
    if (!valid) {
      res.status(401).json({ error: "Invalid MFA token" });
      return;
    }
  }

  await user.resetFailedAttempts();
  user.lastLoginAt = new Date();
  user.lastLoginIp = ip(req);
  await user.save({ validateBeforeSave: false });

  const sessionId = hashToken(`${user._id}-${Date.now()}`);
  const accessToken = generateAccessToken(user._id.toHexString(), user.email, user.role, sessionId);
  const refreshToken = generateRefreshToken(user._id.toHexString(), sessionId);

  user.activeRefreshTokens = user.activeRefreshTokens || [];
  user.activeRefreshTokens.push({
    tokenHash: hashToken(refreshToken),
    userAgent: ua(req),
    ip: ip(req),
    createdAt: new Date(),
    expiresAt: getTokenExpiryDate(config.jwt.refreshExpires),
  });
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);
  sendSecurityAlertEmail(user.email, user.username, "new_login", { ip: ip(req), userAgent: ua(req), timestamp: new Date().toISOString() });

  logSecurityEvent("login_success", user._id.toHexString(), ip(req), { email, role: user.role });

  // Return role so frontend can redirect appropriately
  res.status(200).json({
    message: "Login successful",
    accessToken,
    expiresIn: config.jwt.accessExpires,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      mfaEnabled: user.mfa.enabled,
      profile: user.profile,
    },
  });
};

// POST /api/auth/refresh
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies.refreshToken;
  if (!token) { res.status(401).json({ error: "Refresh token missing" }); return; }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.sub).select("+activeRefreshTokens");
    if (!user) { res.status(401).json({ error: "Invalid session" }); return; }

    const tokenHash = hashToken(token);
    const session = user.activeRefreshTokens.find(
      (s) => s.tokenHash === tokenHash && s.expiresAt > new Date(),
    );
    if (!session) { res.status(401).json({ error: "Session expired" }); return; }

    const accessToken = generateAccessToken(user._id.toHexString(), user.email, user.role, decoded.sessionId);
    res.status(200).json({ accessToken, expiresIn: config.jwt.accessExpires });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies.refreshToken;
  if (token && req.user) {
    const user = await User.findById(req.user.sub).select("+activeRefreshTokens");
    if (user) {
      const th = hashToken(token);
      user.activeRefreshTokens = user.activeRefreshTokens.filter((s) => s.tokenHash !== th);
      await user.save({ validateBeforeSave: false });
    }
  }
  res.clearCookie("refreshToken", { httpOnly: true, secure: config.env === "production", sameSite: "strict" });
  logSecurityEvent("logout", req.user?.sub ?? null, ip(req), {});
  res.status(200).json({ message: "Logged out successfully" });
};

// POST /api/auth/request-password-reset
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Always return 200 to prevent email enumeration
  if (!user) { res.status(200).json({ message: "If the email exists, a reset link has been sent." }); return; }

  const reset = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  await sendPasswordResetEmail(user.email, user.username, reset.token, reset.code);
  logSecurityEvent("password_reset_requested", user._id.toHexString(), ip(req), { email });
  res.status(200).json({ message: "If the email exists, a reset link has been sent." });
};

// POST /api/auth/reset-password/:token  OR  POST /api/auth/reset-password (code)
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { email, code, password } = req.body;

  let user;
  if (token) {
    user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordHistory");
  } else if (email && code) {
    user = await User.findOne({
      email,
      passwordResetCode: hashToken(code),
      passwordResetCodeExpires: { $gt: new Date() },
    }).select("+password +passwordHistory");
  } else {
    res.status(400).json({ error: "Reset token or email+code required" });
    return;
  }

  if (!user) { res.status(400).json({ error: "Invalid or expired reset token" }); return; }

  const policy = validatePasswordPolicy(password);
  if (!policy.valid) { res.status(400).json({ error: "Password does not meet requirements", details: policy.errors }); return; }

  if (await user.isPasswordInHistory(password)) {
    res.status(400).json({ error: "You cannot reuse a recent password. Please choose a different one." });
    return;
  }

  user.passwordHistory.push({ hash: user.password, changedAt: new Date() });
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.passwordResetCode = null;
  user.passwordResetCodeExpires = null;
  await user.save();

  await sendSecurityAlertEmail(user.email, user.username, "password_changed", { ip: ip(req) });
  logSecurityEvent("password_reset", user._id.toHexString(), ip(req), { email: user.email });
  res.status(200).json({ message: "Password reset successfully. You can now log in." });
};

// POST /api/auth/mfa/setup
export const createMFASetup = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const user = await User.findById(req.user.sub).select("+mfa.secret +mfa.backupCodes");
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.mfa.enabled) { res.status(400).json({ error: "MFA already enabled" }); return; }

  const setup = await generateMFASetup(user.email);
  user.mfa.secret = setup.secret;
  user.mfa.backupCodes = setup.hashedBackupCodes;
  user.mfa.setupPending = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    message: "Scan the QR code with your authenticator app.",
    qrCodeDataUrl: setup.qrCodeDataUrl,
    backupCodes: setup.backupCodes,
  });
};

// POST /api/auth/mfa/confirm
export const confirmMFASetup = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const user = await User.findById(req.user.sub).select("+mfa.secret +mfa.backupCodes");
  if (!user || !user.mfa.secret) { res.status(404).json({ error: "MFA setup not found" }); return; }

  const ok = verifyTOTP(user.mfa.secret, token);
  if (!ok) { res.status(400).json({ error: "Invalid MFA token" }); return; }

  user.mfa.enabled = true;
  user.mfa.setupPending = false;
  await user.save({ validateBeforeSave: false });

  logSecurityEvent("mfa_enabled", user._id.toHexString(), ip(req), {});
  await sendSecurityAlertEmail(user.email, user.username, "mfa_enabled", { ip: ip(req) });
  res.status(200).json({ message: "MFA enabled successfully." });
};

// GET /api/auth/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const user = await User.findById(req.user.sub).populate("enrolledCourses", "title slug thumbnail");
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.status(200).json({ user });
};
