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

const errorRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, "../../logs/error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "30d",
  maxSize: "20m",
  zippedArchive: true,
});

const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, "../../logs/combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: "30d",
  maxSize: "20m",
  zippedArchive: true,
});

export const auditLogger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, "../../logs/audit-%DATE%.log"),
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
  transports: [errorRotateTransport, combinedRotateTransport],
  exitOnError: false,
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}

export const logSecurityEvent = (
  event: string,
  userId: string | null,
  ip: string,
  details: Record<string, unknown> = {},
): void => {
  const sanitizedDetails = { ...details };
  const sensitiveKeys = ["password", "token", "secret", "mfaCode", "otp"];
  sensitiveKeys.forEach((key) => {
    if (key in sanitizedDetails) {
      sanitizedDetails[key] = "[REDACTED]";
    }
  });

  auditLogger.info({
    event,
    userId: userId ?? "anonymous",
    ip,
    timestamp: new Date().toISOString(),
    ...sanitizedDetails,
  });
};

export default logger;
