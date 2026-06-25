import { NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const secret = process.env.POLAR_WEBHOOK_SECRET!;

    const event = validateEvent(body, headers, secret);

    if (event.type !== "order.paid") {
      return NextResponse.json({ received: true });
    }

    const order = event.data;
    const campaignId = String(order.metadata?.campaignId || "");
    const amountInCents = Number(order.metadata?.amountInCents || 0);

    if (!campaignId || !amountInCents) {
      return NextResponse.json(
        { error: "Missing campaignId or amountInCents in metadata" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: { raisedAmount: amountInCents } },
      { new: true }
    );

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
