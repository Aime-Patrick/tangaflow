import { NextResponse } from "next/server";
import { buildSessionCookie } from "@/lib/auth";

export function getAppUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

export function oauthErrorRedirect(
  request: Request,
  reason = "oauth_failed"
): NextResponse {
  const url = new URL("/", getAppUrl(request));
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export function oauthSuccessRedirect(
  request: Request,
  token: string
): NextResponse {
  const response = NextResponse.redirect(new URL("/dashboard", getAppUrl(request)));
  response.headers.set("Set-Cookie", buildSessionCookie(token));
  return response;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
