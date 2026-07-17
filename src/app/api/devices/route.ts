import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

// GET - List devices for organization
export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.userId as string;

    await connectToDatabase();

    // Get user's organization
    const { Organization } = await import("@/models/Organization");
    const org = await Organization.findOne({ "members.userId": userId });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const devices = await Device.find({ organizationId: org._id })
      .sort({ createdAt: -1 })
      .select("-__v");

    return NextResponse.json({ devices });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST - Create new device
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.userId as string;

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().isEmpty) {
      return NextResponse.json({ error: "Device name is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Get user's organization
    const { Organization } = await import("@/models/Organization");
    const org = await Organization.findOne({ "members.userId": userId });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Generate unique API key
    const apiKey = `momo_${crypto.randomBytes(32).toString("hex")}`;

    const device = await Device.create({
      _id: `device_${crypto.randomBytes(16).toString("hex")}`,
      name: name.trim(),
      apiKey,
      organizationId: org._id,
      isActive: true,
    });

    return NextResponse.json({ device }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// DELETE - Remove device
export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.userId as string;

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("id");

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Get user's organization
    const { Organization } = await import("@/models/Organization");
    const org = await Organization.findOne({ "members.userId": userId });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Delete device (only if it belongs to the organization)
    const deleted = await Device.findOneAndDelete({
      _id: deviceId,
      organizationId: org._id,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
