import { Router } from "express";
import { body } from "express-validator";
import {
  exportProfile,
  getProfile,
  updateProfile,
} from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";

const router = Router();

router.get("/", requireAuth, getProfile);
router.patch(
  "/",
  requireAuth,
  [
    body("firstName").optional().isString().trim().isLength({ max: 50 }),
    body("lastName").optional().isString().trim().isLength({ max: 50 }),
    body("bio").optional().isString().trim().isLength({ max: 500 }),
    body("avatarUrl")
      .optional()
      .isURL()
      .withMessage("avatarUrl must be a valid URL"),
  ],
  validateRequest,
  updateProfile,
);
router.get("/export", requireAuth, exportProfile);

export default router;
