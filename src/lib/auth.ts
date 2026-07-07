import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import type { OrgRole } from "@/models/Organization";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface JWTPayload {
  userId: string;
  sessionId: string;
}

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthContext {
  user: AuthUser;
  session: { _id: string; expiresAt: Date };
  organization?: {
    _id: string;
    name: string;
    slug: string;
    role: OrgRole;
  };
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; session: { _id: string; expiresAt: Date } }> {
  await connectToDatabase();

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await Session.create({
    userId,
    token: crypto.randomUUID(),
    expiresAt,
    userAgent,
    ipAddress,
  });

  const jwtToken = await signToken({
    userId,
    sessionId: session._id.toString(),
  });

  return {
    token: jwtToken,
    session: {
      _id: session._id.toString(),
      expiresAt,
    },
  };
}

export function buildSessionCookie(token: string): string {
  return `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${
    7 * 24 * 60 * 60
  }${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionFromRequest(): Promise<AuthContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    await connectToDatabase();

    const session = await Session.findById(payload.sessionId);
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const user = await User.findById(payload.userId);
    if (!user) return null;

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      session: {
        _id: session._id.toString(),
        expiresAt: session.expiresAt,
      },
    };
  } catch {
    return null;
  }
}

export async function getAuthWithContext(
  orgSlug?: string
): Promise<AuthContext | null> {
  const auth = await getSessionFromRequest();
  if (!auth || !orgSlug) return auth;

  await connectToDatabase();
  const org = await Organization.findOne({ slug: orgSlug });
  if (!org) return auth;

  const membership = org.members.find(
    (m: { userId: { toString: () => string } }) => m.userId.toString() === auth.user._id
  );
  if (!membership) return auth;

  auth.organization = {
    _id: org._id.toString(),
    name: org.name,
    slug: org.slug,
    role: membership.role,
  };

  return auth;
}

export async function getSessionWithOrganization(): Promise<AuthContext | null> {
  const auth = await getSessionFromRequest();
  if (!auth) return null;

  await connectToDatabase();
  const org = await Organization.findOne({ "members.userId": auth.user._id });
  if (!org) return auth;

  const membership = org.members.find(
    (m: { userId: { toString: () => string } }) =>
      m.userId.toString() === auth.user._id
  );
  if (!membership) return auth;

  auth.organization = {
    _id: org._id.toString(),
    name: org.name,
    slug: org.slug,
    role: membership.role,
  };

  return auth;
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return;

    const payload = await verifyToken(token);
    if (payload) {
      await connectToDatabase();
      await Session.findByIdAndDelete(payload.sessionId);
    }

    cookieStore.delete("session");
  } catch {
    // Silently fail
  }
}
