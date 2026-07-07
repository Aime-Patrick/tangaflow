import { NextResponse } from "next/server";
import { getAppUrl, isGitHubOAuthConfigured } from "@/lib/oauth";

export async function GET(request: Request) {
  if (!isGitHubOAuthConfigured()) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured" },
      { status: 503 }
    );
  }

  const redirectUri = `${getAppUrl(request)}/api/auth/oauth/github/callback`;
  const scope = "read:user user:email";

  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(url);
}
