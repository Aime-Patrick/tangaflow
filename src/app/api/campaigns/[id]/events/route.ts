import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";
import { addListener, getListenerCount } from "@/lib/sse-broadcast";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;

  await connectToDatabase();
  const campaign = await Campaign.findById(campaignId).lean();
  if (!campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial state
      const initialPayload = `data: ${JSON.stringify({
        type: "connected",
        campaignId,
        raisedAmount: campaign.raisedAmount,
        targetAmount: campaign.targetAmount,
        currency: campaign.currency,
        currentSlide: campaign.currentSlide,
        totalSlides: campaign.totalSlides,
        isPlaying: campaign.isPlaying,
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // Register for live updates
      const unsubscribe = addListener(campaignId, (data) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed
        }
      });

      // Send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Clean up on disconnect
      request.signal?.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
