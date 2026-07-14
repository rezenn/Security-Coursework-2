/// <reference path="./types/express/index.d.ts" />

import express, { Request, Response, NextFunction } from "express";
import path from "path";
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
import { issueCsrfToken, verifyCsrfToken } from "./middleware/csrf.middleware";
import {
  canaryBlockGuard,
  honeytokenRouter,
} from "./middleware/honeytoken.middleware";
import authRoutes from "./routes/auth.routes";
import securityRoutes from "./routes/security.routes";
import {
  courseRouter,
  profileRouter,
  paymentRouter,
  adminRouter,
} from "./routes/index";

const app = express();

app.set("trust proxy", 1);

// ── Honeytoken IP guard ────────────────────────────────────────────────────
// Mounted before literally everything else: an IP already flagged by the
// canary trap below gets rejected before it costs us a Helmet header
// computation, a body parse, a rate-limit bucket check, or a DB round trip.
app.use(canaryBlockGuard);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://js.stripe.com",
          "https://www.google.com",
          "https://www.youtube.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://m.stripe.network",
        ],
        frameSrc: [
          "https://js.stripe.com",
          "https://hooks.stripe.com",
          "https://m.stripe.network",
          "https://www.google.com",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
        ],
        // Turns the CSP from purely preventive into detective too: every
        // blocked script/style/connect attempt (i.e. every real or
        // attempted XSS) gets POSTed here automatically by the browser.
        // report-uri is deprecated in favour of report-to/Reporting-Endpoints,
        // but is kept alongside it since it still has materially wider
        // browser support (notably Safari never implemented report-to).
        reportUri: ["/api/security/csp-report"],
      },
      reportOnly: false,
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }),
);
// Modern reporting-API counterpart to reportUri above (Chrome/Firefox).
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Reporting-Endpoints",
    'csp-endpoint="/api/security/csp-report"',
  );
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
// CWE-942 (Permissive Cross-domain Policy): a static `origin: true`, a `*`
// wildcard, or "reflect back whatever Origin the browser sent" would all
// let *any* website read authenticated responses from this API (since
// credentials: true also sends cookies). We validate the incoming Origin
// against an explicit allow-list and only echo it back if it matches —
// every other origin gets no Access-Control-Allow-Origin header at all,
// so the browser's same-origin policy blocks the response from being read.
const isAllowedOrigin = (origin: string | undefined): boolean => {
  // Same-origin requests (curl, server-to-server, Postman) send no Origin
  // header at all — allow those through; browsers always send Origin for
  // cross-origin fetch/XHR, so this doesn't weaken the browser-facing check.
  if (!origin) return true;
  return config.allowedOrigins.includes(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      logSecurityEvent("cors_origin_rejected", "unknown", "unknown", {
        origin,
      });
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-captcha-token",
      "x-csrf-token",
    ],
    exposedHeaders: ["x-csrf-token"],
  }),
);

app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
);

// ── Honeytoken canary routes ─────────────────────────────────────────────────
// Mounted early and outside the normal route table further down, deliberately
// ahead of CSRF/rate-limiting: a hit on any of these paths is handled and
// short-circuited immediately (see honeytoken.middleware.ts for rationale).
app.use(honeytokenRouter);

// Browsers send CSP violation reports as `application/csp-report` or
// `application/reports+json`, which the general express.json() below (typed
// to "application/json" only) will not parse. Force-parse as JSON on this
// one route, same targeted-middleware pattern already used for the Stripe
// webhook's raw-body requirement above.
app.use(
  "/api/security/csp-report",
  express.json({ type: () => true, limit: "15kb" }),
);

// ── Static uploaded assets ──────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Body parsers (everything except the webhook route above) ──────────────────
app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));
app.use(cookieParser(config.cookie.secret));

// ── CSRF protection (double-submit cookie) ────────────────────────────────────
app.use(issueCsrfToken);
app.use(verifyCsrfToken);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/api/payments/webhook") return next();
  hpp()(req, res, next);
});
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/api/payments/webhook") return next();
  mongoSanitize()(req, res, next);
});

// ── Inline XSS sanitizer (replaces deprecated xss-clean) ──────────────────────
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
  // Skip: webhook body is a raw Buffer needed verbatim for Stripe's HMAC
  // signature check. Buffer is typeof "object", so sanitizeValue's generic
  // object branch would walk it via Object.entries (byte-index keys) and
  // rebuild it as a plain object, destroying the exact bytes Stripe signed.
  if (req.path === "/api/payments/webhook") return next();
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query) as typeof req.query;
  next();
});

// ── Passport (Google OAuth — stateless) ────────────────────────────────────────
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
app.use("/api/security", securityRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", env: config.env, ts: new Date().toISOString() });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const validateConfig = (): void => {
  const missing: string[] = [];

  if (!config.stripe.secretKey) missing.push("STRIPE_SECRET_KEY");
  if (!config.stripe.publishableKey) missing.push("STRIPE_PUBLISHABLE_KEY");
  if (missing.length) {
    throw new Error(
      `Missing required env vars: ${missing.join(", ")}. Payment features will not work without them — see server/.env.example.`,
    );
  }

  if (config.env === "production" && !config.stripe.webhookSecret) {
    throw new Error(
      "Missing required production env var: STRIPE_WEBHOOK_SECRET",
    );
  }
  if (config.env !== "production" && !config.stripe.webhookSecret) {
    logger.warn(
      "STRIPE_WEBHOOK_SECRET is not set — card payments will charge successfully " +
        "but users will NOT be enrolled, since enrollment happens in the webhook handler. " +
        "Run `stripe listen --forward-to localhost:5000/api/payments/webhook` locally.",
    );
  }
};

const start = async (): Promise<void> => {
  validateConfig();
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
