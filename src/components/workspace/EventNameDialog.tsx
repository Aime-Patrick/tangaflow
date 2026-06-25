"use client";

import { useState } from "react";
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
  onSubmit: (name: string) => void;
  isPending?: boolean;
}

export function EventNameDialog({ open, onSubmit, isPending }: EventNameDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Dialog open={open}>
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
          disabled={!name.trim() || isPending}
          className="w-full rounded-none"
        >
          {isPending ? "Creating..." : "Start Presentation"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
