import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import config from "../config/env.config";
import { encryptField, decryptField } from "../utils/encryption.utils";

// Kept as named aliases so existing call sites (encryptSecret/decryptSecret)
// don't need renaming — both now delegate to the single shared,
// audited AES-256-GCM implementation in encryption.utils.ts.
export const encryptSecret = encryptField;
export const decryptSecret = decryptField;

export interface MFASetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  hashedBackupCodes: string[];
}

export const generateMFASetup = async (
  email: string,
): Promise<MFASetupResult> => {
  const secretObj = speakeasy.generateSecret({
    name: `${config.mfa.appName} (${email})`,
    issuer: config.mfa.appName,
    length: 32,
  });
  const encryptedSecret = encryptSecret(secretObj.base32);
  const qrCodeDataUrl = await QRCode.toDataURL(secretObj.otpauth_url!);

  const backupCodes: string[] = [];
  const hashedBackupCodes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = `${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    backupCodes.push(code);
    hashedBackupCodes.push(await bcrypt.hash(code, 10));
  }
  return {
    secret: encryptedSecret,
    otpauthUrl: secretObj.otpauth_url!,
    qrCodeDataUrl,
    backupCodes,
    hashedBackupCodes,
  };
};

export const verifyTOTP = (encryptedSecret: string, token: string): boolean => {
  try {
    const plain = decryptSecret(encryptedSecret);
    return speakeasy.totp.verify({
      secret: plain,
      encoding: "base32",
      token: token.replace(/\s/g, ""),
      window: 1,
    });
  } catch {
    return false;
  }
};

export const verifyBackupCode = async (
  hashed: string[],
  input: string | undefined,
): Promise<number> => {
  if (!input) return -1;
  const norm = input.trim().toUpperCase();
  for (let i = 0; i < hashed.length; i++) {
    if (await bcrypt.compare(norm, hashed[i])) return i;
  }
  return -1;
};
