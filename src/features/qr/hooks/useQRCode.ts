"use client";

import { useQRCodeStore } from "@/stores/qrCodeStore";

export function useQRCode(id: string) {
  const getQRCode = useQRCodeStore((state) => state.getQRCode);
  const qrCode = getQRCode(id);

  return {
    data: qrCode,
    isLoading: false,
    isError: false,
  };
}
