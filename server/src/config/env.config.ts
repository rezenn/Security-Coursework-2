import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const candidateEnvPaths = [
  path.join(__dirname, "../.env"),
  path.join(__dirname, "../../.env"),
];

const envPath = candidateEnvPaths.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const env = process.env.NODE_ENV || "development";

const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "ENCRYPTION_KEY",
  "COOKIE_SECRET",
];

requiredEnvVars.forEach((key) => {
  if (key === "MONGODB_URI") {
    if (env === "production") {
      if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        throw new Error(`FATAL: Missing required environment variable: ${key}`);
      }
    }
    return;
  }

  if (!process.env[key]) {
    throw new Error(`FATAL: Missing required environment variable: ${key}`);
  }
});

if (env === "production") {
  if ((process.env.JWT_ACCESS_SECRET?.length ?? 0) < 64) {
    throw new Error(
      "FATAL: JWT_ACCESS_SECRET must be at least 64 characters in production",
    );
  }
}

const config = {
  env,
  port: parseInt(process.env.PORT || "5000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  mongodb: {
    uri:
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/gyankosh",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpires:
      process.env.JWT_ACCESS_EXPIRES ||
      process.env.JWT_ACCESS_EXPIRES_IN ||
      "15m",
    refreshExpires:
      process.env.JWT_REFRESH_EXPIRES ||
      process.env.JWT_REFRESH_EXPIRES_IN ||
      "7d",
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY!,
  },

  mfa: {
    appName: process.env.MFA_APP_NAME || "SecureApp",
  },

  email: {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(
      process.env.EMAIL_PORT || process.env.SMTP_PORT || "587",
      10,
    ),
    user: process.env.EMAIL_USER || process.env.SMTP_USER || "",
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@secureapp.com",
    sendInDevelopment:
      process.env.EMAIL_SEND_IN_DEVELOPMENT?.toLowerCase() === "true",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || "5", 10),
    loginWindowMs: parseInt(
      process.env.LOGIN_RATE_LIMIT_WINDOW_MS || "900000",
      10,
    ),
  },

  cookie: {
    secret: process.env.COOKIE_SECRET!,
    sessionTimeoutMinutes: parseInt(
      process.env.SESSION_TIMEOUT_MINUTES || "30",
      10,
    ),
  },

  lockout: {
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || "5", 10),
    durationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || "30", 10),
  },
};

export default config;
