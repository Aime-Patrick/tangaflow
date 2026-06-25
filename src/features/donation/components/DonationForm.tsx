"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCheckout } from "../hooks/useCreateCheckout";

interface DonationFormProps {
  campaignId: string;
  currency: string;
  raisedAmount: number;
  targetAmount: number;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

function formatCurrency(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DonationForm({
  campaignId,
  currency,
  raisedAmount,
  targetAmount,
}: DonationFormProps) {
  const [amount, setAmount] = useState<number>(1000);
  const { mutate: createCheckout, isPending } = useCreateCheckout();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount >= 100) {
      createCheckout({ campaignId, amountInCents: amount });
    }
  };

  const percentage = Math.min((raisedAmount / targetAmount) * 100, 100);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="w-full text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Support This Cause
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(raisedAmount, currency)} raised of{" "}
          {formatCurrency(targetAmount, currency)} goal
        </p>
      </div>

      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={amount === preset ? "default" : "outline"}
              onClick={() => setAmount(preset)}
            >
              {formatCurrency(preset, currency)}
            </Button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            min={1}
            step={1}
            value={amount / 100}
            onChange={(e) =>
              setAmount(Math.max(100, Math.round(Number(e.target.value) * 100)))
            }
            className="pl-7 text-center text-lg font-medium"
          />
        </div>

        <Button type="submit" size="lg" disabled={isPending || amount < 100}>
          {isPending ? "Processing..." : `Donate ${formatCurrency(amount, currency)}`}
        </Button>
      </form>
    </div>
  );
}
