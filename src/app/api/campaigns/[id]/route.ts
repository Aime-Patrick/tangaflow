import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";
import { getSessionWithOrganization } from "@/lib/auth";
import { canManageCampaign, canViewCampaign } from "@/lib/campaign-access";
import { z } from "zod";

const updateCampaignSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").trim().optional(),
  targetAmount: z.number().min(1, "Target amount must be at least $1").optional(),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "KRW", "INR", "BRL", "RWF", "NGN", "ZAR", "KES", "GHS"]).optional(),
  barcodeType: z.enum(["qr", "zerocode"]).optional(),
  pptxUrl: z.string().optional(),
  slideImages: z.array(z.string()).optional(),
  currentSlide: z.number().min(0).optional(),
  totalSlides: z.number().min(0).optional(),
  isPlaying: z.boolean().optional(),
  checkoutUrl: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionWithOrganization();
    if (!auth?.organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const campaign = await Campaign.findById(id).lean();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (
      !canViewCampaign(
        auth.organization.role,
        auth.user._id,
        auth.organization._id,
        campaign
      )
    ) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionWithOrganization();
    if (!auth?.organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const existing = await Campaign.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (
      !canManageCampaign(
        auth.organization.role,
        auth.user._id,
        auth.organization._id,
        existing
      )
    ) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();

    const parsed = updateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const campaign = await Campaign.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    // Broadcast campaign update to SSE listeners
    const { broadcastCampaignUpdate } = await import("@/lib/sse-broadcast");
    broadcastCampaignUpdate(id, {
      type: "campaign_updated",
      campaignId: id,
      ...updates,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}
