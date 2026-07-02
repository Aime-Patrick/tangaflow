import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getPendingInvitationsForEmail } from "@/lib/invitations";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";

export async function GET() {
  try {
    const auth = await getSessionFromRequest();
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    const org = await Organization.findOne({ "members.userId": auth.user._id });

    const member = org?.members.find(
      (m: { userId: { toString: () => string } }) => m.userId.toString() === auth.user._id
    );

    const pendingInvitations = await getPendingInvitationsForEmail(
      auth.user.email
    );

    return NextResponse.json({
      user: auth.user,
      session: auth.session,
      organization: org
        ? {
            _id: org._id.toString(),
            name: org.name,
            slug: org.slug,
          }
        : null,
      role: member?.role || null,
      pendingInvitations,
    });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
