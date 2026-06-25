"use client";

import { usePresentations } from "../hooks/usePresentations";
import { PresentationCard } from "./PresentationCard";
import { PresentationEmptyState } from "./PresentationEmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Presentation, PresentationFilters } from "../types";

interface PresentationListProps {
  filters?: PresentationFilters;
  onSelect?: (presentation: Presentation) => void;
  onEdit?: (presentation: Presentation) => void;
  onDelete?: (presentation: Presentation) => void;
  onShare?: (presentation: Presentation) => void;
  onCreateNew?: () => void;
}

export function PresentationList({
  filters,
  onSelect,
  onEdit,
  onDelete,
  onShare,
  onCreateNew,
}: PresentationListProps) {
  const { data: presentations, isLoading, isError } = usePresentations(filters);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-secondary">Failed to load presentations</p>
      </div>
    );
  }

  if (!presentations?.length) {
    return <PresentationEmptyState onCreateNew={onCreateNew} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {presentations.map((presentation) => (
        <PresentationCard
          key={presentation.id}
          presentation={presentation}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
        />
      ))}
    </div>
  );
}
