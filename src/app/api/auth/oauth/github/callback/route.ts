import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { createSession } from "@/lib/auth";
import {
  oauthErrorRedirect,
  oauthSuccessRedirect,
} from "@/lib/oauth";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
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

  const data = (await res.json()) as GitHubTokenResponse;
  if (!res.ok || !data.access_token) {
    console.error("GitHub token exchange failed:", data);
    throw new Error(data.error_description || "Failed to exchange GitHub code");
  }

  return data;
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
      return oauthErrorRedirect(request);
    }

    const tokens = await getGitHubTokens(code);
    const githubUser = await getGitHubUser(tokens.access_token!);

    let email = githubUser.email;
    if (!email) {
      const emails = await getGitHubEmails(tokens.access_token!);
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email || emails.find((e) => e.verified)?.email || "";
    }

    if (!email) {
      return oauthErrorRedirect(request, "oauth_no_email");
    }

    const githubId = githubUser.id.toString();

    await connectToDatabase();

    let user = await User.findOne({ "providers.github.id": githubId });

    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        user.providers = user.providers || {};
        user.providers.github = {
          id: githubId,
          email,
        };
        if (!user.avatar) user.avatar = githubUser.avatar_url;
        if (!user.emailVerified) user.emailVerified = new Date();
        await user.save();
      } else {
        const displayName = githubUser.name || githubUser.login;

        user = await User.create({
          email: email.toLowerCase(),
          name: displayName,
          avatar: githubUser.avatar_url,
          emailVerified: new Date(),
          providers: {
            github: {
              id: githubId,
              email,
            },
          },
        });

        const slug = displayName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        await Organization.create({
          name: `${displayName}'s Org`,
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
    console.error("GitHub OAuth error:", error);
    return oauthErrorRedirect(request);
  }
}
