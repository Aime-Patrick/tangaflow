export async function deleteQRCode(id: string): Promise<void> {
  const res = await fetch(`/api/qr/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete QR code");
}
