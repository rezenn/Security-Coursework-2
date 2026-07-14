import crypto from "crypto";
import { IUser } from "../models/user.model";
import { decryptField, isEncryptedField } from "../utils/encryption.utils";

/**
 * Device/context fingerprinting for risk-based (adaptive) authentication.
 *
 * Reference: OWASP ASVS v4 V2.2.1 ("anti-automation controls... to protect
 * against credential stuffing"), NIST SP 800-63B §6.1.2.3 (re-authentication
 * / step-up when context changes). This is deliberately NOT device
 * fingerprinting in the tracking/advertising sense — it's a coarse,
 * one-way hash used only to answer "have we seen this IP+browser combo
 * authenticate successfully before?", stored per-user, never shared or
 * used to identify a person across accounts.
 *
 * This is intentionally simple (IP + User-Agent, not canvas/WebGL/font
 * fingerprinting) because a coursework marketplace app has no legitimate
 * need for invasive client fingerprinting, and OWASP explicitly warns
 * against over-collection (data minimisation, GDPR Art. 5(1)(c)).
 */

export const computeDeviceFingerprint = (
  ip: string,
  userAgent: string,
): string =>
  crypto.createHash("sha256").update(`${ip}::${userAgent}`).digest("hex");

export const MAX_KNOWN_DEVICES = 8;

/** True if this fingerprint already exists in the user's trusted-device
 * store (i.e. they have logged in successfully from this IP+UA before). */
export const isKnownDevice = (user: IUser, fingerprint: string): boolean =>
  (user.knownDevices || []).some((d) => d.fingerprint === fingerprint);

/** Registers (or refreshes) a device as trusted after a successful,
 * fully-verified login. Caps the store like activeRefreshTokens does, so
 * an account can't accumulate unbounded device history. */
export const rememberDevice = (
  user: IUser,
  fingerprint: string,
  ip: string,
  userAgent: string,
): void => {
  user.knownDevices = user.knownDevices || [];
  const existing = user.knownDevices.find((d) => d.fingerprint === fingerprint);
  if (existing) {
    existing.lastSeenAt = new Date();
    return;
  }
  if (user.knownDevices.length >= MAX_KNOWN_DEVICES) {
    user.knownDevices = user.knownDevices.slice(-(MAX_KNOWN_DEVICES - 1));
  }
  user.knownDevices.push({
    fingerprint,
    ip,
    userAgent,
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
  });
};

/** Decrypts a stored IP for display/audit purposes (e.g. security emails,
 * admin audit log), tolerating values saved before encryption was added. */
export const safeDecryptIp = (value: string | null | undefined): string => {
  if (!value) return "unknown";
  return isEncryptedField(value) ? decryptField(value) : value;
};
