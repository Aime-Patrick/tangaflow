const STORAGE_PREFIX = "tangaflow_pptx_";
const INDEX_KEY = "tangaflow_pptx_index";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface PPTXMeta {
  fileName: string;
  size: number;
  savedAt: string;
  cloudUrl?: string;
}

function getIndex(): PPTXMeta[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || "[]");
  } catch {
    return [];
  }
}

function setIndex(index: PPTXMeta[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function savePPTX(fileName: string, arrayBuffer: ArrayBuffer): void {
  if (typeof window === "undefined") return;
  const base64 = arrayBufferToBase64(arrayBuffer);
  localStorage.setItem(STORAGE_PREFIX + fileName, base64);

  const index = getIndex().filter((e) => e.fileName !== fileName);
  index.push({ fileName, size: arrayBuffer.byteLength, savedAt: new Date().toISOString() });
  setIndex(index);
}

export function savePPTXCloud(fileName: string, size: number, cloudUrl: string): void {
  if (typeof window === "undefined") return;
  const index = getIndex().filter((e) => e.fileName !== fileName);
  index.push({ fileName, size, savedAt: new Date().toISOString(), cloudUrl });
  setIndex(index);
}

export function loadPPTX(fileName: string): ArrayBuffer | null {
  if (typeof window === "undefined") return null;
  const base64 = localStorage.getItem(STORAGE_PREFIX + fileName);
  if (!base64) return null;
  return base64ToArrayBuffer(base64);
}

export async function loadPPTXFromCloud(cloudUrl: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(cloudUrl);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export function listPPTX(): PPTXMeta[] {
  return getIndex();
}

export function deletePPTX(fileName: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_PREFIX + fileName);
  setIndex(getIndex().filter((e) => e.fileName !== fileName));
}

export function getPPTXSize(fileName: string): number {
  if (typeof window === "undefined") return 0;
  const base64 = localStorage.getItem(STORAGE_PREFIX + fileName);
  if (!base64) return 0;
  return Math.round((base64.length * 3) / 4);
}
