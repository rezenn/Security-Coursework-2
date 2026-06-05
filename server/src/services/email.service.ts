import nodemailer from "nodemailer";
import config from "../config/env.config";
import logger from "../utils/logger.utils";

// ─── Create transporter ───────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    rejectUnauthorized: config.env === "production", // Enforce cert check in prod
    minVersion: "TLSv1.2",
  },
});

// ─── Base HTML template ───────────────────────────────────────────────────────
const baseTemplate = (title: string, content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; }
    .header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .button { display: inline-block; background: #e94560; color: white; padding: 12px 30px;
              text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { color: #999; font-size: 12px; text-align: center; margin-top: 30px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>SecureApp</h2></div>
    <div style="padding: 30px 0;">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent from SecureApp. If you didn't request this, please ignore it.</p>
      <p>For security, links expire after the stated time period.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send verification email ──────────────────────────────────────────────────
export const sendVerificationEmail = async (
  to: string,
  username: string,
  token: string,
): Promise<void> => {
  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;

  const content = `
    <h3>Welcome, ${username}!</h3>
    <p>Please verify your email address to activate your account.</p>
    <p>This link expires in <strong>24 hours</strong>.</p>
    <a href="${verifyUrl}" class="button">Verify Email Address</a>
    <div class="warning">
      ⚠️ If you did not create an account, please ignore this email. No action is required.
    </div>
    <p>Or copy this link: <code>${verifyUrl}</code></p>
  `;

  await sendEmail(
    to,
    "Verify your SecureApp account",
    baseTemplate("Email Verification", content),
  );
};

// ─── Send password reset email ────────────────────────────────────────────────
export const sendPasswordResetEmail = async (
  to: string,
  username: string,
  token: string,
): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  const content = `
    <h3>Password Reset Request</h3>
    <p>Hi ${username}, we received a request to reset your password.</p>
    <p>This link expires in <strong>15 minutes</strong>.</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <div class="warning">
      ⚠️ If you didn't request a password reset, your account may be at risk.
      Please <a href="${config.frontendUrl}/login">login</a> and change your password immediately.
    </div>
  `;

  await sendEmail(
    to,
    "Reset your SecureApp password",
    baseTemplate("Password Reset", content),
  );
};

// ─── Send security alert email ────────────────────────────────────────────────
export const sendSecurityAlertEmail = async (
  to: string,
  username: string,
  alertType:
    | "new_login"
    | "account_locked"
    | "password_changed"
    | "mfa_enabled",
  details: { ip?: string; userAgent?: string; timestamp?: string },
): Promise<void> => {
  const messages: Record<typeof alertType, string> = {
    new_login: `A new login to your account was detected from IP <code>${details.ip}</code>.`,
    account_locked: `Your account has been temporarily locked due to multiple failed login attempts from IP <code>${details.ip}</code>.`,
    password_changed: "Your password was successfully changed.",
    mfa_enabled: "Two-factor authentication has been enabled on your account.",
  };

  const content = `
    <h3>Security Alert</h3>
    <p>Hi ${username},</p>
    <p>${messages[alertType]}</p>
    <p><strong>Time:</strong> ${details.timestamp || new Date().toISOString()}</p>
    <div class="warning">
      ⚠️ If this wasn't you, please reset your password immediately.
    </div>
  `;

  await sendEmail(
    to,
    `SecureApp Security Alert: ${alertType.replace(/_/g, " ")}`,
    baseTemplate("Security Alert", content),
  );
};

// ─── Core send function ───────────────────────────────────────────────────────
const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<void> => {
  try {
    const canSendEmail =
      config.env === "production" || config.email.sendInDevelopment;

    if (!config.email.host || !config.email.user || !config.email.pass) {
      logger.warn(
        "Email configuration incomplete. Skipping SMTP send. Check SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.",
      );
      logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    if (!canSendEmail) {
      logger.info(
        `[DEV EMAIL] To: ${to} | Subject: ${subject} | Email sending disabled in development. Set EMAIL_SEND_IN_DEVELOPMENT=true to enable SMTP sending.`,
      );
      return;
    }

    await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });

    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    // Never throw — email failure shouldn't crash the app
    logger.error(`Failed to send email to ${to}:`, error);
  }
};
