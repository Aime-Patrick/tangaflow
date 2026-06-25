"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

interface PresentationEmptyStateProps {
  onCreateNew?: () => void;
}

export function PresentationEmptyState({ onCreateNew }: PresentationEmptyStateProps) {
  return (
    <EmptyState
      icon={<FileText className="h-8 w-8" />}
      title="No presentations yet"
      description="Upload your first presentation to get started sharing with your audience."
      action={
        <Button onClick={onCreateNew} className="bg-accent-primary text-bg-base hover:bg-accent-primary-hover">
          <Upload className="mr-2 h-4 w-4" />
          Upload Presentation
        </Button>
      }
    />
  );
}
