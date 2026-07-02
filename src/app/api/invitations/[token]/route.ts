import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getInvitationDetailsByToken } from "@/lib/invitations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    await connectToDatabase();

    const invitation = await getInvitationDetailsByToken(token);
    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Get invitation error:", error);
    return NextResponse.json(
      { error: "Failed to load invitation" },
      { status: 500 }
    );
  }
}
