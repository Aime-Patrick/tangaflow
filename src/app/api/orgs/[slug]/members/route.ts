import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { getAuthWithContext } from "@/lib/auth";

const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const auth = await getAuthWithContext(slug);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!auth.organization) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const org = await Organization.findOne({ slug });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const userIds = org.members.map(
      (m: { userId: { toString: () => string } }) => m.userId
    );
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(
      users.map((user) => [user._id.toString(), user])
    );

    const members = org.members.map(
      (m: {
        userId: { toString: () => string };
        role: string;
        joinedAt: Date;
      }) => {
        const user = userMap.get(m.userId.toString());
        return {
          userId: m.userId.toString(),
          email: user?.email ?? "",
          name: user?.name ?? "Unknown",
          role: m.role,
          joinedAt: m.joinedAt,
        };
      }
    );

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const auth = await getAuthWithContext(slug);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (
      !auth.organization ||
      !["owner", "admin"].includes(auth.organization.role)
    ) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = addMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }

    const org = await Organization.findOne({ slug });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const existingMember = org.members.find(
      (m: { userId: { toString: () => string } }) => m.userId.toString() === user._id.toString()
    );
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      );
    }

    org.members.push({
      userId: user._id,
      role,
      joinedAt: new Date(),
    });
    await org.save();

    return NextResponse.json({
      message: "Member added successfully",
      member: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role,
      },
    });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const auth = await getAuthWithContext(slug);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (
      !auth.organization ||
      !["owner", "admin"].includes(auth.organization.role)
    ) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const org = await Organization.findOne({ slug });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (userId === auth.user._id) {
      return NextResponse.json(
        { error: "Cannot remove yourself" },
        { status: 400 }
      );
    }

    org.members = org.members.filter(
      (m: { userId: { toString: () => string } }) => m.userId.toString() !== userId
    );
    await org.save();

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
