import type { PresentationFilters } from "./types";

export const presentationKeys = {
  all: ["presentations"] as const,
  lists: () => [...presentationKeys.all, "list"] as const,
  list: (filters: PresentationFilters) =>
    [...presentationKeys.lists(), filters] as const,
  details: () => [...presentationKeys.all, "detail"] as const,
  detail: (id: string) => [...presentationKeys.details(), id] as const,
  count: () => [...presentationKeys.all, "count"] as const,
};
