import { NextFunction, Request, Response } from "express";
import { extractBearerToken, verifyAccessToken } from "../services/token.service";
import { UserRole } from "../models/user.model";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const bearer = extractBearerToken(req.headers.authorization);
  if (!bearer) {
    res.status(401).json({ error: "Authorization header is required" });
    return;
  }
  try {
    req.user = verifyAccessToken(bearer);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};

// Shorthand guards
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireUser = requireRole(UserRole.USER, UserRole.ADMIN);
