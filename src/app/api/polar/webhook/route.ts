import { NextRequest, NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = validateEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  if (event.type === "order.paid") {
    const order = event.data;

    // metadata comes from the checkout session's metadata field
    const rawMeta = (order as unknown as { metadata?: Record<string, string> }).metadata;
    const campaignId = rawMeta?.campaignId || rawMeta?.campaignid;

    // amount is in cents from the order.paid event
    const amountInCents = order.metadata?.amount ?? 0;

    if (!campaignId || !amountInCents) {
      console.error("Missing campaignId or amount in webhook", { campaignId, amountInCents });
      return NextResponse.json({ received: true });
    }

    await connectToDatabase();
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: { raisedAmount: amountInCents } },
      { new: true }
    );

    if (!campaign) {
      console.error(`Campaign not found: ${campaignId}`);
    }
  }

  return NextResponse.json({ received: true });
}
