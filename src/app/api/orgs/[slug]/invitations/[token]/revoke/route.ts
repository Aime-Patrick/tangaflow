import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import { Invitation } from "@/models/Invitation";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  try {
    const auth = await getSessionFromRequest();
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { slug, token } = await params;

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

    const invitation = await Invitation.findOne({
      token,
      organizationId: org._id,
      status: "pending",
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    invitation.status = "revoked";
    await invitation.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke invitation error:", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
