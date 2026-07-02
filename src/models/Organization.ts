import mongoose, { Schema, Document } from "mongoose";

export type OrgRole = "owner" | "admin" | "member";

export interface IOrgMembership {
  userId: mongoose.Types.ObjectId;
  role: OrgRole;
  joinedAt: Date;
}

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  ownerId: mongoose.Types.ObjectId;
  members: IOrgMembership[];
  createdAt: Date;
  updatedAt: Date;
}

const OrgMembershipSchema = new Schema<IOrgMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: String,
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [OrgMembershipSchema],
  },
  { timestamps: true }
);

OrganizationSchema.index({ "members.userId": 1 });

export const Organization =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
