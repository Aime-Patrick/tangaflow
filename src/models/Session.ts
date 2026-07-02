import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    userAgent: String,
    ipAddress: String,
  },
  { timestamps: true }
);

SessionSchema.index({ userId: 1 });

export const Session =
  mongoose.models.Session ||
  mongoose.model<ISession>("Session", SessionSchema);
