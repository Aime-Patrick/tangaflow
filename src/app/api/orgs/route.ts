import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import { getAuthWithContext } from "@/lib/auth";

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required").trim(),
});

export async function GET() {
  try {
    const auth = await getAuthWithContext();
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    const orgs = await Organization.find({
      "members.userId": auth.user._id,
    }).lean();

    return NextResponse.json(orgs);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthWithContext();
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createOrgSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    await connectToDatabase();

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await Organization.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "Organization name already taken" },
        { status: 409 }
      );
    }

    const org = await Organization.create({
      name,
      slug,
      ownerId: auth.user._id,
      members: [{ userId: auth.user._id, role: "owner" }],
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
