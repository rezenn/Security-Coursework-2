import nodemailer from "nodemailer";
import config from "../config/env.config";
import logger from "../utils/logger.utils";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: { user: config.email.user, pass: config.email.pass },
  tls: {
    rejectUnauthorized: config.env === "production",
    minVersion: "TLSv1.2",
  },
});

const base = (title: string, body: string) => `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
.c{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}
.h{background:#1e293b;color:#fff;padding:24px 32px;text-align:center}
.h h2{margin:0;font-size:22px}
.b{padding:32px}
.btn{display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin:20px 0}
.warn{background:#fef3c7;border:1px solid #f59e0b;padding:14px;border-radius:6px;margin:16px 0;font-size:14px}
.f{color:#9ca3af;font-size:12px;text-align:center;padding:20px}
code{background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:13px}
</style></head><body>
<div class="c">
<div class="h"><h2>GyanKosh</h2></div>
<div class="b">${body}</div>
<div class="f">This email was sent by GyanKosh. If you didn't request this, please ignore it.</div>
</div></body></html>`;

const send = async (to: string, subject: string, html: string) => {
  try {
    if (!config.email.user || !config.email.pass) {
      logger.info(
        `[DEV EMAIL skipped — no SMTP config] To: ${to} | ${subject}`,
      );
      return;
    }
    if (config.env !== "production" && !config.email.sendInDevelopment) {
      logger.info(`[DEV EMAIL] To: ${to} | ${subject}`);
      return;
    }
    await transporter.sendMail({ from: config.email.from, to, subject, html });
    logger.info(`Email sent to ${to}`);
  } catch (e) {
    logger.error(`Email failed to ${to}`, e);
  }
};

export const sendVerificationEmail = (
  to: string,
  username: string,
  token: string,
  code: string,
) =>
  send(
    to,
    "Verify your GyanKosh account",
    base(
      "Verify Email",
      `<h3>Welcome, ${username}!</h3>
    <p>Your verification code: <strong>${code}</strong> (expires in 24h)</p>
    <a href="${config.frontendUrl}/verify-email?token=${token}" class="btn">Verify Email</a>
    <div class="warn">⚠️ If you didn't create this account, ignore this email.</div>`,
    ),
  );

export const sendPasswordResetEmail = (
  to: string,
  username: string,
  token: string,
  code: string,
) =>
  send(
    to,
    "Reset your GyanKosh password",
    base(
      "Password Reset",
      `<h3>Password Reset Request</h3>
    <p>Hi ${username}, your reset code: <strong>${code}</strong> (expires in 15 min)</p>
    <a href="${config.frontendUrl}/reset-password/${token}" class="btn">Reset Password</a>
    <div class="warn">⚠️ If you didn't request this, change your password immediately.</div>`,
    ),
  );

export const sendSecurityAlertEmail = (
  to: string,
  username: string,
  type: "new_login" | "password_changed" | "mfa_enabled" | "account_locked",
  details: { ip?: string; userAgent?: string; timestamp?: string },
) => {
  const msgs: Record<typeof type, string> = {
    new_login: `New login detected from <code>${details.ip}</code>.`,
    password_changed: "Your password was changed.",
    mfa_enabled: "Two-factor authentication was enabled.",
    account_locked: `Account locked after repeated failed attempts from <code>${details.ip}</code>.`,
  };
  return send(
    to,
    `GyanKosh Security Alert`,
    base(
      "Security Alert",
      `<h3>Security Alert</h3><p>Hi ${username},</p><p>${msgs[type]}</p>
    <p><strong>Time:</strong> ${details.timestamp || new Date().toISOString()}</p>
    <div class="warn">⚠️ If this wasn't you, reset your password immediately.</div>`,
    ),
  );
};

// ── Risk-based authentication: new-device step-up code ──────────────────────
export const sendNewDeviceCodeEmail = (
  to: string,
  username: string,
  code: string,
  details: { ip?: string; userAgent?: string },
) =>
  send(
    to,
    "Confirm it's you — new device detected | GyanKosh",
    base(
      "Verify This Device",
      `<h3>Hi ${username},</h3>
    <p>We noticed a login attempt from a device or location we haven't seen on your account before.</p>
    <p>Verification code: <strong>${code}</strong> (expires in 10 minutes)</p>
    <p><strong>IP:</strong> <code>${details.ip || "unknown"}</code><br/>
    <strong>Device:</strong> <code>${details.userAgent || "unknown"}</code></p>
    <div class="warn">⚠️ If this wasn't you, do not share this code — change your password immediately instead.</div>`,
    ),
  );

// ── Honeytoken / admin security alerts ───────────────────────────────────────
export const sendAdminAlertEmail = (subject: string, bodyHtml: string) => {
  const to = config.email.adminAlertEmail || config.email.user;
  if (!to) return Promise.resolve();
  return send(
    to,
    `[GyanKosh SECURITY] ${subject}`,
    base("Security Alert", bodyHtml),
  );
};

export const sendPurchaseConfirmationEmail = (
  to: string,
  username: string,
  courseTitle: string,
  amountCents: number,
) =>
  send(
    to,
    `GyanKosh: Purchase Confirmed — ${courseTitle}`,
    base(
      "Purchase Confirmed",
      `<h3>Thank you, ${username}!</h3>
    <p>Your purchase of <strong>${courseTitle}</strong> is confirmed.</p>
    <p>Amount charged: <strong>$${(amountCents / 100).toFixed(2)}</strong></p>
    <a href="${config.frontendUrl}/dashboard" class="btn">Go to Dashboard</a>`,
    ),
  );
