import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import config from "../config/env.config";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export const issueCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Issue (or refresh) a CSRF cookie on every response if not already present
  if (!req.cookies[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // MUST be readable by client JS for double-submit to work
      secure: config.env === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // matches refresh token lifetime
    });
  }
  next();
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const EXEMPT_PATHS = new Set([
  "/api/auth/login", // issues the session; no prior CSRF cookie to check
  "/api/auth/register", // same — pre-authentication
  "/api/auth/refresh", // protected by HttpOnly cookie + 15-min token life
  "/api/payments/webhook", // verified via Stripe-Signature, not cookies; mounted on app directly anyway
  "/api/security/csp-report", // sent by the browser's CSP reporting agent, not our SPA's JS — it has no CSRF cookie to attach
]);

export const verifyCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PATHS.has(req.path)) return next();

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: "CSRF token validation failed" });
    return;
  }
  next();
};
