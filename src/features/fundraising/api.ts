import type { FundraisingData } from "./types";

export async function getFundraising(campaignId: string): Promise<FundraisingData> {
  const res = await fetch(`/api/fundraising?campaignId=${campaignId}`);
  if (!res.ok) throw new Error("Failed to fetch fundraising data");
  return res.json();
}
