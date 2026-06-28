import * as jwt from "jsonwebtoken";
import crypto from "crypto";
const ms = require("ms");
import config from "../config/env.config";
import { UserRole } from "../models/user.model";

export interface AccessTokenPayload {
  sub: string;
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
  customExpiry?: string,
): string => {
  const expiry = customExpiry || config.jwt.accessExpires;
  return jwt.sign(
    { sub: userId, email, role, sessionId } as AccessTokenPayload,
    config.jwt.accessSecret as jwt.Secret,
    {
      expiresIn: expiry as jwt.SignOptions["expiresIn"],
      algorithm: "HS256",
      issuer: "gyankosh",
      audience: "gyankosh-client",
    },
  );
};

export const generateRefreshToken = (
  userId: string,
  sessionId: string,
): string => {
  return jwt.sign(
    { sub: userId, sessionId } as RefreshTokenPayload,
    config.jwt.refreshSecret as jwt.Secret,
    {
      expiresIn: config.jwt.refreshExpires as jwt.SignOptions["expiresIn"],
      algorithm: "HS256",
      issuer: "gyankosh",
      audience: "gyankosh-client",
    },
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: "gyankosh",
    audience: "gyankosh-client",
    algorithms: ["HS256"],
  }) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: "gyankosh",
    audience: "gyankosh-client",
    algorithms: ["HS256"],
  }) as RefreshTokenPayload;
};

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const extractBearerToken = (
  authHeader: string | undefined,
): string | null => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] || null;
};

export const getTokenExpiryDate = (expiresIn: string): Date => {
  const milliseconds = ms(expiresIn);
  return new Date(Date.now() + (milliseconds || 7 * 24 * 60 * 60 * 1000));
};
