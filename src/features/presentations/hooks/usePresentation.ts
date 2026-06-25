"use client";

import { usePresentationStore } from "@/stores/presentationStore";

export function usePresentation(id: string) {
  const getPresentation = usePresentationStore((state) => state.getPresentation);
  const presentation = getPresentation(id);

  return {
    data: presentation,
    isLoading: false,
    isError: false,
  };
}
