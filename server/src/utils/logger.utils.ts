import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  }),
);

const logsDir = path.join(__dirname, "../../logs");

export const auditLogger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, "audit-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "90d",
      maxSize: "20m",
      zippedArchive: true,
    }),
  ],
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, "error-%DATE%.log"),
      level: "error",
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
      maxSize: "20m",
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
      maxSize: "20m",
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}

const SENSITIVE = ["password", "token", "secret", "mfaCode", "otp", "card"];

export const logSecurityEvent = (
  event: string,
  userId: string | null,
  ip: string,
  details: Record<string, unknown> = {},
): void => {
  const sanitized = { ...details };
  SENSITIVE.forEach((k) => {
    if (k in sanitized) sanitized[k] = "[REDACTED]";
  });
  auditLogger.info({
    event,
    userId: userId ?? "anonymous",
    ip,
    timestamp: new Date().toISOString(),
    ...sanitized,
  });
};

export default logger;
