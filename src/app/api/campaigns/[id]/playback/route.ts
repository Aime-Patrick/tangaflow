import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";
import { getSessionWithOrganization } from "@/lib/auth";
import { canManageCampaign } from "@/lib/campaign-access";
import { z } from "zod";

const playbackSchema = z.object({
  action: z.enum(["play", "pause", "toggle"]),
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
    const parsed = playbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action } = parsed.data;
    if (action === "play") campaign.isPlaying = true;
    else if (action === "pause") campaign.isPlaying = false;
    else campaign.isPlaying = !campaign.isPlaying;

    await campaign.save();

    // Broadcast playback change to SSE listeners
    const { broadcastCampaignUpdate } = await import("@/lib/sse-broadcast");
    broadcastCampaignUpdate(id, {
      type: "playback_changed",
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
    console.error("Error toggling playback:", error);
    return NextResponse.json(
      { error: "Failed to toggle playback" },
      { status: 500 }
    );
  }
}
