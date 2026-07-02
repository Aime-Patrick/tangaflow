import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import { getAuthWithContext } from "@/lib/auth";

const updateRoleSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  role: z.enum(["admin", "member"]),
});

export async function PUT(
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
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId, role } = parsed.data;

    await connectToDatabase();

    const org = await Organization.findOne({ slug });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Cannot change owner's role
    if (userId === org.ownerId.toString()) {
      return NextResponse.json(
        { error: "Cannot change owner's role" },
        { status: 400 }
      );
    }

    const member = org.members.find(
      (m: { userId: { toString: () => string } }) => m.userId.toString() === userId
    );
    if (!member) {
      return NextResponse.json(
        { error: "User is not a member" },
        { status: 404 }
      );
    }

    member.role = role;
    await org.save();

    return NextResponse.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
