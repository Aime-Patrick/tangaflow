"use client";

import { usePresentationStore } from "@/stores/presentationStore";
import { toast } from "sonner";
import type { UpdatePresentationInput } from "../types";

export function useUpdatePresentation() {
  const updatePresentation = usePresentationStore((state) => state.updatePresentation);

  return {
    mutateAsync: async ({ id, data }: { id: string; data: UpdatePresentationInput }) => {
      try {
        updatePresentation(id, data);
        toast.success("Presentation updated successfully");
      } catch (error) {
        toast.error("Update failed. Please try again.");
        throw error;
      }
    },
    isPending: false,
  };
}
