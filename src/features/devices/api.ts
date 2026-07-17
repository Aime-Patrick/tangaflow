import type { Device, CreateDeviceInput } from "./types";

export async function getDevices(): Promise<Device[]> {
  const res = await fetch("/api/devices");
  if (!res.ok) throw new Error("Failed to fetch devices");
  const data = await res.json();
  return data.devices || [];
}

export async function createDevice(input: CreateDeviceInput): Promise<Device> {
  const res = await fetch("/api/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create device");
  const data = await res.json();
  return data.device;
}

export async function deleteDevice(id: string): Promise<void> {
  const res = await fetch(`/api/devices?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete device");
}
