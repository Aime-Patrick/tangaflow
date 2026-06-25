"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCheckout } from "../hooks/useCreateCheckout";

interface DonationFormProps {
  campaignId: string;
  currency: string;
}

function formatCurrency(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
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
  return symbols[currency] || "$";
}

export function DonationForm({ campaignId, currency }: DonationFormProps) {
  const [amount, setAmount] = useState<number>(1000);
  const { mutate: createCheckout, isPending } = useCreateCheckout();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount >= 100) {
      createCheckout({ campaignId, amountInCents: amount });
    }
  };

  const displayAmount = amount / 100;
  const symbol = getCurrencySymbol(currency);
  const charCount = `${symbol}${displayAmount}`.length;
  const inputWidth = Math.max(120, charCount * 14 + 40);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="w-full text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Support This Cause
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your donation amount
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
        <div className="relative" style={{ width: inputWidth }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-medium">
            {symbol}
          </span>
          <Input
            type="number"
            min={1}
            step={1}
            value={displayAmount}
            onChange={(e) =>
              setAmount(Math.max(100, Math.round(Number(e.target.value) * 100)))
            }
            className="pl-4 text-center text-2xl font-bold h-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <Button type="submit" size="lg" disabled={isPending || amount < 100} className="w-full">
          {isPending ? "Processing..." : `Donate ${formatCurrency(amount, currency)}`}
        </Button>
      </form>
    </div>
  );
}
