import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import config from "../config/env.config";

const ENCRYPTION_KEY = Buffer.from(
  config.encryption.key.padEnd(32, "0").slice(0, 32),
);

export const encryptSecret = (plaintext: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptSecret = (encryptedData: string): string => {
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
};

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

  const plainSecret = secretObj.base32;
  const encryptedSecret = encryptSecret(plainSecret);
  const otpauthUrl = secretObj.otpauth_url!;

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  const backupCodes: string[] = [];
  const hashedBackupCodes: string[] = [];

  for (let i = 0; i < 10; i++) {
    const code = `${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    backupCodes.push(code);
    const hashed = await bcrypt.hash(code, 10);
    hashedBackupCodes.push(hashed);
  }

  return {
    secret: encryptedSecret,
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes, 
    hashedBackupCodes,
  };
};

export const verifyTOTP = (encryptedSecret: string, token: string): boolean => {
  try {
    const plainSecret = decryptSecret(encryptedSecret);
    return speakeasy.totp.verify({
      secret: plainSecret,
      encoding: "base32",
      token: token.replace(/\s/g, ""), 
      window: 1, 
    });
  } catch {
    return false;
  }
};

export const verifyBackupCode = async (
  hashedBackupCodes: string[],
  inputCode: string,
): Promise<number> => {
  const normalizedCode = inputCode.trim().toUpperCase();

  for (let i = 0; i < hashedBackupCodes.length; i++) {
    const match = await bcrypt.compare(normalizedCode, hashedBackupCodes[i]);
    if (match) return i;
  }

  return -1;
};
