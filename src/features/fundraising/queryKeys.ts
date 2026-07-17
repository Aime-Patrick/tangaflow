export const fundraisingKeys = {
  all: ["fundraising"] as const,
  detail: (campaignId: string) => [...fundraisingKeys.all, campaignId] as const,
};
