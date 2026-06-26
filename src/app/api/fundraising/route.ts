import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get("campaignId");

  if (!campaignId) {
    return NextResponse.json(
      { error: "campaignId is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const campaign = await Campaign.findById(campaignId)
      .select("targetAmount raisedAmount currency name")
      .lean();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      targetAmount: campaign.targetAmount,
      raisedAmount: campaign.raisedAmount,
      currency: campaign.currency,
      name: campaign.name,
      checkoutUrl: (campaign as Record<string, unknown>).checkoutUrl || "",
    });
  } catch (error) {
    console.error("Error fetching fundraising data:", error);
    return NextResponse.json(
      { error: "Failed to fetch fundraising data" },
      { status: 500 }
    );
  }
}
