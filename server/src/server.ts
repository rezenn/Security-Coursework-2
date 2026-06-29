/// <reference path="./types/express/index.d.ts" />

import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import passport from "./config/passport.config";
import config from "./config/env.config";
import connectDB from "./config/database.config";
import logger, { logSecurityEvent } from "./utils/logger.utils";
import {
  createGlobalRateLimiter,
  createLoginRateLimiter,
} from "./middleware/rateLimiter.middleware";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import {
  courseRouter,
  profileRouter,
  paymentRouter,
  adminRouter,
} from "./routes/index";

const app = express();

app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }),
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-captcha-token"],
  }),
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));
app.use(cookieParser(config.cookie.secret));

// ── Security middleware ───────────────────────────────────────────────────────
app.use(hpp());
app.use(mongoSanitize());

// ── Inline XSS sanitizer (replaces deprecated xss-clean) ─────────────────────
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const sanitizeValue = (val: unknown): unknown => {
  if (typeof val === "string") return escapeHtml(val);
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = sanitizeValue(v);
    }
    return out;
  }
  return val;
};

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query) as typeof req.query;
  next();
});

// ── Passport (Google OAuth — stateless) ───────────────────────────────────────
app.use(passport.initialize());

// ── Request logging ───────────────────────────────────────────────────────────
app.use(
  morgan("combined", {
    stream: { write: (m: string) => logger.info(m.trim()) },
  }),
);

// ── Rate limiters ─────────────────────────────────────────────────────────────
app.use(createGlobalRateLimiter());
app.use("/api/auth/login", createLoginRateLimiter());
app.use("/api/auth/register", createLoginRateLimiter());
app.use("/api/auth/request-password-reset", createLoginRateLimiter());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRouter);
app.use("/api/profile", profileRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", adminRouter);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", env: config.env, ts: new Date().toISOString() });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  await connectDB();
  app.listen(config.port, () => {
    logger.info(`GyanKosh server running on :${config.port} [${config.env}]`);
    logSecurityEvent("server_started", null, "system", { port: config.port });
  });
};

start().catch((err) => {
  logger.error("Failed to start server", { err });
  process.exit(1);
});
