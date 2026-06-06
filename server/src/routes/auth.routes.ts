import { Router } from "express";
import { body, param } from "express-validator";
import {
  confirmMFASetup,
  createMFASetup,
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
    body("email").isEmail().withMessage("Valid email is required"),
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters"),
    body("password")
      .isLength({ min: 12 })
      .withMessage("Password must be at least 12 characters"),
  ],
  validateRequest,
  verifyRecaptcha,
  register,
);

router.get(
  "/verify-email/:token",
  [param("token").isLength({ min: 64, max: 64 }).withMessage("Invalid token")],
  validateRequest,
  verifyEmail,
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  verifyRecaptcha,
  login,
);

router.post("/refresh", refreshToken);
router.post("/logout", requireAuth, logout);

router.post(
  "/request-password-reset",
  [body("email").isEmail().withMessage("Valid email is required")],
  validateRequest,
  verifyRecaptcha,
  requestPasswordReset,
);

router.post(
  "/reset-password/:token",
  [
    param("token").isLength({ min: 64, max: 64 }).withMessage("Invalid token"),
    body("password")
      .isLength({ min: 12 })
      .withMessage("Password must be at least 12 characters"),
  ],
  validateRequest,
  resetPassword,
);

router.post("/mfa/setup", requireAuth, createMFASetup);
router.post(
  "/mfa/confirm",
  [body("token").isString().notEmpty().withMessage("MFA token is required")],
  validateRequest,
  requireAuth,
  confirmMFASetup,
);

export default router;
