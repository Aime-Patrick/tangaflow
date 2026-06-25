import { Webhooks } from "@polar-sh/nextjs";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onOrderPaid: async (payload) => {
    const order = payload.data;
    const campaignId = String(order.metadata?.campaignId || "");
    const amountInCents = Number(order.metadata?.amountInCents || 0);

    if (!campaignId || !amountInCents) {
      console.error("Missing campaignId or amountInCents in webhook metadata");
      return;
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
  },
});
