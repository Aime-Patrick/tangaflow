import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import {
  acceptInvitationByToken,
  InvitationAcceptError,
} from "@/lib/invitations";

const acceptSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = acceptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token } = parsed.data;

    await connectToDatabase();

    const auth = await getSessionFromRequest();
    if (!auth) {
      return NextResponse.json(
        { error: "Please login or register to accept this invitation" },
        { status: 401 }
      );
    }

    const result = await acceptInvitationByToken(token, auth.user);

    return NextResponse.json({
      success: true,
      organization: result.organization,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof InvitationAcceptError) {
      return NextResponse.json(
        { error: error.message, invitedEmail: error.invitedEmail },
        { status: error.status }
      );
    }

    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
