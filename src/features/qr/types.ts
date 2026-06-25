// QR Code feature types
// Re-exports from global types for convenience

import type {
  QRCode,
  QRSize,
  CreateQRCodeInput,
} from "@/types";

export type {
  QRCode,
  QRSize,
  CreateQRCodeInput,
};

// Extended types for QR feature
export type QRContentType = "url" | "text" | "wifi" | "vcard" | "email" | "sms";

export interface QRCodeConfig {
  content: string;
  contentType: QRContentType;
  size: QRSize;
  label?: string;
  foreground?: string;
  background?: string;
  includeMargin?: boolean;
}

export interface QRCodePreset {
  id: string;
  name: string;
  description: string;
  contentType: QRContentType;
  icon: string;
}

// Preset templates for quick QR generation
export const QR_PRESETS: QRCodePreset[] = [
  {
    id: "url",
    name: "Website URL",
    description: "Link to any website",
    contentType: "url",
    icon: "Globe",
  },
  {
    id: "text",
    name: "Plain Text",
    description: "Any text message",
    contentType: "text",
    icon: "Type",
  },
  {
    id: "wifi",
    name: "WiFi Network",
    description: "Share WiFi credentials",
    contentType: "wifi",
    icon: "Wifi",
  },
  {
    id: "vcard",
    name: "Contact Card",
    description: "Share contact information",
    contentType: "vcard",
    icon: "User",
  },
  {
    id: "email",
    name: "Email",
    description: "Pre-filled email",
    contentType: "email",
    icon: "Mail",
  },
  {
    id: "sms",
    name: "SMS Message",
    description: "Pre-filled text message",
    contentType: "sms",
    icon: "MessageSquare",
  },
];
