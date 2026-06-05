import * as jwt from "jsonwebtoken";
import crypto from "crypto";
const ms = require("ms");
import config from "../config/env.config";
import { UserRole } from "../models/user.model";

export interface AccessTokenPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  sessionId: string; 
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (
  userId: string,
  email: string,
  role: UserRole,
  sessionId: string,
): string => {
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.accessExpires as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
    issuer: "secureapp",
    audience: "secureapp-client",
  };
  return jwt.sign(
    { sub: userId, email, role, sessionId } as AccessTokenPayload,
    config.jwt.accessSecret as jwt.Secret,
    options,
  );
};

export const generateRefreshToken = (
  userId: string,
  sessionId: string,
): string => {
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.refreshExpires as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
    issuer: "secureapp",
    audience: "secureapp-client",
  };
  return jwt.sign(
    { sub: userId, sessionId } as RefreshTokenPayload,
    config.jwt.refreshSecret as jwt.Secret,
    options,
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: "secureapp",
    audience: "secureapp-client",
    algorithms: ["HS256"],
  }) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: "secureapp",
    audience: "secureapp-client",
    algorithms: ["HS256"],
  }) as RefreshTokenPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const extractBearerToken = (
  authHeader: string | undefined,
): string | null => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return token || null;
};
export const getTokenExpiryDate = (expiresIn: string): Date => {
  const milliseconds = ms(expiresIn);
  if (!milliseconds) {
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  }
  return new Date(Date.now() + milliseconds);
};
