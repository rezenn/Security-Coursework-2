import { Router } from "express";
import { body, param } from "express-validator";
import {
  addLesson,
  adminListCourses,
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from "../controllers/course.controller";
import {
  changePassword,
  exportProfile,
  getProfile,
  updateProfile,
} from "../controllers/profile.controller";
import {
  adminListTransactions,
  createIntent,
  myTransactions,
  stripeWebhook,
} from "../controllers/transaction.controller";
import {
  deleteUser,
  getAuditLogs,
  getStats,
  listUsers,
  toggleUserActive,
} from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { createPaymentRateLimiter } from "../middleware/rateLimiter.middleware";

export const courseRouter = Router();
courseRouter.get("/", listCourses);
courseRouter.get("/:slug", getCourse);

export const profileRouter = Router();
profileRouter.get("/", requireAuth, getProfile);
profileRouter.patch(
  "/",
  requireAuth,
  [
    body("firstName").optional().isLength({ max: 50 }).trim(),
    body("lastName").optional().isLength({ max: 50 }).trim(),
    body("bio").optional().isLength({ max: 500 }).trim(),
  ],
  validateRequest,
  updateProfile,
);
profileRouter.post(
  "/change-password",
  requireAuth,
  [
    body("currentPassword").notEmpty().withMessage("Current password required"),
    body("newPassword")
      .isLength({ min: 12 })
      .withMessage("New password must be at least 12 characters"),
  ],
  validateRequest,
  changePassword,
);
profileRouter.get("/export", requireAuth, exportProfile);

export const paymentRouter = Router();
paymentRouter.post(
  "/create-intent",
  requireAuth,
  createPaymentRateLimiter(),
  [body("courseId").isMongoId().withMessage("Valid courseId required")],
  validateRequest,
  createIntent,
);
paymentRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }), // Raw body required for Stripe signature verification
  stripeWebhook,
);
paymentRouter.get("/my-transactions", requireAuth, myTransactions);

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/stats", getStats);
adminRouter.get("/users", listUsers);
adminRouter.patch(
  "/users/:id/toggle-active",
  [param("id").isMongoId()],
  validateRequest,
  toggleUserActive,
);
adminRouter.delete(
  "/users/:id",
  [param("id").isMongoId()],
  validateRequest,
  deleteUser,
);
adminRouter.get("/logs", getAuditLogs);
adminRouter.get("/courses", adminListCourses);
adminRouter.post(
  "/courses",
  [
    body("title").notEmpty().withMessage("Title required"),
    body("description").notEmpty().withMessage("Description required"),
    body("priceCents")
      .isInt({ min: 0 })
      .withMessage("Price must be a positive number"),
  ],
  validateRequest,
  createCourse,
);
adminRouter.patch(
  "/courses/:id",
  [param("id").isMongoId()],
  validateRequest,
  updateCourse,
);
adminRouter.delete(
  "/courses/:id",
  [param("id").isMongoId()],
  validateRequest,
  deleteCourse,
);
adminRouter.post(
  "/courses/:id/lessons",
  [param("id").isMongoId(), body("title").notEmpty()],
  validateRequest,
  addLesson,
);
adminRouter.get("/transactions", adminListTransactions);

// Import express for raw body middleware
import express from "express";
