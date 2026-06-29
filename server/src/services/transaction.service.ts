import axios from "axios";
import crypto from "crypto";
import config from "../config/env.config";
import Transaction from "../models/transaction.model";
import Course from "../models/course.model";
import User from "../models/user.model";
import logger, { logSecurityEvent } from "../utils/logger.utils";
import mongoose from "mongoose";

const HMAC_KEY = Buffer.from(config.encryption.key);

// ── HMAC signature for transaction integrity ──────────────────────────────────
export const signTransaction = (
  userId: string,
  courseId: string,
  amountPaisa: number,
  timestamp: string,
): string => {
  const payload = `${userId}|${courseId}|${amountPaisa}|${timestamp}`;
  return crypto.createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
};

// ── Initiate Khalti payment ───────────────────────────────────────────────────
export const initiateKhaltiPayment = async (
  userId: string,
  courseId: string,
  userIp: string,
): Promise<{ paymentUrl: string; pidx: string; amountPaisa: number }> => {
  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) throw new Error("COURSE_NOT_FOUND");

  const existing = await Transaction.findOne({
    user: userId,
    course: courseId,
    status: "completed",
  });
  if (existing) throw new Error("ALREADY_ENROLLED");

  const amountPaisa = course.priceCents; // we store price in paisa
  if (amountPaisa > 0 && amountPaisa < 1000) {
    throw new Error("MIN_AMOUNT"); // Khalti min is Rs.10 = 1000 paisa
  }

  const timestamp = new Date().toISOString();
  const signature = signTransaction(userId, courseId, amountPaisa, timestamp);
  const purchaseOrderId = `GK-${userId.slice(-6)}-${courseId.slice(-6)}-${Date.now()}`;

  // Free course — enroll directly without Khalti
  if (amountPaisa === 0) {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Transaction.create(
        [{
          user: userId,
          course: courseId,
          amountCents: 0,
          currency: "NPR",
          status: "completed",
          pidx: `free-${purchaseOrderId}`,
          signature,
          metadata: { timestamp, purchaseOrderId, free: true },
        }],
        { session },
      );
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { enrolledCourses: courseId } },
        { session },
      );
      await Course.findByIdAndUpdate(
        courseId,
        { $inc: { enrolledCount: 1 } },
        { session },
      );
    });
    session.endSession();
    logSecurityEvent("payment_completed", userId, userIp, { courseId, amountPaisa: 0, free: true });
    return { paymentUrl: "/dashboard", pidx: `free-${purchaseOrderId}`, amountPaisa: 0 };
  }

  // Paid course — initiate Khalti
  const khaltiRes = await axios.post(
    "https://a.khalti.com/api/v2/epayment/initiate/",
    {
      return_url: `${config.frontendUrl}/payment/verify`,
      website_url: config.frontendUrl,
      amount: amountPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: course.title.slice(0, 100),
      customer_info: { name: "GyanKosh User" },
    },
    {
      headers: {
        Authorization: `Key ${config.khalti.secretKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const { pidx, payment_url } = khaltiRes.data as { pidx: string; payment_url: string };

  await Transaction.create({
    user: userId,
    course: courseId,
    amountCents: amountPaisa,
    currency: "NPR",
    status: "pending",
    pidx,
    signature,
    metadata: { timestamp, purchaseOrderId },
  });

  logSecurityEvent("payment_intent_created", userId, userIp, {
    courseId,
    amountPaisa,
    pidx,
  });

  return { paymentUrl: payment_url, pidx, amountPaisa };
};

// ── Verify Khalti payment after redirect ─────────────────────────────────────
export const verifyKhaltiPayment = async (
  pidx: string,
  userId: string,
  userIp: string,
): Promise<{ success: boolean; courseId: string; courseTitle: string }> => {
  const txn = await Transaction.findOne({
    pidx,
    user: userId,
    status: "pending",
  });
  if (!txn) throw new Error("TRANSACTION_NOT_FOUND");

  // Verify with Khalti's lookup API
  const verifyRes = await axios.post(
    "https://a.khalti.com/api/v2/epayment/lookup/",
    { pidx },
    {
      headers: {
        Authorization: `Key ${config.khalti.secretKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const khaltiData = verifyRes.data as { pidx: string; status: string; total_amount: number };

  if (khaltiData.status !== "Completed") {
    await Transaction.findByIdAndUpdate(txn._id, { status: "failed" });
    throw new Error("PAYMENT_NOT_COMPLETED");
  }

  // Re-verify amount integrity — prevents tampered Khalti responses
  if (khaltiData.total_amount !== txn.amountCents) {
    logger.error("Khalti amount mismatch", {
      expected: txn.amountCents,
      received: khaltiData.total_amount,
    });
    await Transaction.findByIdAndUpdate(txn._id, { status: "failed" });
    throw new Error("AMOUNT_MISMATCH");
  }

  // Atomic enrolment
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    await Transaction.findByIdAndUpdate(txn._id, { status: "completed" }, { session });
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { enrolledCourses: txn.course } },
      { session },
    );
    await Course.findByIdAndUpdate(txn.course, { $inc: { enrolledCount: 1 } }, { session });
  });
  session.endSession();

  const course = await Course.findById(txn.course).select("title");

  logSecurityEvent("payment_completed", userId, userIp, {
    courseId: txn.course.toString(),
    amountPaisa: txn.amountCents,
    pidx,
  });

  return {
    success: true,
    courseId: txn.course.toString(),
    courseTitle: course?.title || "",
  };
};
