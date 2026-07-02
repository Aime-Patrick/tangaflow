import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import { Invitation } from "@/models/Invitation";
import { getSessionFromRequest } from "@/lib/auth";
import { sendEmail, generateInvitationEmail } from "@/lib/email";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getSessionFromRequest();
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    await connectToDatabase();

    const org = await Organization.findOne({ slug });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const currentMember = org.members.find(
      (m: { userId: { toString: () => string } }) => m.userId.toString() === auth.user._id
    );

    if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const existingMember = org.members.find(
      (m: { email: string }) => m.email?.toLowerCase() === email.toLowerCase()
    );
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 409 }
      );
    }

    const pendingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      organizationId: org._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (pendingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 409 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      organizationId: org._id,
      role,
      token,
      status: "pending",
      invitedBy: auth.user._id,
      expiresAt,
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite?token=${token}`;
    const emailHtml = generateInvitationEmail(org.name, inviteUrl, role);

    await sendEmail({
      to: email,
      subject: `You've been invited to join ${org.name}`,
      html: emailHtml,
    });

    return NextResponse.json({
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getSessionFromRequest();
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { slug } = await params;

    await connectToDatabase();

    const org = await Organization.findOne({ slug });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const currentMember = org.members.find(
      (m: { userId: { toString: () => string } }) => m.userId.toString() === auth.user._id
    );

    if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const invitations = await Invitation.find({
      organizationId: org._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    }).select("email role status token expiresAt createdAt");

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { error: "Failed to get invitations" },
      { status: 500 }
    );
  }
}
