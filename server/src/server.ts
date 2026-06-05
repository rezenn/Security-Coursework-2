/// <reference path="./types/custom.d.ts" />

import express from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import xssClean from "xss-clean";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import csurf from "csurf";
import morgan from "morgan";
import config from "./config/env.config";
import connectDB from "./config/database.config";
import logger, { logSecurityEvent } from "./utils/logger.utils";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import transactionRoutes from "./routes/transaction.routes";
import {
  createGlobalRateLimiter,
  createLoginRateLimiter,
} from "./middleware/rateLimiter.middleware";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);
app.use(hpp());
app.use(mongoSanitize());
app.use(xssClean());
app.use(bodyParser.json({ limit: "15kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "15kb" }));
app.use(cookieParser(config.cookie.secret));

app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);

app.use(createGlobalRateLimiter());
app.use("/api/auth/login", createLoginRateLimiter());
app.use("/api/auth/request-password-reset", createLoginRateLimiter());

const useCsrf = config.env === "production";
const csrfProtection = useCsrf
  ? csurf({
      cookie: {
        httpOnly: false,
        secure: config.env === "production",
        sameSite: "strict",
      },
    })
  : undefined;

if (csrfProtection) {
  app.use(csrfProtection);
  app.use((req, res, next) => {
    const csrfToken = (req as any).csrfToken?.();
    res.cookie("XSRF-TOKEN", csrfToken || "", {
      sameSite: "strict",
      secure: config.env === "production",
      httpOnly: false,
    });
    next();
  });
}

app.get("/api/csrf-token", (req, res) => {
  const csrfToken = useCsrf ? (req as any).csrfToken?.() : "";
  res.status(200).json({ csrfToken: csrfToken || "" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/transactions", transactionRoutes);

app.use(errorHandler);

const start = async (): Promise<void> => {
  await connectDB();

  app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
    logSecurityEvent("server_started", null, "system", {
      env: config.env,
      port: config.port,
    });
  });
};

start().catch((error) => {
  logger.error("Failed to start server", { error });
  process.exit(1);
});
