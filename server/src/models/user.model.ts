import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import config from "../config/env.config";

// ─── Role Definitions ─────────────────────────────────────────────────────────
export enum UserRole {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

// ─── Password History Entry ───────────────────────────────────────────────────
interface IPasswordHistory {
  hash: string;
  changedAt: Date;
}

// ─── User Interface ───────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;

  // ── MFA ──────────────────────────────────────────────────────────────────────
  mfa: {
    enabled: boolean;
    secret: string | null; // Encrypted TOTP secret
    backupCodes: string[]; // Hashed backup codes
    setupPending: boolean;
  };

  // ── Security ─────────────────────────────────────────────────────────────────
  passwordHistory: IPasswordHistory[];
  passwordChangedAt: Date;
  passwordExpiresAt: Date;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;

  // ── Email Verification / Password Reset ──────────────────────────────────────
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;

  // ── Session Binding ──────────────────────────────────────────────────────────
  activeRefreshTokens: {
    tokenHash: string;
    userAgent: string;
    ip: string;
    createdAt: Date;
    expiresAt: Date;
  }[];

  // ── Profile ──────────────────────────────────────────────────────────────────
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
    avatarUrl: string | null;
  };

  createdAt: Date;
  updatedAt: Date;

  // ── Methods ──────────────────────────────────────────────────────────────────
  comparePassword(candidatePassword: string): Promise<boolean>;
  isPasswordInHistory(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementFailedAttempts(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  isPasswordExpired(): boolean;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      // Regex validated at application layer too — this is a DB-level guard
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      maxlength: [254, "Email cannot exceed 254 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens, underscores",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [12, "Password must be at least 12 characters"],
      select: false, // NEVER return password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },

    // ── MFA ────────────────────────────────────────────────────────────────────
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: null, select: false }, // Encrypted at rest
      backupCodes: { type: [String], default: [], select: false },
      setupPending: { type: Boolean, default: false },
    },

    // ── Security Fields ────────────────────────────────────────────────────────
    passwordHistory: {
      type: [
        {
          hash: { type: String, required: true },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },
    passwordChangedAt: { type: Date, default: Date.now },
    passwordExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },

    // ── Tokens ─────────────────────────────────────────────────────────────────
    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null },

    // ── Refresh Tokens (stored hashed) ─────────────────────────────────────────
    activeRefreshTokens: {
      type: [
        {
          tokenHash: { type: String, required: true },
          userAgent: { type: String, required: true },
          ip: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
          expiresAt: { type: Date, required: true },
        },
      ],
      default: [],
      select: false,
    },

    // ── Profile ────────────────────────────────────────────────────────────────
    profile: {
      firstName: { type: String, trim: true, maxlength: 50, default: "" },
      lastName: { type: String, trim: true, maxlength: 50, default: "" },
      bio: { type: String, trim: true, maxlength: 500, default: "" },
      avatarUrl: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    // Don't expose __v
    versionKey: false,
    // Transform output — strip sensitive fields from toJSON
    toJSON: {
      transform(_doc, ret: any) {
        if (ret.password) {
          delete ret.password;
        }

        if (ret.mfa) {
          delete ret.mfa.secret;
          delete ret.mfa.backupCodes;
        }

        if (ret.passwordHistory) {
          delete ret.passwordHistory;
        }

        if (ret.emailVerificationToken) {
          delete ret.emailVerificationToken;
        }

        if (ret.passwordResetToken) {
          delete ret.passwordResetToken;
        }

        if (ret.activeRefreshTokens) {
          delete ret.activeRefreshTokens;
        }

        return ret;
      },
    },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ passwordResetToken: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
// TTL index to auto-clean expired lockouts (optional — handled in logic too)
userSchema.index({ lockedUntil: 1 }, { expireAfterSeconds: 0, sparse: true });

// ─── Pre-save: Hash password ──────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash if password field was modified
  if (!this.isModified("password")) return next();

  const SALT_ROUNDS = 12; // NIST recommends 10+; 12 is a strong balance
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  this.passwordChangedAt = new Date();
  // Reset expiry on password change
  this.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  next();
});

// ─── Method: Compare password ─────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: Check password history (prevent reuse of last 5) ────────────────
userSchema.methods.isPasswordInHistory = async function (
  candidatePassword: string,
): Promise<boolean> {
  const history = this.passwordHistory?.slice(-5) ?? [];
  for (const entry of history) {
    const match = await bcrypt.compare(candidatePassword, entry.hash);
    if (match) return true;
  }
  return false;
};

// ─── Method: Check if account is locked ──────────────────────────────────────
userSchema.methods.isLocked = function (): boolean {
  return this.lockedUntil !== null && this.lockedUntil > new Date();
};

// ─── Method: Increment failed login attempts ──────────────────────────────────
userSchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= config.lockout.maxFailedAttempts) {
    this.lockedUntil = new Date(
      Date.now() + config.lockout.durationMinutes * 60 * 1000,
    );
  }

  await this.save({ validateBeforeSave: false });
};

// ─── Method: Reset failed attempts on successful login ───────────────────────
userSchema.methods.resetFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  await this.save({ validateBeforeSave: false });
};

// ─── Method: Check password expiry ───────────────────────────────────────────
userSchema.methods.isPasswordExpired = function (): boolean {
  return this.passwordExpiresAt < new Date();
};

// ─── Method: Generate password reset token ───────────────────────────────────
userSchema.methods.generatePasswordResetToken = function (): string {
  // Generate cryptographically secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // Store hashed version in DB (raw token sent to user via email)
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return token;
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
