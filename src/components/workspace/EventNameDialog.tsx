"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EventNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  isPending?: boolean;
}

export function EventNameDialog({ open, onOpenChange, onSubmit, isPending }: EventNameDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const handleSubmit = () => {
    onSubmit(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>Name Your Event</DialogTitle>
          <DialogDescription>
            Enter a name for your event. You can change this later
            in settings.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="e.g., Sunday Service, School Fundraiser"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          autoFocus
        />

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full rounded-none"
        >
          {isPending ? "Creating..." : "Start Presentation"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
