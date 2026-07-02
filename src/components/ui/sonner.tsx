"use client";

import { AlertCircle, Check, Info, Loader2 } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useUIStore } from "@/stores/uiStore";

export function Toaster({ ...props }: ToasterProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      closeButton
      icons={{
        success: <Check className="h-4 w-4 text-text-primary" strokeWidth={2} />,
        error: <AlertCircle className="h-4 w-4 text-text-primary" strokeWidth={2} />,
        info: <Info className="h-4 w-4 text-text-primary" strokeWidth={2} />,
        warning: <AlertCircle className="h-4 w-4 text-text-primary" strokeWidth={2} />,
        loading: <Loader2 className="h-4 w-4 animate-spin text-text-muted" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-md border border-border-subtle bg-bg-elevated text-text-primary shadow-md",
          title: "text-sm font-medium text-text-primary",
          description: "text-sm text-text-secondary",
          actionButton:
            "rounded-md bg-text-primary text-bg-base text-xs font-medium",
          cancelButton:
            "rounded-md border border-border-subtle bg-bg-base text-text-primary text-xs font-medium",
          closeButton:
            "rounded-md border border-border-subtle bg-bg-base text-text-muted hover:text-text-primary",
          success: "border-border-subtle",
          error: "border-border-strong",
          warning: "border-border-subtle",
          info: "border-border-subtle",
        },
      }}
      {...props}
    />
  );
}
