import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { Session } from "@/models/Session";
import { Campaign } from "@/models/Campaign";
import { getSessionFromRequest } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();

    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orgName } = body;

    const user = await User.findById(session.user._id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const org = await Organization.findOne({ "members.userId": user._id });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (org.name !== orgName) {
      return NextResponse.json(
        { error: "Organization name does not match" },
        { status: 400 }
      );
    }

    // Delete all campaigns for this org
    await Campaign.deleteMany({ organizationId: org._id });

    // Delete the organization
    await Organization.findByIdAndDelete(org._id);

    // Delete all sessions for this user
    await Session.deleteMany({ userId: user._id });

    // Delete the user
    await User.findByIdAndDelete(user._id);

    const response = NextResponse.json({ success: true });

    // Clear the session cookie
    response.headers.set(
      "Set-Cookie",
      "session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
    );

    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
