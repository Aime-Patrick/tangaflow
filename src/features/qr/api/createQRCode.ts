import type { QRCode, CreateQRCodeInput } from "../types";

export async function createQRCode(input: CreateQRCodeInput): Promise<QRCode> {
  const res = await fetch("/api/qr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create QR code");
  return res.json();
}
