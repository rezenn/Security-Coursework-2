import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.utils";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });
  // Never leak stack traces to client
  const status = (err as any).status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : err.message,
  });
};
