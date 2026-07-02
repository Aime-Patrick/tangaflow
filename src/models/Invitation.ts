import mongoose, { Schema, type Document } from "mongoose";
import type { OrgRole } from "./Organization";

export interface IInvitation extends Document {
  email: string;
  organizationId: mongoose.Types.ObjectId;
  role: OrgRole;
  token: string;
  status: "pending" | "accepted" | "revoked";
  invitedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

InvitationSchema.index({ email: 1, organizationId: 1 });
InvitationSchema.index({ token: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invitation =
  mongoose.models.Invitation ||
  mongoose.model<IInvitation>("Invitation", InvitationSchema);
