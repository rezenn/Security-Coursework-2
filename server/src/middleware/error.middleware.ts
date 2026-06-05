import { ErrorRequestHandler } from "express";
import logger from "../utils/logger.utils";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  const status = (err as any).statusCode || 500;
  const message = status === 500 ? "Internal Server Error" : err.message;
  res.status(status).json({ error: message });
};
