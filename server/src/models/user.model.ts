import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import config from "../config/env.config";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

interface IPasswordHistory {
  hash: string;
  changedAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  provider: AuthProvider;
  googleId: string | null;
  isActive: boolean;
  isEmailVerified: boolean;

  profile: {
    firstName: string;
    lastName: string;
    bio: string;
    avatarUrl: string | null;
  };

  mfa: {
    enabled: boolean;
    secret: string | null;
    backupCodes: string[];
    setupPending: boolean;
  };

  passwordHistory: IPasswordHistory[];
  passwordChangedAt: Date;
  passwordExpiresAt: Date;

  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;

  emailVerificationToken: string | null;
  emailVerificationCode: string | null;
  emailVerificationExpires: Date | null;
  emailVerificationCodeExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetCode: string | null;
  passwordResetExpires: Date | null;
  passwordResetCodeExpires: Date | null;

  activeRefreshTokens: {
    tokenHash: string;
    userAgent: string;
    ip: string;
    createdAt: Date;
    expiresAt: Date;
  }[];

  enrolledCourses: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
  isPasswordInHistory(candidate: string): Promise<boolean>;
  isLocked(): boolean;
  incrementFailedAttempts(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
  generatePasswordResetToken(): { token: string; code: string };
  generateEmailVerificationToken(): { token: string; code: string };
  isPasswordExpired(): boolean;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
      maxlength: 254,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      minlength: 12,
      select: false,
      // Not required — Google OAuth users have no password
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    googleId: { type: String, default: null, sparse: true },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },

    profile: {
      firstName: { type: String, trim: true, maxlength: 50, default: "" },
      lastName: { type: String, trim: true, maxlength: 50, default: "" },
      bio: { type: String, trim: true, maxlength: 500, default: "" },
      avatarUrl: { type: String, default: null },
    },

    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: null, select: false },
      backupCodes: { type: [String], default: [], select: false },
      setupPending: { type: Boolean, default: false },
    },

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
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },

    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationCode: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null },
    emailVerificationCodeExpires: { type: Date, default: null },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetCode: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null },
    passwordResetCodeExpires: { type: Date, default: null },

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

    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        if (ret.mfa && typeof ret.mfa === "object") {
          const mfa = ret.mfa as Record<string, unknown>;
          delete mfa.secret;
          delete mfa.backupCodes;
        }
        delete ret.passwordHistory;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationCode;
        delete ret.passwordResetToken;
        delete ret.passwordResetCode;
        delete ret.activeRefreshTokens;
        return ret;
      },
    },
  },
);

userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });

// Hash password on save (only if set and modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  this.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  next();
});

userSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isPasswordInHistory = async function (
  candidate: string,
): Promise<boolean> {
  const history = (this.passwordHistory as IPasswordHistory[])?.slice(-5) ?? [];
  for (const entry of history) {
    if (await bcrypt.compare(candidate, entry.hash)) return true;
  }
  return false;
};

userSchema.methods.isLocked = function (): boolean {
  return this.lockedUntil !== null && this.lockedUntil > new Date();
};

userSchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= config.lockout.maxFailedAttempts) {
    this.lockedUntil = new Date(
      Date.now() + config.lockout.durationMinutes * 60 * 1000,
    );
  }
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.isPasswordExpired = function (): boolean {
  return this.passwordExpiresAt < new Date();
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  this.passwordResetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
  return { token, code };
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  this.emailVerificationCodeExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  );
  return { token, code };
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
