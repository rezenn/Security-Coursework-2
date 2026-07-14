import rateLimit from "express-rate-limit";
import config from "../config/env.config";

const isAllowedIp = (ip: string): boolean =>
  config.ipAllowlist.some((allowed) => ip === allowed || ip === `::ffff:${allowed}`);

export const createGlobalRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isAllowedIp(req.ip || ""),
    message: { error: "Too many requests. Please try again later." },
  });

export const createLoginRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimit.loginWindowMs,
    max: config.rateLimit.loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || "unknown",
    skip: (req) => config.env === "development" && isAllowedIp(req.ip || ""),
    message: {
      error: `Too many authentication attempts. Please wait ${config.rateLimit.loginWindowMs / 60000} minutes and try again.`,
    },
  });

export const createPaymentRateLimiter = () =>
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || "unknown",
    message: { error: "Too many payment attempts. Please try again later." },
  });

export const createUrlFetchRateLimiter = () =>
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || "unknown",
    message: { error: "Too many URL import attempts. Please try again later." },
  });
