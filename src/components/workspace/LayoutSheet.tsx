"use client";

import React from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface LayoutSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  side?: "left" | "right";
}

export function LayoutSheet({
  open,
  onClose,
  title = "Menu",
  children,
  width = "w-[85vw] max-w-4xl",
  side = "right",
}: LayoutSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side={side}
        showCloseButton={false}
        className={`${width} !max-w-none p-0`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <SheetHeader className="flex-1">
              <SheetTitle className="text-lg font-medium text-text-primary">
                {title}
              </SheetTitle>
            </SheetHeader>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
