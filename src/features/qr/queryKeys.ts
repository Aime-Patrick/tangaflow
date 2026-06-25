export const qrKeys = {
  all: ["qr"] as const,
  lists: () => [...qrKeys.all, "list"] as const,
  list: (campaignId?: string) =>
    [...qrKeys.lists(), { campaignId }] as const,
  details: () => [...qrKeys.all, "detail"] as const,
  detail: (id: string) => [...qrKeys.details(), id] as const,
  count: (campaignId?: string) =>
    [...qrKeys.all, "count", { campaignId }] as const,
};
