import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import config from "../config/env.config";

export enum UserRole {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
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
  isActive: boolean;
  isEmailVerified: boolean;

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

  profile: {
    firstName: string;
    lastName: string;
    bio: string;
    avatarUrl: string | null;
  };

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  isPasswordInHistory(candidatePassword: string): Promise<boolean>;
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
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },

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
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
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

    profile: {
      firstName: { type: String, trim: true, maxlength: 50, default: "" },
      lastName: { type: String, trim: true, maxlength: 50, default: "" },
      bio: { type: String, trim: true, maxlength: 500, default: "" },
      avatarUrl: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    versionKey: false,
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

        if (ret.emailVerificationCode) {
          delete ret.emailVerificationCode;
        }

        if (ret.passwordResetToken) {
          delete ret.passwordResetToken;
        }

        if (ret.passwordResetCode) {
          delete ret.passwordResetCode;
        }

        if (ret.activeRefreshTokens) {
          delete ret.activeRefreshTokens;
        }

        return ret;
      },
    },
  },
);

userSchema.index({ passwordResetToken: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
userSchema.index({ lockedUntil: 1 }, { expireAfterSeconds: 0, sparse: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const SALT_ROUNDS = 12;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  this.passwordChangedAt = new Date();
  this.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

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

userSchema.methods.generatePasswordResetToken = function (): {
  token: string;
  code: string;
} {
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
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  this.passwordResetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  return { token, code };
};

userSchema.methods.generateEmailVerificationToken = function (): {
  token: string;
  code: string;
} {
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
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  this.emailVerificationCodeExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ); // 24h
  return { token, code };
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
