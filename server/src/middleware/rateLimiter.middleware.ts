// import rateLimit from "express-rate-limit";
// import config from "../config/env.config";

// export const createGlobalRateLimiter = () =>
//   rateLimit({
//     windowMs: config.rateLimit.windowMs,
//     max: config.rateLimit.max,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: {
//       error: "Too many requests. Please try again later.",
//     },
//   });

// export const createLoginRateLimiter = () =>
//   rateLimit({
//     windowMs: config.rateLimit.loginWindowMs,
//     max: config.rateLimit.loginMax,
//     standardHeaders: true,
//     legacyHeaders: false,
//     keyGenerator: (req) => req.ip || "unknown",
//     message: {
//       error:
//         "Too many authentication attempts. Please wait and try again later.",
//     },
//   });

import rateLimit from "express-rate-limit";
import config from "../config/env.config";

// ── Global limiter ────────────────────────────────────────────────────────────
// 100 requests per 15 min per IP by default.
export const createGlobalRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests. Please try again later.",
    },
  });

// ── Login / sensitive-auth limiter ───────────────────────────────────────────
// Security rationale (OWASP WSTG-AUTHN-03):
//   Production: 10 attempts per 15 min — enough for real users, hard for brute-force.
//   Development: 50 attempts per 15 min — so you can test without constantly waiting.
//
// To customise, set these env vars in your .env:
//   LOGIN_RATE_LIMIT_MAX=10
//   LOGIN_RATE_LIMIT_WINDOW_MS=900000   (15 minutes in milliseconds)
//
// If you hit 429 while testing, just wait for the window to expire,
// OR set LOGIN_RATE_LIMIT_MAX=50 in your .env for dev.
export const createLoginRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimit.loginWindowMs,
    max: config.rateLimit.loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || "unknown",
    skip: (req) => {
      // In development, skip rate-limiting for localhost (127.0.0.1 / ::1)
      // so you can test auth flows without waiting.
      // Remove or set NODE_ENV=production to enforce limits.
      if (config.env === "development") {
        const ip = req.ip || "";
        if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") {
          return true;
        }
      }
      return false;
    },
    message: {
      error:
        "Too many authentication attempts. Please wait 15 minutes and try again.",
    },
  });
