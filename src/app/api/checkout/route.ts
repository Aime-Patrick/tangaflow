import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

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

    const productId = process.env.POLAR_DONATION_PRODUCT_ID;
    const accessToken = process.env.POLAR_ACCESS_TOKEN;

    if (!productId || !accessToken) {
      return NextResponse.json(
        { error: "Polar not configured" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.polar.sh/v1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        products: [productId],
        amount: amountInCents,
        success_url: `${process.env.SUCCESS_URL}?campaignId=${campaignId}`,
        metadata: {
          campaignId,
          amountInCents: amountInCents.toString(),
        },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Polar API error:", error);
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 500 }
      );
    }

    const checkout = await res.json();

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
