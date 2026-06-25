"use client";

import { usePresentationStore } from "@/stores/presentationStore";
import { toast } from "sonner";

export function useDeletePresentation() {
  const deletePresentation = usePresentationStore((state) => state.deletePresentation);

  return {
    mutateAsync: async (id: string) => {
      try {
        deletePresentation(id);
        toast.success("Presentation deleted successfully");
      } catch (error) {
        toast.error("Delete failed. Please try again.");
        throw error;
      }
    },
    isPending: false,
  };
}
