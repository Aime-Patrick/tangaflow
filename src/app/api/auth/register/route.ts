import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { createSession, setSessionCookie } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").trim(),
  orgName: z.string().min(1, "Organization name is required").trim(),
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

    const { email, password, name, orgName } = parsed.data;

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      emailVerified: new Date(),
    });

    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const org = await Organization.create({
      name: orgName,
      slug,
      ownerId: user._id,
      members: [{ userId: user._id, role: "owner" }],
    });

    const { token, session } = await createSession(
      user._id.toString(),
      request.headers.get("user-agent") || undefined,
      request.headers.get("x-forwarded-for") || undefined
    );

    const response = NextResponse.json(
      {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
        organization: {
          _id: org._id,
          name: org.name,
          slug: org.slug,
        },
        role: "owner" as const,
      },
      { status: 201 }
    );

    response.headers.set(
      "Set-Cookie",
      `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${
        7 * 24 * 60 * 60
      }${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}
