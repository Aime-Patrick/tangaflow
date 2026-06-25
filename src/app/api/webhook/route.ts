import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;

  // Standard Webhooks: secret is base64 encoded
  const secretBytes = Buffer.from(secret, "base64");

  // Signature format: "v1,<base64_signature>" or "v1t=<timestamp>,<base64_signature>"
  const parts = signatureHeader.split(",");
  const signaturePart = parts.find((p) => p.startsWith("v1,"));
  if (!signaturePart) return false;

  const expectedSig = signaturePart.replace("v1,", "");
  const computedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(body)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(computedSig)
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("webhook-signature");

  if (!verifyWebhookSignature(body, signature, process.env.POLAR_WEBHOOK_SECRET!)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const event = JSON.parse(body);

  if (event.type === "order.paid") {
    const order = event.data;
    const campaignId = String(order.metadata?.campaignId || "");
    const amountInCents = Number(order.metadata?.amountInCents || 0);

    if (!campaignId || !amountInCents) {
      console.error("Missing campaignId or amountInCents in webhook metadata");
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
