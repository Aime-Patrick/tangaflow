"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useUIStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";

interface QRCodeDisplayProps {
  content: string;
  raisedAmount?: number;
  currency?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  KRW: "₩",
  INR: "₹",
  BRL: "R$",
  RWF: "FRw",
  NGN: "₦",
  ZAR: "R",
  KES: "KSh",
  GHS: "GH₵",
};

export function QRCodeDisplay({
  content,
  raisedAmount = 0,
  currency = "USD",
}: QRCodeDisplayProps) {
  const theme = useUIStore((s) => s.theme);
  const bgColor = theme === "dark" ? "#000000" : "#FFFFFF";
  const fgColor = theme === "dark" ? "#DFDFDF" : "#000000";
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center px-5 min-h-0">
        <div
          className="flex items-center justify-center p-4 w-full max-w-70 aspect-square"
          style={{ backgroundColor: bgColor }}
        >
          <QRCodeSVG
            value={content || "https://tangaflow.app"}
            size={280}
            fgColor={fgColor}
            bgColor={bgColor}
            includeMargin={true}
            level="Q"
            className="w-full h-full"
          />
        </div>
        <div className="flex items-center justify-between px-5 pt-2">
          <h3 className="text-sm text-text-primary">
            {formatCurrency(raisedAmount, currency)}
          </h3>
        </div>
      </div>
    </div>
  );
}
