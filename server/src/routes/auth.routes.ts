import { Router } from "express";
import { body, param } from "express-validator";
import {
  confirmMFASetup,
  createMFASetup,
  getMe,
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

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("username").isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/).withMessage("Username 3-30 chars (letters, numbers, _ -)"),
    body("password").isLength({ min: 12 }).withMessage("Password must be at least 12 characters"),
  ],
  validateRequest,
  verifyRecaptcha,
  register,
);

router.get("/verify-email/:token", [param("token").isLength({ min: 64, max: 64 })], validateRequest, verifyEmail);
router.post("/verify-email/:token", [param("token").isLength({ min: 64, max: 64 })], validateRequest, verifyEmail);
router.post(
  "/verify-email",
  [body("email").isEmail(), body("code").isLength({ min: 6, max: 6 })],
  validateRequest,
  verifyEmail,
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isString().notEmpty().withMessage("Password required"),
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
  [body("email").isEmail(), body("code").isLength({ min: 6, max: 6 }), body("password").isLength({ min: 12 })],
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

export default router;
