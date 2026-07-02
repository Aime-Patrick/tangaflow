import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { createSession } from "@/lib/auth";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

async function getGitHubTokens(code: string): Promise<GitHubTokenResponse> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!res.ok) throw new Error("Failed to exchange GitHub code");
  return res.json();
}

async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch GitHub user");
  return res.json();
}

async function getGitHubEmails(accessToken: string): Promise<GitHubEmail[]> {
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch GitHub emails");
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

    const tokens = await getGitHubTokens(code);
    const githubUser = await getGitHubUser(tokens.access_token);

    let email = githubUser.email;
    if (!email) {
      const emails = await getGitHubEmails(tokens.access_token);
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email || emails[0]?.email || "";
    }

    await connectToDatabase();

    let user = await User.findOne({ "providers.github.id": githubUser.id });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.providers.github = {
          id: githubUser.id.toString(),
          email,
        };
        if (!user.avatar) user.avatar = githubUser.avatar_url;
        await user.save();
      } else {
        user = await User.create({
          email,
          name: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
          emailVerified: new Date(),
          providers: {
            github: {
              id: githubUser.id.toString(),
              email,
            },
          },
        });

        const slug = (githubUser.name || githubUser.login)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        await Organization.create({
          name: `${githubUser.name || githubUser.login}'s Org`,
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
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
