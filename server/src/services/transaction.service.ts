import crypto from "crypto";
import config from "../config/env.config";

const HMAC_KEY = Buffer.from(
  config.encryption.key.padEnd(32, "0").slice(0, 32),
  "utf8",
);

export const signTransaction = (
  userId: string,
  resourceId: string,
  amountCents: number,
  currency: string,
  timestamp: string,
): string => {
  const payload = `${userId}|${resourceId}|${amountCents}|${currency}|${timestamp}`;
  return crypto.createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
};

export const verifyTransactionSignature = (
  userId: string,
  resourceId: string,
  amountCents: number,
  currency: string,
  timestamp: string,
  signature: string,
): boolean => {
  return (
    signTransaction(userId, resourceId, amountCents, currency, timestamp) ===
    signature
  );
};
