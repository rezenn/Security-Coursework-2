import rateLimit from "express-rate-limit";
import config from "../config/env.config";

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

export const createLoginRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimit.loginWindowMs,
    max: config.rateLimit.loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || "unknown",
    skip: (req) => {

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
