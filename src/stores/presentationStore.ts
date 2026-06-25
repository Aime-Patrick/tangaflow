import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Presentation, CreatePresentationInput } from "@/types";

// Generate unique ID
function generateId(): string {
  return `pres_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface PresentationState {
  presentations: Presentation[];
  addPresentation: (input: CreatePresentationInput) => Presentation;
  updatePresentation: (id: string, data: Partial<Presentation>) => void;
  deletePresentation: (id: string) => void;
  getPresentation: (id: string) => Presentation | undefined;
}

export const usePresentationStore = create<PresentationState>()(
  persist(
    (set, get) => ({
      presentations: [],

      addPresentation: (input) => {
        const newPresentation: Presentation = {
          id: generateId(),
          title: input.title,
          description: input.description,
          category: input.category,
          visibility: input.visibility ?? "PUBLIC",
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          fileSize: input.fileSize,
          pageCount: input.pageCount,
          thumbnailUrl: input.thumbnailUrl,
          campaignId: input.campaignId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          presentations: [newPresentation, ...state.presentations],
        }));

        return newPresentation;
      },

      updatePresentation: (id, data) => {
        set((state) => ({
          presentations: state.presentations.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePresentation: (id) => {
        set((state) => ({
          presentations: state.presentations.filter((p) => p.id !== id),
        }));
      },

      getPresentation: (id) => {
        return get().presentations.find((p) => p.id === id);
      },
    }),
    {
      name: "tangaflow-presentations",
    }
  )
);
