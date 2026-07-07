import { NextResponse } from "next/server";
import { getAppUrl, isGoogleOAuthConfigured } from "@/lib/oauth";

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 503 }
    );
  }

  const redirectUri = `${getAppUrl(request)}/api/auth/oauth/google/callback`;
  const scope = "email profile";

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=select_account`;

  return NextResponse.redirect(url);
}
