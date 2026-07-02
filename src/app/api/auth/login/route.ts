import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getPendingInvitationsForEmail } from "@/lib/invitations";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { createSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { token, session } = await createSession(
      user._id.toString(),
      request.headers.get("user-agent") || undefined,
      request.headers.get("x-forwarded-for") || undefined
    );

    const org = await Organization.findOne({ "members.userId": user._id });
    const member = org?.members.find(
      (m: { userId: { toString: () => string } }) => m.userId.toString() === user._id.toString()
    );

    const pendingInvitations = await getPendingInvitationsForEmail(user.email);

    const response = NextResponse.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      organization: org
        ? {
            _id: org._id,
            name: org.name,
            slug: org.slug,
          }
        : null,
      role: member?.role || null,
      pendingInvitations,
    });

    response.headers.set(
      "Set-Cookie",
      `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${
        7 * 24 * 60 * 60
      }${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
