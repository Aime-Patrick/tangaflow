"use client";

import { usePresentationStore } from "@/stores/presentationStore";
import { toast } from "sonner";
import type { CreatePresentationInput } from "../types";

export function useCreatePresentation() {
  const addPresentation = usePresentationStore((state) => state.addPresentation);

  return {
    mutateAsync: async (input: CreatePresentationInput) => {
      try {
        const result = addPresentation(input);
        toast.success("Presentation uploaded successfully");
        return result;
      } catch (error) {
        toast.error("Upload failed. Please try again.");
        throw error;
      }
    },
    isPending: false,
  };
}
