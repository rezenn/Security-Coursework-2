import { Router } from "express";
import { body, param } from "express-validator";
import passport from "../config/passport.config";
import {
  confirmMFASetup,
  createMFASetup,
  getMe,
  googleCallback,
  login,
  logout,
  refreshToken,
  register,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { verifyRecaptcha } from "../middleware/recaptcha.middleware";

const router = Router();

// ── Local auth ────────────────────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("username")
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_-]+$/),
    body("password").isLength({ min: 12 }),
  ],
  validateRequest,
  verifyRecaptcha,
  register,
);

router.get(
  "/verify-email/:token",
  [param("token").isLength({ min: 64, max: 64 })],
  validateRequest,
  verifyEmail,
);
router.post(
  "/verify-email/:token",
  [param("token").isLength({ min: 64, max: 64 })],
  validateRequest,
  verifyEmail,
);
router.post(
  "/verify-email",
  [body("email").isEmail(), body("code").isLength({ min: 6, max: 6 })],
  validateRequest,
  verifyEmail,
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().notEmpty(),
    // Second-step fields for MFA / new-device step-up continuation. Both
    // optional on the initial request; the client resubmits with one of
    // these set once the server responds mfaRequired/deviceVerificationRequired.
    body("mfaToken").optional().isString().trim(),
    body("deviceCode").optional().isLength({ min: 6, max: 6 }).isNumeric(),
  ],
  validateRequest,
  verifyRecaptcha,
  login,
);

router.post("/refresh", refreshToken);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);

router.post(
  "/request-password-reset",
  [body("email").isEmail().normalizeEmail()],
  validateRequest,
  verifyRecaptcha,
  requestPasswordReset,
);

router.post(
  "/reset-password/:token",
  [
    param("token").isLength({ min: 64, max: 64 }),
    body("password").isLength({ min: 12 }),
  ],
  validateRequest,
  verifyRecaptcha,
  resetPassword,
);

router.post(
  "/reset-password",
  [
    body("email").isEmail(),
    body("code").isLength({ min: 6, max: 6 }),
    body("password").isLength({ min: 12 }),
  ],
  validateRequest,
  verifyRecaptcha,
  resetPassword,
);

router.post("/mfa/setup", requireAuth, createMFASetup);
router.post(
  "/mfa/confirm",
  [body("token").isString().notEmpty()],
  validateRequest,
  requireAuth,
  confirmMFASetup,
);

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Step 1: redirect to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Step 2: Google redirects back here
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/failure",
  }),
  googleCallback,
);

router.get("/google/failure", (_req, res) => {
  res.redirect(
    `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_failed`,
  );
});

export default router;
