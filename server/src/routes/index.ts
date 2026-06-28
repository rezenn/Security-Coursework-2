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
import express from "express";

export const courseRouter = Router();
courseRouter.get("/", listCourses);
courseRouter.get("/:slug", getCourse);

export const profileRouter = Router();
profileRouter.get("/", requireAuth, getProfile);
profileRouter.patch(
  "/",
  requireAuth,
  [
    body("firstName").optional().isLength({ max: 50 }),
    body("lastName").optional().isLength({ max: 50 }),
    body("bio").optional().isLength({ max: 500 }),
  ],
  validateRequest,
  updateProfile,
);
profileRouter.post(
  "/change-password",
  requireAuth,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 12 })],
  validateRequest,
  changePassword,
);
profileRouter.get("/export", requireAuth, exportProfile);

export const paymentRouter = Router();
// Webhook must use raw body — applied in server.ts before JSON middleware
paymentRouter.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);
paymentRouter.post("/create-intent", requireAuth, createPaymentRateLimiter(), createIntent);
paymentRouter.get("/my-transactions", requireAuth, myTransactions);

export const adminRouter = Router();
// All admin routes require authentication + admin role
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/stats", getStats);
adminRouter.get("/users", listUsers);
adminRouter.patch("/users/:id/toggle-active", [param("id").isMongoId()], validateRequest, toggleUserActive);
adminRouter.delete("/users/:id", [param("id").isMongoId()], validateRequest, deleteUser);
adminRouter.get("/logs", getAuditLogs);
adminRouter.get("/courses", adminListCourses);
adminRouter.post("/courses", [body("title").notEmpty(), body("description").notEmpty(), body("priceCents").isInt({ min: 0 })], validateRequest, createCourse);
adminRouter.patch("/courses/:id", [param("id").isMongoId()], validateRequest, updateCourse);
adminRouter.delete("/courses/:id", [param("id").isMongoId()], validateRequest, deleteCourse);
adminRouter.post("/courses/:id/lessons", requireAuth, requireAdmin, [body("title").notEmpty()], validateRequest, addLesson);
adminRouter.get("/transactions", adminListTransactions);
