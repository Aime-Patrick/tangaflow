"use client";

import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import type { QRSize } from "../types";
import { useUIStore } from "@/stores/uiStore";

interface QRCodePreviewProps {
  content: string;
  size?: QRSize;
  foreground?: string;
  background?: string;
  includeMargin?: boolean;
  className?: string;
}

const sizeMap: Record<QRSize, number> = {
  SMALL: 128,
  MEDIUM: 200,
  LARGE: 280,
};

export function QRCodePreview({
  content,
  size = "MEDIUM",
  includeMargin = true,
  className,
}: QRCodePreviewProps) {
  const theme = useUIStore((s) => s.theme);
  const foreground = theme === "dark" ? "#FFFFFF" : "#1A1A1A";
  const background = theme === "dark" ? "#1A1A1A" : "#FFFFFF";
  const pxSize = sizeMap[size];

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-bg-elevated p-6 ${className}`}
    >
      <QRCodeSVG
        value={content}
        size={pxSize}
        fgColor={foreground}
        bgColor={background}
        includeMargin={includeMargin}
        level="H"
      />
    </div>
  );
}

// Export canvas version for download
export function QRCodeCanvasPreview({
  content,
  size = "MEDIUM",
  includeMargin = true,
  ref,
}: QRCodePreviewProps & { ref?: React.Ref<HTMLCanvasElement> }) {
  const theme = useUIStore((s) => s.theme);
  const foreground = theme === "dark" ? "#FFFFFF" : "#1A1A1A";
  const background = theme === "dark" ? "#1A1A1A" : "#FFFFFF";
  const pxSize = sizeMap[size];

  return (
    <QRCodeCanvas
      ref={ref}
      value={content}
      size={pxSize}
      fgColor={foreground}
      bgColor={background}
      includeMargin={includeMargin}
      level="H"
      className="hidden"
    />
  );
}
