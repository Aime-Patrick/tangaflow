import { NextRequest, NextResponse } from "next/server";

const POLAR_BASE_URL =
  process.env.POLAR_ENV === "sandbox"
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const products = searchParams.get("products");
  const metadataRaw = searchParams.get("metadata");

  if (!products) {
    return NextResponse.json({ error: "Missing products param" }, { status: 400 });
  }

  let metadata: Record<string, string> = {};
  if (metadataRaw) {
    try {
      metadata = JSON.parse(decodeURIComponent(metadataRaw));
    } catch {
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }
  }

  const res = await fetch(`${POLAR_BASE_URL}/v1/checkouts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      products: [products],
      metadata,
      success_url: process.env.SUCCESS_URL,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Polar checkout creation failed:", res.status, err);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 502 });
  }

  const checkout = await res.json();

  return NextResponse.redirect(checkout.url, 303);
}
