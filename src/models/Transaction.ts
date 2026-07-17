import mongoose, { Schema } from "mongoose";

export interface ITransaction {
  _id: string;
  campaignId: string;
  source: "momo_sms" | "polar";
  ftId?: string;
  amount: number;
  senderName?: string;
  senderPhoneLast3?: string;
  status: "matched" | "unmatched" | "pending";
  rawSms?: string;
  deviceId?: string;
  smsTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      enum: ["momo_sms", "polar"],
    },
    ftId: {
      type: String,
      unique: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    senderName: {
      type: String,
    },
    senderPhoneLast3: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["matched", "unmatched", "pending"],
      default: "pending",
    },
    rawSms: {
      type: String,
    },
    deviceId: {
      type: String,
    },
    smsTimestamp: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ campaignId: 1, createdAt: -1 });

export const Transaction =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
