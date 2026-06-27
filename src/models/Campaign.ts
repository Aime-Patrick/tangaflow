import mongoose, { Schema } from "mongoose";

export interface ICampaign {
  _id: string;
  name: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  checkoutUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    raisedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "JPY", "KRW", "INR", "BRL", "RWF", "NGN", "ZAR", "KES", "GHS"],
    },
    checkoutUrl: {
      type: String,
      default: "",
    },
    barcodeType: {
      type: String,
      enum: ["qr", "zerocode"],
      default: "qr",
    },
  },
  {
    timestamps: true,
  }
);

export const Campaign =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);
