"use client";

import { useQRCodeStore } from "@/stores/qrCodeStore";

export function useQRCodes(campaignId?: string) {
  const qrCodes = useQRCodeStore((state) => state.qrCodes);

  // Filter by campaignId if provided
  const filtered = campaignId
    ? qrCodes.filter((qr) => qr.campaignId === campaignId)
    : qrCodes;

  return {
    data: filtered,
    isLoading: false,
    isError: false,
  };
}
