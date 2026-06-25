"use client";

import { usePresentationStore } from "@/stores/presentationStore";
import type { PresentationFilters } from "../types";

export function usePresentations(filters?: PresentationFilters) {
  const presentations = usePresentationStore((state) => state.presentations);

  // Filter presentations based on filters
  let filtered = presentations;

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  if (filters?.visibility) {
    filtered = filtered.filter((p) => p.visibility === filters.visibility);
  }

  return {
    data: filtered,
    isLoading: false,
    isError: false,
  };
}
