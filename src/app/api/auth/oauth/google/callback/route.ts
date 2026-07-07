import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { createSession } from "@/lib/auth";
import {
  getAppUrl,
  oauthErrorRedirect,
  oauthSuccessRedirect,
} from "@/lib/oauth";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

async function getGoogleTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as GoogleTokenResponse;
  if (!res.ok || !data.access_token) {
    console.error("Google token exchange failed:", data);
    throw new Error(data.error_description || "Failed to exchange Google code");
  }

  return data;
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
      return oauthErrorRedirect(request);
    }

    const redirectUri = `${getAppUrl(request)}/api/auth/oauth/google/callback`;
    const tokens = await getGoogleTokens(code, redirectUri);
    const googleUser = await getGoogleUserInfo(tokens.access_token!);

    if (!googleUser.email) {
      return oauthErrorRedirect(request, "oauth_no_email");
    }

    await connectToDatabase();

    let user = await User.findOne({ "providers.google.id": googleUser.id });

    if (!user) {
      user = await User.findOne({ email: googleUser.email.toLowerCase() });
      if (user) {
        user.providers = user.providers || {};
        user.providers.google = {
          id: googleUser.id,
          email: googleUser.email,
        };
        if (!user.avatar) user.avatar = googleUser.picture;
        if (!user.emailVerified) user.emailVerified = new Date();
        await user.save();
      } else {
        user = await User.create({
          email: googleUser.email.toLowerCase(),
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

    const { token } = await createSession(
      user._id.toString(),
      request.headers.get("user-agent") || undefined,
      request.headers.get("x-forwarded-for") || undefined
    );

    return oauthSuccessRedirect(request, token);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return oauthErrorRedirect(request);
  }
}
