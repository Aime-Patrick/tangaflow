import { create } from "zustand";

export type ActiveModule = "presentations" | "qr";
export type Theme = "light" | "dark";

interface UIState {
  sidebarExpanded: boolean;
  activeModule: ActiveModule;
  activeSheet: string | null;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setModule: (module: ActiveModule) => void;
  openSheet: (id: string) => void;
  closeSheet: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarExpanded: false,
  activeModule: "presentations",
  activeSheet: null,
  theme: "light",

  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setModule: (module) => set({ activeModule: module }),
  openSheet: (id) => set({ activeSheet: id }),
  closeSheet: () => set({ activeSheet: null }),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tangaflow-theme", theme);
    }
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("tangaflow-theme", next);
      }
      return { theme: next };
    }),
}));
