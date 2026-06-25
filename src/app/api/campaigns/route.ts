import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

function generateSessionKey(): string {
  return crypto.randomUUID().slice(0, 12);
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { name, targetAmount, currency = "USD" } = body;

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: "Name and targetAmount are required" },
        { status: 400 }
      );
    }

    if (targetAmount < 100) {
      return NextResponse.json(
        { error: "Target amount must be at least 100 cents ($1)" },
        { status: 400 }
      );
    }

    const sessionKey = generateSessionKey();

    const campaign = await Campaign.create({
      _id: sessionKey,
      name,
      targetAmount,
      raisedAmount: 0,
      currency,
      qrEnabled: true,
      qrText: "Scan to Donate",
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
