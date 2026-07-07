import crypto from "crypto";
import config from "../config/env.config";

/**
 * Generic AES-256-GCM field-level encryption for sensitive data at rest
 * (CWE-311: Missing Encryption of Sensitive Data). GCM is authenticated
 * encryption — the auth tag detects any tampering with the ciphertext,
 * not just decrypts it. A random 16-byte IV is generated per call so
 * encrypting the same plaintext twice never produces the same ciphertext
 * (prevents pattern leakage across records).
 *
 * Output format: "<iv-hex>:<authTag-hex>:<ciphertext-hex>" — stored as a
 * single opaque string in MongoDB, so no schema change is needed beyond
 * the field already being a String.
 *
 * This is the same construction previously used ad-hoc for MFA secrets
 * in mfa.service.ts; it now lives here so any field needing encryption
 * at rest (IP addresses, MFA secrets, and any future PII field) shares
 * one audited implementation instead of duplicating crypto code.
 */
const KEY = Buffer.from(config.encryption.key);

export const encryptField = (plaintext: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptField = (data: string): string => {
  const [ivHex, tagHex, encHex] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
};

/** True if a string is already in our "iv:tag:ciphertext" encrypted format,
 * so callers can avoid double-encrypting a value that's already encrypted. */
export const isEncryptedField = (value: string | null | undefined): boolean =>
  !!value && /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i.test(value);
