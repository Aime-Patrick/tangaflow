import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QRCode, CreateQRCodeInput } from "@/types";

// Generate unique ID
function generateId(): string {
  return `qr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface QRCodeState {
  qrCodes: QRCode[];
  addQRCode: (input: CreateQRCodeInput) => QRCode;
  deleteQRCode: (id: string) => void;
  getQRCode: (id: string) => QRCode | undefined;
}

export const useQRCodeStore = create<QRCodeState>()(
  persist(
    (set, get) => ({
      qrCodes: [],

      addQRCode: (input) => {
        const newQRCode: QRCode = {
          id: generateId(),
          content: input.content,
          size: input.size ?? "MEDIUM",
          format: input.format ?? "png",
          label: input.label,
          campaignId: input.campaignId,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          qrCodes: [newQRCode, ...state.qrCodes],
        }));

        return newQRCode;
      },

      deleteQRCode: (id) => {
        set((state) => ({
          qrCodes: state.qrCodes.filter((qr) => qr.id !== id),
        }));
      },

      getQRCode: (id) => {
        return get().qrCodes.find((qr) => qr.id === id);
      },
    }),
    {
      name: "tangaflow-qrcodes",
    }
  )
);
