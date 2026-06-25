"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
];

const PAYMENT_METHODS = [
  { id: "polar", name: "Polar", description: "Card payments via Polar" },
  { id: "momo", name: "Mobile Money", description: "M-Pesa, MTN, etc." },
  { id: "bank", name: "Bank Transfer", description: "Manual bank transfer" },
];

function ThemeButton({ label, value }: { label: string; value: "light" | "dark" }) {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const isActive = theme === value;

  return (
    <button
      onClick={() => setTheme(value)}
      className={`flex-1 h-8 border text-xs font-semibold transition-colors ${
        isActive
          ? "border-accent-primary bg-accent-primary text-bg-base"
          : "border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong"
      }`}
    >
      {label}
    </button>
  );
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventName: string;
  onEventNameChange: (value: string) => void;
  targetAmount: number;
  onTargetChange: (value: number) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  donationUrl: string;
  qrContent: string;
  onQrContentChange: (value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function SettingsDialog({
  open,
  onOpenChange,
  eventName,
  onEventNameChange,
  targetAmount,
  onTargetChange,
  currency,
  onCurrencyChange,
  paymentMethod,
  onPaymentMethodChange,
  donationUrl,
  qrContent,
  onQrContentChange,
  onSave,
  isSaving,
}: SettingsDialogProps) {
  const isPolar = paymentMethod === "polar";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-bg-base border-border-subtle w-80">
        <SheetHeader>
          <SheetTitle className="text-sm font-bold text-text-primary">
            Settings
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-4 overflow-y-auto flex-1">
          {/* Theme */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Theme
            </label>
            <div className="flex gap-2">
              <ThemeButton label="Light" value="light" />
              <ThemeButton label="Dark" value="dark" />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border-subtle" />

          {/* Event Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => onEventNameChange(e.target.value)}
              placeholder="e.g., Sunday Service"
              className="w-full h-8  border border-border-default bg-bg-elevated px-2.5 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border-subtle" />

          {/* Campaign */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Currency
            </label>
            <Select value={currency} onValueChange={(v) => v && onCurrencyChange(v)}>
              <SelectTrigger className="w-full h-8 bg-bg-elevated border-border-default text-text-primary text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="text-xs">{c.symbol}</span>
                    <span className="text-xs">{c.code}</span>
                    <span className="text-[10px] text-text-muted">{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Target Amount (cents)
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => onTargetChange(Number(e.target.value))}
              className="w-full h-8  border border-border-default bg-bg-elevated px-2.5 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/50"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border-subtle" />

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Payment Method
            </label>
            <Select value={paymentMethod} onValueChange={(v) => v && onPaymentMethodChange(v)}>
              <SelectTrigger className="w-full h-8 bg-bg-elevated border-border-default text-text-primary text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="text-xs font-semibold">{m.name}</span>
                    <span className="text-[10px] text-text-muted">{m.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Donation URL / QR Content */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              {isPolar ? "Donation URL (QR Code)" : "QR Content"}
            </label>
            {isPolar ? (
              <input
                type="text"
                value={donationUrl}
                readOnly
                className="w-full h-8  border border-border-default bg-bg-muted px-2.5 text-xs font-mono text-text-muted cursor-not-allowed"
              />
            ) : (
              <>
                <input
                  type="text"
                  value={qrContent}
                  onChange={(e) => onQrContentChange(e.target.value)}
                  placeholder={
                    paymentMethod === "momo"
                      ? "*123*1*1*0700000000#"
                      : "Bank: ABC Bank, Acc: 12345678"
                  }
                  className="w-full h-8  border border-border-default bg-bg-elevated px-2.5 text-xs font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/50"
                />
                <p className="text-[10px] text-text-muted">
                  {paymentMethod === "momo"
                    ? "Enter USSD code or phone number"
                    : "Enter bank details or payment info"}
                </p>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border-subtle" />

          {/* Save Button */}
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
