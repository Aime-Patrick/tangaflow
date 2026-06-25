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

interface PPTXMeta {
  fileName: string;
  size: number;
  savedAt: string;
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
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function savePPTX(fileName: string, arrayBuffer: ArrayBuffer): void {
  const base64 = arrayBufferToBase64(arrayBuffer);
  localStorage.setItem(STORAGE_PREFIX + fileName, base64);

  const index = getIndex().filter((e) => e.fileName !== fileName);
  index.push({ fileName, size: arrayBuffer.byteLength, savedAt: new Date().toISOString() });
  setIndex(index);
}

export function loadPPTX(fileName: string): ArrayBuffer | null {
  const base64 = localStorage.getItem(STORAGE_PREFIX + fileName);
  if (!base64) return null;
  return base64ToArrayBuffer(base64);
}

export function listPPTX(): PPTXMeta[] {
  return getIndex();
}

export function deletePPTX(fileName: string): void {
  localStorage.removeItem(STORAGE_PREFIX + fileName);
  setIndex(getIndex().filter((e) => e.fileName !== fileName));
}

export function getPPTXSize(fileName: string): number {
  const base64 = localStorage.getItem(STORAGE_PREFIX + fileName);
  if (!base64) return 0;
  return Math.round((base64.length * 3) / 4);
}
