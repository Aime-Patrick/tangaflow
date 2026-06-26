"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

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

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-lg font-bold mb-2 text-text-primary">
        <span>{formatCurrency(raisedAmount, currency)}</span>
        <span className="opacity-60">Target: {formatCurrency(targetAmount, currency)}</span>
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
