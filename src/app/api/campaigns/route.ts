import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";
import { getSessionWithOrganization } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  getCampaignListFilter,
} from "@/lib/campaign-access";
import { z } from "zod";

const POLAR_BASE_URL =
  process.env.POLAR_ENV === "sandbox"
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  targetAmount: z.number().min(1, "Target amount must be at least $1"),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "KRW", "INR", "BRL", "RWF", "NGN", "ZAR", "KES", "GHS"]).default("USD"),
  pptxUrl: z.string().optional(),
  slideImages: z.array(z.string()).optional(),
  currentSlide: z.number().min(0).optional(),
  totalSlides: z.number().min(0).optional(),
  isPlaying: z.boolean().optional(),
});

function generateSessionKey(): string {
  return crypto.randomUUID().slice(0, 12);
}

async function createPolarCheckoutSession(
  campaignId: string,
  currency: string
): Promise<string | null> {
  const productId = process.env.POLAR_DONATION_PRODUCT_ID;
  if (!productId) return null;

  try {
    const res = await fetch(`${POLAR_BASE_URL}/v1/checkouts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [productId],
        metadata: { campaignId },
      }),
    });

    if (!res.ok) {
      console.error("Failed to create Polar checkout session:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.url;
  } catch (err) {
    console.error("Error creating Polar checkout session:", err);
    return null;
  }
}

export async function GET() {
  try {
    const auth = await getSessionWithOrganization();
    if (!auth?.organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!hasPermission(auth.organization.role, "view_campaigns")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await connectToDatabase();

    const filter = getCampaignListFilter(
      auth.organization._id,
      auth.user._id,
      auth.organization.role
    );

    const campaigns = await Campaign.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getSessionWithOrganization();
    if (!auth?.organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!hasPermission(auth.organization.role, "create_campaigns")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();

    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, targetAmount, currency, pptxUrl, slideImages, currentSlide, totalSlides, isPlaying } = parsed.data;
    const sessionKey = generateSessionKey();

    const checkoutUrl = await createPolarCheckoutSession(sessionKey, currency);

    const campaign = await Campaign.create({
      _id: sessionKey,
      name,
      targetAmount,
      raisedAmount: 0,
      currency,
      checkoutUrl: checkoutUrl || "",
      pptxUrl: pptxUrl || "",
      slideImages: slideImages || [],
      currentSlide: currentSlide ?? 0,
      totalSlides: totalSlides ?? 0,
      isPlaying: isPlaying ?? false,
      organizationId: auth.organization._id,
      createdBy: auth.user._id,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
