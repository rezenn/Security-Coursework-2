import mongoose, { Schema, Model, Document } from "mongoose";

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  resourceId: string;
  amountCents: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  signature: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      maxlength: 3,
      minlength: 3,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    signature: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

transactionSchema.index({ user: 1, resourceId: 1 });

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema,
);

export default Transaction;
