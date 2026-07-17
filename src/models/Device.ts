import mongoose, { Schema } from "mongoose";

export interface IDevice {
  _id: string;
  name: string;
  apiKey: string;
  organizationId: mongoose.Types.ObjectId;
  isActive: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema(
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
    apiKey: {
      type: String,
      required: true,
      unique: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

DeviceSchema.index({ organizationId: 1 });

export const Device =
  mongoose.models.Device || mongoose.model<IDevice>("Device", DeviceSchema);
