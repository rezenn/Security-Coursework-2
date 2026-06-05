import { Router } from "express";
import { body } from "express-validator";
import {
  listUserTransactions,
  purchaseResource,
} from "../controllers/transaction.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";

const router = Router();

router.post(
  "/purchase",
  requireAuth,
  [
    body("resourceId")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("resourceId is required"),
    body("amountCents")
      .isInt({ min: 1 })
      .withMessage("amountCents must be a positive integer"),
    body("currency")
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage("currency must be a 3-letter ISO code"),
  ],
  validateRequest,
  purchaseResource,
);

router.get("/", requireAuth, listUserTransactions);

export default router;
