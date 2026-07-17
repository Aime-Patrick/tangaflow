import { NextRequest, NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";
import { Transaction } from "@/models/Transaction";

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

    // Polar amount is in cents — extract from order or metadata
    const amountInCents = Number(
      (order as unknown as { amount?: number }).amount ??
        order.metadata?.amount ??
        0
    );
    const amountInDollars = amountInCents / 100;

    if (!campaignId) {
      console.error("Missing campaignId in webhook", { orderId: order.id });
      return NextResponse.json({ received: true });
    }

    if (!amountInDollars || amountInDollars <= 0) {
      console.error("Missing or invalid amount in webhook", { campaignId, amountInDollars });
      return NextResponse.json({ received: true });
    }

    await connectToDatabase();

    // Idempotent: skip if this order was already processed
    const existingTx = await Transaction.findOne({ ftId: order.id });
    if (existingTx) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Create transaction record
    await Transaction.create({
      _id: `polar_${order.id}`,
      campaignId,
      source: "polar",
      ftId: order.id,
      amount: amountInDollars,
      status: "matched",
    });

    // Increment campaign raisedAmount
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: { raisedAmount: amountInDollars } },
      { new: true }
    );

    if (!campaign) {
      console.error(`Campaign not found: ${campaignId}`);
      return NextResponse.json({ received: true });
    }

    // Broadcast update to SSE listeners
    const { broadcastCampaignUpdate } = await import("@/lib/sse-broadcast");
    broadcastCampaignUpdate(campaignId, {
      type: "fundraising_updated",
      campaignId,
      raisedAmount: campaign.raisedAmount,
      targetAmount: campaign.targetAmount,
      currency: campaign.currency,
      transaction: {
        id: `polar_${order.id}`,
        amount: amountInDollars,
        source: "polar",
      },
    });

    console.log("Polar donation confirmed:", {
      orderId: order.id,
      campaignId,
      amount: amountInDollars,
    });
  }

  return NextResponse.json({ received: true });
}
