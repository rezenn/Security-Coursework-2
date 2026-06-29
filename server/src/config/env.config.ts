import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const candidates = [
  path.join(__dirname, "../.env"),
  path.join(__dirname, "../../.env"),
];
const envPath = candidates.find((p) => fs.existsSync(p));
dotenv.config({ path: envPath });

const env = process.env.NODE_ENV || "development";

const config = {
  env,
  port: parseInt(process.env.PORT || "5000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  mongodb: {
    uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gyankosh",
  },

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || "dev_access_secret_min_32_chars_padded",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_min_32_chars_padded",
    accessExpires: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  encryption: {
    key: (process.env.ENCRYPTION_KEY || "dev_encryption_key_32chars_pad00")
      .padEnd(32, "0")
      .slice(0, 32),
  },

  mfa: { appName: process.env.APP_NAME || "GyanKosh" },

  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "GyanKosh <noreply@gyankosh.com>",
    sendInDevelopment:
      process.env.EMAIL_SEND_IN_DEVELOPMENT?.toLowerCase() === "true",
  },

  recaptcha: {
    secret: process.env.RECAPTCHA_SECRET_KEY || "",
    enabled: env === "production" && !!process.env.RECAPTCHA_SECRET_KEY,
  },

  // Khalti payment gateway
  khalti: {
    secretKey: process.env.KHALTI_SECRET_KEY || "",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || "10", 10),
    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || "900000", 10),
  },

  cookie: {
    secret: process.env.COOKIE_SECRET || "dev_cookie_secret_change_me",
  },

  lockout: {
    maxFailedAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
    durationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || "15", 10),
  },

  ipAllowlist: (process.env.IP_ALLOWLIST || "127.0.0.1,::1")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export default config;
