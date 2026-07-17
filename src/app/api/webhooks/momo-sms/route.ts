import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Device } from "@/models/Device";
import { Campaign } from "@/models/Campaign";
import { getSessionWithOrganization } from "@/lib/auth";
import type { Types } from "mongoose";

type AuthContext = {
  organizationId: Types.ObjectId | string;
  deviceId: string;
  authMode: "session" | "device_key";
};

/**
 * Prefer the campaign currently being presented; fall back to newest in org.
 */
async function findCampaignForOrg(organizationId: Types.ObjectId | string) {
  const playing = await Campaign.findOne({
    organizationId,
    isPlaying: true,
  })
    .sort({ updatedAt: -1 })
    .lean();
  if (playing) return playing;

  return Campaign.findOne({ organizationId }).sort({ createdAt: -1 }).lean();
}

async function resolveAuth(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.replace(/^Bearer\s+/i, "").trim();

  // Optional legacy path: device API key (headless / shared receiver phones)
  if (apiKey) {
    await connectToDatabase();
    const device = await Device.findOne({ apiKey, isActive: true });
    if (!device) return null;

    device.lastSeenAt = new Date();
    await device.save();

    return {
      organizationId: device.organizationId,
      deviceId: device._id,
      authMode: "device_key",
    };
  }

  // Primary path: logged-in staff session (same cookie as remote / upload)
  const auth = await getSessionWithOrganization();
  if (!auth?.organization) return null;

  return {
    organizationId: auth.organization._id,
    deviceId: `session-${auth.user._id}`,
    authMode: "session",
  };
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Authentication required (sign in or device API key)" },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const body = await request.json();

  const {
    ftId,
    amount,
    senderName,
    senderPhoneLast3,
    smsTimestamp,
    rawMessage,
    deviceId: bodyDeviceId,
  } = body;

  if (!ftId || amount === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: ftId, amount" },
      { status: 400 }
    );
  }

  const existing = await Transaction.findOne({ ftId });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const auditDeviceId =
    (typeof bodyDeviceId === "string" && bodyDeviceId.trim()) || auth.deviceId;

  const matchedCampaign = await findCampaignForOrg(auth.organizationId);
  const matchedCampaignId = matchedCampaign?._id?.toString?.() ?? matchedCampaign?._id ?? "";

  const transaction = await Transaction.create({
    _id: `momo_${ftId}`,
    campaignId: matchedCampaignId || "",
    source: "momo_sms",
    ftId,
    amount,
    senderName,
    senderPhoneLast3,
    status: matchedCampaign ? "matched" : "unmatched",
    rawSms: rawMessage,
    deviceId: auditDeviceId,
    smsTimestamp: smsTimestamp ? new Date(smsTimestamp) : new Date(),
  });

  if (matchedCampaign && matchedCampaignId) {
    await Campaign.findByIdAndUpdate(matchedCampaignId, {
      $inc: { raisedAmount: amount },
    });

    const { broadcastCampaignUpdate } = await import("@/lib/sse-broadcast");
    broadcastCampaignUpdate(matchedCampaignId, {
      type: "fundraising_updated",
      campaignId: matchedCampaignId,
      raisedAmount: (matchedCampaign.raisedAmount || 0) + amount,
      targetAmount: matchedCampaign.targetAmount,
      currency: matchedCampaign.currency,
      transaction: {
        id: transaction._id,
        amount,
        senderName,
        senderPhoneLast3,
        smsTimestamp: transaction.smsTimestamp,
        source: "momo_sms",
      },
    });
  }

  console.log("MoMo SMS transaction received:", {
    authMode: auth.authMode,
    deviceId: auditDeviceId,
    ftId,
    amount,
    senderName,
    senderPhoneLast3,
    matchedCampaignId: matchedCampaignId || "(unmatched)",
  });

  return NextResponse.json({
    received: true,
    transactionId: transaction._id,
    matchedCampaignId: matchedCampaignId || null,
    authMode: auth.authMode,
  });
}
