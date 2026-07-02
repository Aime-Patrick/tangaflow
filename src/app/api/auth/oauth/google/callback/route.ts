import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { createSession } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

async function getGoogleTokens(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) throw new Error("Failed to exchange Google code");
  return res.json();
}

async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Google user info");
  return res.json();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", request.url)
      );
    }

    const tokens = await getGoogleTokens(code);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    await connectToDatabase();

    let user = await User.findOne({ "providers.google.id": googleUser.id });

    if (!user) {
      user = await User.findOne({ email: googleUser.email });
      if (user) {
        user.providers.google = {
          id: googleUser.id,
          email: googleUser.email,
        };
        if (!user.avatar) user.avatar = googleUser.picture;
        await user.save();
      } else {
        user = await User.create({
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          emailVerified: new Date(),
          providers: {
            google: {
              id: googleUser.id,
              email: googleUser.email,
            },
          },
        });

        const slug = googleUser.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        await Organization.create({
          name: `${googleUser.name}'s Org`,
          slug: `${slug}-${Date.now()}`,
          ownerId: user._id,
          members: [{ userId: user._id, role: "owner" }],
        });
      }
    }

    const { token, session } = await createSession(
      user._id.toString(),
      request.headers.get("user-agent") || undefined,
      request.headers.get("x-forwarded-for") || undefined
    );

    const response = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );

    response.headers.set(
      "Set-Cookie",
      `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${
        7 * 24 * 60 * 60
      }${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return response;
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
