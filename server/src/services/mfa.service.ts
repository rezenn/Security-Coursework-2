import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import config from "../config/env.config";

// ─── Encrypt/Decrypt MFA secret (AES-256-GCM) ────────────────────────────────
// The TOTP secret is encrypted at rest in MongoDB
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
  // Store: iv:authTag:ciphertext (all hex)
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

// ─── Generate new TOTP secret ─────────────────────────────────────────────────
export interface MFASetupResult {
  secret: string; // Encrypted secret to store in DB
  otpauthUrl: string; // Used to generate QR code
  qrCodeDataUrl: string; // Base64 QR code image
  backupCodes: string[]; // Plain text — show to user once only
  hashedBackupCodes: string[]; // Stored in DB
}

export const generateMFASetup = async (
  email: string,
): Promise<MFASetupResult> => {
  // Generate TOTP secret
  const secretObj = speakeasy.generateSecret({
    name: `${config.mfa.appName} (${email})`,
    issuer: config.mfa.appName,
    length: 32,
  });

  const plainSecret = secretObj.base32;
  const encryptedSecret = encryptSecret(plainSecret);
  const otpauthUrl = secretObj.otpauth_url!;

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate 10 one-time backup codes
  const backupCodes: string[] = [];
  const hashedBackupCodes: string[] = [];

  for (let i = 0; i < 10; i++) {
    // Format: XXXX-XXXX (easy to type)
    const code = `${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    backupCodes.push(code);
    const hashed = await bcrypt.hash(code, 10);
    hashedBackupCodes.push(hashed);
  }

  return {
    secret: encryptedSecret,
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes, // Show to user ONCE — they must save these
    hashedBackupCodes,
  };
};

// ─── Verify TOTP code ─────────────────────────────────────────────────────────
export const verifyTOTP = (encryptedSecret: string, token: string): boolean => {
  try {
    const plainSecret = decryptSecret(encryptedSecret);
    return speakeasy.totp.verify({
      secret: plainSecret,
      encoding: "base32",
      token: token.replace(/\s/g, ""), // Handle spaces
      window: 1, // Allow 30-second drift either side
    });
  } catch {
    return false;
  }
};

// ─── Verify backup code ───────────────────────────────────────────────────────
// Returns index of used code (to remove it), or -1 if invalid
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
