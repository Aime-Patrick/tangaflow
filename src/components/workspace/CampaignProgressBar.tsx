"use client";

import React from "react";

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

interface CampaignProgressBarProps {
  raisedAmount?: number;
  targetAmount?: number;
  currency?: string;
}

export function CampaignProgressBar({
  raisedAmount = 7540,
  targetAmount = 10000,
  currency = "USD",
}: CampaignProgressBarProps) {
  const percentage = Math.min(100, Math.round((raisedAmount / targetAmount) * 100));
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-lg font-bold mb-2 text-text-primary">
        <span>{symbol}{raisedAmount.toLocaleString()}</span>
        <span className="opacity-60">Target: {symbol}{targetAmount.toLocaleString()}</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-border-subtle overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-primary transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
