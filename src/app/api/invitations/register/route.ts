import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { createSession } from "@/lib/auth";
import {
  acceptInvitationByToken,
  getInvitationDetailsByToken,
  InvitationAcceptError,
} from "@/lib/invitations";

const registerSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    name: z.string().min(1, "Name is required").trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, name, password } = parsed.data;

    await connectToDatabase();

    const invitation = await getInvitationDetailsByToken(token);
    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({
      email: invitation.email.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email. Sign in to accept the invitation.",
        },
        { status: 409 }
      );
    }

    const user = await User.create({
      email: invitation.email.toLowerCase(),
      password,
      name,
      emailVerified: new Date(),
    });

    const { token: sessionToken, session } = await createSession(
      user._id.toString(),
      request.headers.get("user-agent") || undefined,
      request.headers.get("x-forwarded-for") || undefined
    );

    const result = await acceptInvitationByToken(token, {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
        organization: result.organization,
        role: invitation.role,
        message: result.message,
      },
      { status: 201 }
    );

    response.headers.set(
      "Set-Cookie",
      `session=${sessionToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${
        7 * 24 * 60 * 60
      }${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return response;
  } catch (error) {
    if (error instanceof InvitationAcceptError) {
      return NextResponse.json(
        { error: error.message, invitedEmail: error.invitedEmail },
        { status: error.status }
      );
    }

    console.error("Register via invitation error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
