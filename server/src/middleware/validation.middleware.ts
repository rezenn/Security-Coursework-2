import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((error: any) => ({
      field: error.param || error.location || "unknown",
      message: error.msg,
    }));
    res.status(422).json({ errors: formatted });
    return;
  }
  next();
};
