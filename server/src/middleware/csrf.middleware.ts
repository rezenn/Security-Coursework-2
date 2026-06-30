import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import config from "../config/env.config";

/**
 * CSRF protection using the Double-Submit Cookie pattern.
 *
 * Why this pattern (not csurf): csurf is deprecated, unmaintained, and built
 * for server-rendered session apps. This API is stateless (JWT + refresh
 * cookie), so the double-submit pattern is the correct fit:
 *
 *  1. Server issues a random CSRF token in a readable (non-HttpOnly) cookie.
 *  2. Client JS reads that cookie and sends it back as a custom header
 *     (X-CSRF-Token) on every state-changing request.
 *  3. Server compares cookie value === header value.
 *
 * An attacker's cross-origin form/script CANNOT read the cookie (browsers
 * enforce same-origin on cookie reads via JS) and CANNOT set custom headers
 * on a simple cross-site form submission — so forged requests fail.
 *
 * This specifically protects the refresh-token cookie flow, which is the
 * only cookie-based (i.e. CSRF-able) credential in this app. The
 * Authorization: Bearer header used for all other requests is immune to
 * CSRF by design (browsers never auto-attach custom headers cross-site).
 */

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

// Endpoints exempt from CSRF (they don't rely on cookies for auth, or are
// the entry points that issue the very tokens being checked).
// Note: Google OAuth routes (/api/auth/google, /api/auth/google/callback)
// are GET requests — already exempt via SAFE_METHODS above, listed here
// only for documentation clarity.
const EXEMPT_PATHS = new Set([
  "/api/auth/login", // issues the session; no prior CSRF cookie to check
  "/api/auth/register", // same — pre-authentication
  "/api/auth/refresh", // protected by HttpOnly cookie + 15-min token life
  "/api/payments/webhook", // verified via Stripe-Signature, not cookies; mounted on app directly anyway
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
