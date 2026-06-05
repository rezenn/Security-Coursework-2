import { Request, Response } from "express";
import User from "../models/user.model";
import config from "../config/env.config";
import {
  assessPasswordStrength,
  validatePasswordPolicy,
} from "../services/password.service";
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

const ACCESS_TOKEN_DURATION = config.jwt.accessExpires;
const REFRESH_TOKEN_DURATION = config.jwt.refreshExpires;

const createAuthCookies = (res: Response, refreshToken: string): void => {
  const maxAge =
    getTokenExpiryDate(REFRESH_TOKEN_DURATION).getTime() - Date.now();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
    maxAge,
  });
};

const getSafeIp = (req: Request): string => req.ip || "unknown";
const getSafeUserAgent = (req: Request): string =>
  Array.isArray(req.headers["user-agent"])
    ? req.headers["user-agent"][0]
    : req.headers["user-agent"] || "unknown";

const sendSecurityLoginAlert = async (
  email: string,
  username: string,
  ip: string,
  userAgent: string,
): Promise<void> => {
  await sendSecurityAlertEmail(email, username, "new_login", {
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  });
};

const createSessionRecord = async (
  user: any,
  refreshToken: string,
  ip: string,
  userAgent: string,
) => {
  user.activeRefreshTokens = user.activeRefreshTokens || [];
  user.activeRefreshTokens.push({
    tokenHash: hashToken(refreshToken),
    userAgent,
    ip,
    expiresAt: getTokenExpiryDate(REFRESH_TOKEN_DURATION),
  });
  await user.save({ validateBeforeSave: false });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, username, password } = req.body;

  const passwordPolicy = validatePasswordPolicy(password);
  const passwordStrength = assessPasswordStrength(password, [email, username]);

  if (!passwordPolicy.valid || !passwordStrength.isAcceptable) {
    res.status(400).json({
      error: "Password does not meet security requirements",
      details: {
        policy: passwordPolicy.errors,
        strength: passwordStrength,
      },
    });
    return;
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    res.status(409).json({ error: "Email or username already exists" });
    return;
  }

  const user = new User({ email, username, password });
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  user.passwordHistory.push({ hash: user.password, changedAt: new Date() });
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(email, username, verificationToken);
  logSecurityEvent("user_registered", user._id.toHexString(), getSafeIp(req), {
    email,
    username,
  });

  res.status(201).json({
    message:
      "Registration successful. Verify your email address before logging in.",
  });
};

export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.params;
  const hashed = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    res
      .status(400)
      .json({ error: "Invalid or expired email verification token" });
    return;
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save({ validateBeforeSave: false });

  logSecurityEvent("email_verified", user._id.toHexString(), getSafeIp(req), {
    email: user.email,
  });
  res.status(200).json({ message: "Email successfully verified." });
};

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
    res.status(423).json({
      error: "Account locked due to repeated failed login attempts",
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Account is disabled" });
    return;
  }

  if (!user.isEmailVerified) {
    res
      .status(403)
      .json({ error: "Please verify your email before logging in" });
    return;
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    await user.incrementFailedAttempts();
    logSecurityEvent("login_failed", user._id.toHexString(), getSafeIp(req), {
      email,
      failedAttempts: user.failedLoginAttempts,
    });
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.mfa.enabled) {
    const verified =
      verifyTOTP(user.mfa.secret!, mfaToken) ||
      (await verifyBackupCode(user.mfa.backupCodes, mfaToken)) >= 0;
    if (!verified) {
      res.status(401).json({ error: "Valid MFA token is required" });
      return;
    }
  }

  await user.resetFailedAttempts();
  user.lastLoginAt = new Date();
  user.lastLoginIp = getSafeIp(req);
  await user.save({ validateBeforeSave: false });

  const sessionId = hashToken(`${user._id}-${Date.now()}`);
  const accessToken = generateAccessToken(
    user._id.toHexString(),
    user.email,
    user.role,
    sessionId,
  );
  const refreshToken = generateRefreshToken(user._id.toHexString(), sessionId);
  const userAgent = getSafeUserAgent(req);
  await createSessionRecord(user, refreshToken, getSafeIp(req), userAgent);
  createAuthCookies(res, refreshToken);
  await sendSecurityLoginAlert(
    user.email,
    user.username,
    getSafeIp(req),
    userAgent,
  );

  logSecurityEvent("login_success", user._id.toHexString(), getSafeIp(req), {
    email,
    role: user.role,
  });

  res.status(200).json({
    message: "Login successful",
    accessToken,
    expiresIn: ACCESS_TOKEN_DURATION,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshTokenValue = req.cookies.refreshToken;
  if (!refreshTokenValue) {
    res.status(401).json({ error: "Refresh token is missing" });
    return;
  }

  try {
    const decoded = verifyRefreshToken(refreshTokenValue);

    const user = await User.findById(decoded.sub).select(
      "+activeRefreshTokens",
    );
    if (!user) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const tokenHash = hashToken(refreshTokenValue);
    const matchedSession = user.activeRefreshTokens.find(
      (item) => item.tokenHash === tokenHash && item.expiresAt > new Date(),
    );

    if (!matchedSession) {
      res.status(401).json({ error: "Refresh token is invalid or expired" });
      return;
    }

    const accessToken = generateAccessToken(
      user._id.toHexString(),
      user.email,
      user.role,
      decoded.sessionId,
    );

    res.status(200).json({ accessToken, expiresIn: ACCESS_TOKEN_DURATION });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshTokenValue = req.cookies.refreshToken;
  if (refreshTokenValue && req.user) {
    const user = await User.findById(req.user.sub).select(
      "+activeRefreshTokens",
    );
    if (user) {
      const tokenHash = hashToken(refreshTokenValue);
      user.activeRefreshTokens = user.activeRefreshTokens.filter(
        (item) => item.tokenHash !== tokenHash,
      );
      await user.save({ validateBeforeSave: false });
    }
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
  });

  logSecurityEvent("logout", req.user?.sub ?? null, getSafeIp(req), {
    userAgent: getSafeUserAgent(req),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const requestPasswordReset = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res
      .status(200)
      .json({ message: "If the email exists, a reset link will be sent." });
    return;
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  await sendPasswordResetEmail(user.email, user.username, resetToken);

  logSecurityEvent(
    "password_reset_requested",
    user._id.toHexString(),
    getSafeIp(req),
    {
      email,
    },
  );

  res
    .status(200)
    .json({ message: "If the email exists, a reset link will be sent." });
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +passwordHistory");

  if (!user) {
    res.status(400).json({ error: "Invalid or expired password reset token" });
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
    res
      .status(400)
      .json({ error: "New password cannot reuse recent password" });
    return;
  }

  user.passwordHistory.push({ hash: user.password, changedAt: new Date() });
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  await sendSecurityAlertEmail(user.email, user.username, "password_changed", {
    ip: getSafeIp(req),
    userAgent: getSafeUserAgent(req),
  });
  logSecurityEvent("password_reset", user._id.toHexString(), getSafeIp(req), {
    email: user.email,
  });

  res.status(200).json({ message: "Password reset successfully" });
};

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
    res.status(400).json({ error: "MFA is already enabled" });
    return;
  }

  const setup = await generateMFASetup(user.email);
  user.mfa.secret = setup.secret;
  user.mfa.backupCodes = setup.hashedBackupCodes;
  user.mfa.setupPending = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    message: "Scan the QR code and confirm your authenticator app.",
    qrCodeDataUrl: setup.qrCodeDataUrl,
    backupCodes: setup.backupCodes,
  });
};

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

  const totpVerified = verifyTOTP(user.mfa.secret, token);
  const backupIndex = await verifyBackupCode(user.mfa.backupCodes, token);
  if (!totpVerified && backupIndex === -1) {
    res.status(400).json({ error: "Invalid MFA token" });
    return;
  }

  if (backupIndex >= 0) {
    user.mfa.backupCodes.splice(backupIndex, 1);
  }

  user.mfa.enabled = true;
  user.mfa.setupPending = false;
  await user.save({ validateBeforeSave: false });

  logSecurityEvent("mfa_enabled", user._id.toHexString(), getSafeIp(req), {
    email: user.email,
  });
  await sendSecurityAlertEmail(user.email, user.username, "mfa_enabled", {
    ip: getSafeIp(req),
    userAgent: getSafeUserAgent(req),
  });

  res.status(200).json({ message: "MFA enabled successfully" });
};
