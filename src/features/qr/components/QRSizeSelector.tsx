"use client";

import type { QRSize } from "../types";
import { cn } from "@/lib/utils";

interface QRSizeSelectorProps {
  value: QRSize;
  onChange: (size: QRSize) => void;
  className?: string;
}

const sizes: { value: QRSize; label: string; dimensions: string }[] = [
  { value: "SMALL", label: "Small", dimensions: "128px" },
  { value: "MEDIUM", label: "Medium", dimensions: "200px" },
  { value: "LARGE", label: "Large", dimensions: "280px" },
];

export function QRSizeSelector({ value, onChange, className }: QRSizeSelectorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {sizes.map((size) => (
        <button
          key={size.value}
          onClick={() => onChange(size.value)}
          className={cn(
            "flex flex-col items-center rounded-md border px-4 py-3 transition-all",
            value === size.value
              ? "border-accent-primary bg-accent-primary-subtle text-accent-primary"
              : "border-border-default bg-bg-elevated text-text-secondary hover:border-border-strong hover:text-text-primary"
          )}
        >
          <span className="text-sm font-semibold">{size.label}</span>
          <span className="text-xs text-text-muted">{size.dimensions}</span>
        </button>
      ))}
    </div>
  );
}
