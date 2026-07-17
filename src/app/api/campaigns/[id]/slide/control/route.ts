import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";
import { getSessionWithOrganization } from "@/lib/auth";
import { canManageCampaign } from "@/lib/campaign-access";
import { z } from "zod";

const slideControlSchema = z.object({
  action: z.enum(["next", "prev", "goto"]),
  slideIndex: z.number().min(0).optional(),
});

export async function POST(
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

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (
      !canManageCampaign(
        auth.organization.role,
        auth.user._id,
        auth.organization._id,
        campaign
      )
    ) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = slideControlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, slideIndex } = parsed.data;
    const total = campaign.totalSlides || 0;
    let next = campaign.currentSlide || 0;

    if (action === "next") {
      // If totalSlides is not known yet (phone uploaded, web not opened),
      // allow advancing — the display clamps to its local slide count.
      next = total > 0 ? Math.min(next + 1, total - 1) : next + 1;
    } else if (action === "prev") {
      next = Math.max(next - 1, 0);
    } else if (action === "goto") {
      if (slideIndex === undefined) {
        return NextResponse.json({ error: "slideIndex required for goto" }, { status: 400 });
      }
      next =
        total > 0
          ? Math.max(0, Math.min(slideIndex, total - 1))
          : Math.max(0, slideIndex);
    }

    campaign.currentSlide = next;
    await campaign.save();

    // Broadcast slide change to SSE listeners
    const { broadcastCampaignUpdate } = await import("@/lib/sse-broadcast");
    broadcastCampaignUpdate(id, {
      type: "slide_changed",
      campaignId: id,
      currentSlide: campaign.currentSlide,
      totalSlides: campaign.totalSlides,
      isPlaying: campaign.isPlaying,
    });

    return NextResponse.json({
      currentSlide: campaign.currentSlide,
      totalSlides: campaign.totalSlides,
      isPlaying: campaign.isPlaying,
    });
  } catch (error) {
    console.error("Error controlling slide:", error);
    return NextResponse.json(
      { error: "Failed to control slide" },
      { status: 500 }
    );
  }
}
