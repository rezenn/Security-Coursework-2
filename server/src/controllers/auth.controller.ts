import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
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
import { encryptField } from "../utils/encryption.utils";

const ip = (req: Request) => req.ip || "unknown";
const ua = (req: Request) =>
  Array.isArray(req.headers["user-agent"])
    ? req.headers["user-agent"][0]
    : req.headers["user-agent"] || "unknown";

const setRefreshCookie = (res: Response, token: string) => {
  const maxAge =
    getTokenExpiryDate(config.jwt.refreshExpires).getTime() - Date.now();
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
    maxAge,
  });
};

// ── Helper: issue tokens and attach cookie ────────────────────────────────────
const issueSession = async (user: IUser, req: Request, res: Response) => {
  const userDoc = await User.findById(user._id).select("+activeRefreshTokens");
  if (!userDoc) throw new Error("User not found after session issue");

  const sessionId = hashToken(`${user._id}-${Date.now()}`);
  const accessToken = generateAccessToken(
    user._id.toHexString(),
    user.email,
    user.role,
    sessionId,
  );
  const refreshToken = generateRefreshToken(user._id.toHexString(), sessionId);

  userDoc.activeRefreshTokens = userDoc.activeRefreshTokens || [];
  // Limit to 5 concurrent sessions
  if (userDoc.activeRefreshTokens.length >= 5) {
    userDoc.activeRefreshTokens = userDoc.activeRefreshTokens.slice(-4);
  }
  userDoc.activeRefreshTokens.push({
    tokenHash: hashToken(refreshToken),
    userAgent: ua(req),
    ip: encryptField(ip(req)),
    createdAt: new Date(),
    expiresAt: getTokenExpiryDate(config.jwt.refreshExpires),
  });
  userDoc.lastLoginAt = new Date();
  userDoc.lastLoginIp = encryptField(ip(req));
  await userDoc.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);
  return { accessToken, sessionId };
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const username = (req.body.username as string)?.trim().replace(/\s+/g, "_");

  if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    res.status(400).json({
      error: "Username can only contain letters, numbers, hyphens, underscores",
    });
    return;
  }

  const policy = validatePasswordPolicy(password);
  if (!policy.valid) {
    res.status(400).json({
      error: "Password does not meet requirements",
      details: policy.errors,
    });
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
    await User.findByIdAndUpdate(user._id, {
      $push: {
        passwordHistory: { hash: user.password, changedAt: new Date() },
      },
    });
    await sendVerificationEmail(
      email,
      username,
      verification.token,
      verification.code,
    );
    logSecurityEvent("user_registered", user._id.toHexString(), ip(req), {
      email,
      username,
    });
    res.status(201).json({
      message:
        "Registration successful. Check your email to verify your account.",
    });
  } catch (err: any) {
    if (err.name === "ValidationError") {
      const msgs = Object.values(err.errors as Record<string, any>).map(
        (e: any) => e.message,
      );
      res.status(400).json({ error: msgs.join(". ") });
      return;
    }
    throw err;
  }
};

// ── GET|POST /api/auth/verify-email ──────────────────────────────────────────
export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

  logSecurityEvent("email_verified", user._id.toHexString(), ip(req), {
    email: user.email,
  });
  res.status(200).json({ message: "Email verified successfully." });
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, mfaToken } = req.body;

  const user = await User.findOne({ email }).select(
    "+password +mfa.secret +mfa.backupCodes +failedLoginAttempts +lockedUntil +activeRefreshTokens",
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Google-only accounts have no password
  if (user.provider === "google" && !user.password) {
    res.status(400).json({
      error:
        "This account uses Google Sign-In. Please use the Google button to log in.",
    });
    return;
  }

  if (user.isLocked()) {
    logSecurityEvent("login_blocked_locked", user._id.toHexString(), ip(req), {
      email,
    });
    const remaining = Math.ceil(
      (user.lockedUntil!.getTime() - Date.now()) / 60000,
    );
    res
      .status(423)
      .json({ error: `Account locked. Try again in ${remaining} minute(s).` });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Account is disabled. Contact support." });
    return;
  }

  if (!user.isEmailVerified) {
    res
      .status(403)
      .json({ error: "Please verify your email before logging in." });
    return;
  }

  if (!(await user.comparePassword(password))) {
    await user.incrementFailedAttempts();
    logSecurityEvent("login_failed", user._id.toHexString(), ip(req), {
      email,
      attempts: user.failedLoginAttempts,
    });
    const remaining =
      config.lockout.maxFailedAttempts - user.failedLoginAttempts;
    res.status(401).json({
      error:
        remaining > 0
          ? `Invalid email or password. ${remaining} attempt(s) remaining.`
          : "Account locked due to too many failed attempts.",
    });
    return;
  }

  // MFA check
  if (user.mfa.enabled) {
    if (!mfaToken) {
      const tempToken = generateAccessToken(
        user._id.toHexString(),
        user.email,
        user.role,
        hashToken(`${user._id}-mfa-${Date.now()}`),
        "3m",
      );
      res.status(200).json({ mfaRequired: true, tempToken });
      return;
    }
    const validTOTP = verifyTOTP(user.mfa.secret!, mfaToken);
    const backupIdx = validTOTP
      ? -1
      : await verifyBackupCode(user.mfa.backupCodes, mfaToken);
    if (!validTOTP && backupIdx === -1) {
      res.status(401).json({ error: "Invalid MFA code" });
      return;
    }
    // Consume backup code if used
    if (backupIdx >= 0) {
      user.mfa.backupCodes.splice(backupIdx, 1);
      await user.save({ validateBeforeSave: false });
    }
  }

  await user.resetFailedAttempts();
  const { accessToken } = await issueSession(user, req, res);

  sendSecurityAlertEmail(user.email, user.username, "new_login", {
    ip: ip(req),
    userAgent: ua(req),
    timestamp: new Date().toISOString(),
  }).catch(() => {});

  logSecurityEvent("login_success", user._id.toHexString(), ip(req), {
    email,
    role: user.role,
  });

  res.status(200).json({
    message: "Login successful",
    accessToken,
    expiresIn: config.jwt.accessExpires,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      mfaEnabled: user.mfa.enabled,
      provider: user.provider,
      profile: user.profile,
    },
  });
};

// ── GET /api/auth/google ──────────────────────────────────────────────────────
// Handled by passport middleware in routes

// ── GET /api/auth/google/callback ────────────────────────────────────────────
export const googleCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = req.user as IUser | undefined;
  if (!user) {
    res.redirect(`${config.frontendUrl}/login?error=google_failed`);
    return;
  }

  try {
    const { accessToken } = await issueSession(user, req, res);
    logSecurityEvent("google_login", user._id.toHexString(), ip(req), {
      email: user.email,
    });

    // Redirect to frontend with token as query param (client reads it once and stores in cookie)
    res.redirect(
      `${config.frontendUrl}/auth/google/success?token=${encodeURIComponent(accessToken)}&role=${user.role}`,
    );
  } catch {
    res.redirect(`${config.frontendUrl}/login?error=google_session_failed`);
  }
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const token = req.cookies.refreshToken;
  if (!token) {
    res.status(401).json({ error: "Refresh token missing" });
    return;
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.sub).select(
      "+activeRefreshTokens",
    );
    if (!user) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    const tokenHash = hashToken(token);
    const session = user.activeRefreshTokens.find(
      (s) => s.tokenHash === tokenHash && s.expiresAt > new Date(),
    );
    if (!session) {
      res.status(401).json({ error: "Session expired or revoked" });
      return;
    }

    const accessToken = generateAccessToken(
      user._id.toHexString(),
      user.email,
      user.role,
      decoded.sessionId,
    );
    res.status(200).json({ accessToken, expiresIn: config.jwt.accessExpires });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies.refreshToken;
  if (token && req.user) {
    const user = await User.findById(req.user.sub).select(
      "+activeRefreshTokens",
    );
    if (user) {
      const th = hashToken(token);
      user.activeRefreshTokens = user.activeRefreshTokens.filter(
        (s) => s.tokenHash !== th,
      );
      await user.save({ validateBeforeSave: false });
    }
  }
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
  });
  logSecurityEvent("logout", req.user?.sub ?? null, ip(req), {});
  res.status(200).json({ message: "Logged out successfully" });
};

// ── POST /api/auth/request-password-reset ─────────────────────────────────────
export const requestPasswordReset = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Always 200 to prevent email enumeration
  if (!user) {
    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent." });
    return;
  }
  if (user.provider === "google") {
    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent." });
    return;
  }
  const reset = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  await sendPasswordResetEmail(
    user.email,
    user.username,
    reset.token,
    reset.code,
  );
  logSecurityEvent(
    "password_reset_requested",
    user._id.toHexString(),
    ip(req),
    { email },
  );
  res
    .status(200)
    .json({ message: "If that email exists, a reset link has been sent." });
};

// ── POST /api/auth/reset-password/:token ──────────────────────────────────────
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const policy = validatePasswordPolicy(password);
  if (!policy.valid) {
    res.status(400).json({
      error: "Password does not meet requirements",
      details: policy.errors,
    });
    return;
  }

  if (await user.isPasswordInHistory(password)) {
    res.status(400).json({ error: "Cannot reuse a recent password." });
    return;
  }

  user.passwordHistory.push({ hash: user.password, changedAt: new Date() });
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.passwordResetCode = null;
  user.passwordResetCodeExpires = null;
  await user.save();

  await sendSecurityAlertEmail(user.email, user.username, "password_changed", {
    ip: ip(req),
  });
  logSecurityEvent("password_reset", user._id.toHexString(), ip(req), {
    email: user.email,
  });
  res.status(200).json({ message: "Password reset successfully." });
};

// ── POST /api/auth/mfa/setup ──────────────────────────────────────────────────
export const createMFASetup = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const user = await User.findById(req.user.sub).select(
    "+mfa.secret +mfa.backupCodes",
  );
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.mfa.enabled) {
    res.status(400).json({ error: "MFA already enabled" });
    return;
  }

  const setup = await generateMFASetup(user.email);
  user.mfa.secret = setup.secret;
  user.mfa.backupCodes = setup.hashedBackupCodes;
  user.mfa.setupPending = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    qrCodeDataUrl: setup.qrCodeDataUrl,
    backupCodes: setup.backupCodes,
  });
};

// ── POST /api/auth/mfa/confirm ────────────────────────────────────────────────
export const confirmMFASetup = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.body;
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const user = await User.findById(req.user.sub).select(
    "+mfa.secret +mfa.backupCodes",
  );
  if (!user || !user.mfa.secret) {
    res.status(404).json({ error: "MFA setup not found" });
    return;
  }

  if (!verifyTOTP(user.mfa.secret, token)) {
    res.status(400).json({ error: "Invalid MFA token" });
    return;
  }

  user.mfa.enabled = true;
  user.mfa.setupPending = false;
  await user.save({ validateBeforeSave: false });

  logSecurityEvent("mfa_enabled", user._id.toHexString(), ip(req), {});
  await sendSecurityAlertEmail(user.email, user.username, "mfa_enabled", {
    ip: ip(req),
  });
  res.status(200).json({ message: "MFA enabled successfully." });
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const user = await User.findById(req.user.sub).populate(
    "enrolledCourses",
    "title slug thumbnail category level",
  );
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.status(200).json({ user });
};
