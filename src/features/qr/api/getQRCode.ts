import type { QRCode } from "../types";

export async function getQRCode(id: string): Promise<QRCode> {
  const res = await fetch(`/api/qr/${id}`);
  if (!res.ok) throw new Error("Failed to fetch QR code");
  return res.json();
}
