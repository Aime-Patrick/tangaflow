"use client";

import React, { useState, useEffect, useRef } from "react";
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

  // Animated counting display
  const [displayAmount, setDisplayAmount] = useState(raisedAmount);
  const prevAmountRef = useRef(raisedAmount);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevAmountRef.current;
    const end = raisedAmount;
    prevAmountRef.current = end;

    if (start === end) {
      setDisplayAmount(end);
      return;
    }

    let current = start;

    const animateCount = () => {
      const diff = end - current;
      if (diff === 0) {
        setDisplayAmount(end);
        return;
      }

      let step = 0;
      if (diff > 0) {
        if (diff > 99999) {
          // Very fast for huge gaps
          step = Math.max(100, Math.ceil(diff / 10));
        } else if (diff > 10000) {
          // Fast for moderately large gaps
          step = Math.max(50, Math.ceil(diff / 15));
        } else {
          // Last 5 digits — slow exponential decay
          step = Math.max(1, Math.ceil(diff * 0.025));
        }
        current = Math.min(end, current + step);
      } else {
        const absDiff = Math.abs(diff);
        if (absDiff > 99999) {
          step = Math.max(100, Math.ceil(absDiff / 10));
        } else if (absDiff > 10000) {
          step = Math.max(50, Math.ceil(absDiff / 15));
        } else {
          step = Math.max(1, Math.ceil(absDiff * 0.025));
        }
        current = Math.max(end, current - step);
      }

      setDisplayAmount(current);
      animationRef.current = requestAnimationFrame(animateCount);
    };

    animationRef.current = requestAnimationFrame(animateCount);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [raisedAmount]);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-lg font-bold mb-2 text-text-primary">
        <span>{formatCurrency(displayAmount, currency)}</span>
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
