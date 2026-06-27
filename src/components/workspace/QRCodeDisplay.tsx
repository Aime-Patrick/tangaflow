"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ZeroCode } from "@pryro/00code-react";
import { useUIStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";

type CodeType = "qr" | "zerocode";

interface QRCodeDisplayProps {
  content: string;
  raisedAmount?: number;
  currency?: string;
  codeType?: CodeType;
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
  codeType = "qr",
}: QRCodeDisplayProps) {
  const theme = useUIStore((s) => s.theme);
  const bgColor = theme === "dark" ? "#000000" : "#FFFFFF";
  const fgColor = theme === "dark" ? "#DFDFDF" : "#000000";

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center px-5 min-h-0">
        <div
          className="flex items-center justify-center p-4 w-full max-w-70 aspect-square"
          style={{ backgroundColor: bgColor }}
        >
          {codeType === "qr" ? (
            <QRCodeSVG
              value={content || "https://tangaflow.app"}
              size={280}
              fgColor={fgColor}
              bgColor={bgColor}
              includeMargin={true}
              level="Q"
              className="w-full h-full"
            />
          ) : (
            <ZeroCode
              value={content || "https://tangaflow.app"}
              type="circular"
              size={280}
            />
          )}
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
