import mongoose, { Document, Schema, Model } from "mongoose";

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amountCents: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  stripePaymentIntentId: string;
  stripeChargeId: string | null;
  signature: string; // HMAC integrity check
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    amountCents: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      maxlength: 3,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    stripePaymentIntentId: { type: String, required: true },
    stripeChargeId: { type: String, default: null },
    signature: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false },
);

transactionSchema.index({ user: 1 });
transactionSchema.index({ stripePaymentIntentId: 1 }, { unique: true });

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema,
);
export default Transaction;
