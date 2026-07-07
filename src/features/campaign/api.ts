import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from "./types";

export async function getCampaigns(): Promise<Campaign[]> {
  const res = await fetch("/api/campaigns");
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
}

export class CampaignRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "CampaignRequestError";
    this.status = status;
  }
}

export async function getCampaign(id: string): Promise<Campaign> {
  const res = await fetch(`/api/campaigns/${id}`);
  if (!res.ok) {
    throw new CampaignRequestError(res.status, "Failed to fetch campaign");
  }
  return res.json();
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const res = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create campaign");
  return res.json();
}

export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput
): Promise<Campaign> {
  const res = await fetch(`/api/campaigns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update campaign");
  return res.json();
}
