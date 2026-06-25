import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, amountInCents } = body;

    if (!campaignId || !amountInCents) {
      return NextResponse.json(
        { error: "campaignId and amountInCents are required" },
        { status: 400 }
      );
    }

    if (amountInCents < 100) {
      return NextResponse.json(
        { error: "Minimum donation is $1 (100 cents)" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const campaign = await Campaign.findById(campaignId).lean();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const checkout = await polar.checkouts.create({
      products: [process.env.POLAR_DONATION_PRODUCT_ID!],
      amount: amountInCents,
      successUrl: `${process.env.SUCCESS_URL}?campaignId=${campaignId}`,
      metadata: {
        campaignId,
        amountInCents: amountInCents.toString(),
      },
    });

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
