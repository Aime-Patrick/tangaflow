import type { QRCode } from "../types";

export async function getQRCodes(campaignId?: string): Promise<QRCode[]> {
  const params = new URLSearchParams();
  if (campaignId) params.set("campaignId", campaignId);

  const queryString = params.toString();
  const url = queryString ? `/api/qr?${queryString}` : "/api/qr";

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch QR codes");
  return res.json();
}
