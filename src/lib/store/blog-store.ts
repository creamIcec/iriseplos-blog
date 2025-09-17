import { create } from "zustand";

interface BlogState {
  title: string;
  setTitle: (title: string) => void;
  clearTitle: () => void;
}

export const useBlogStore = create<BlogState>((set) => ({
  title: "",
  setTitle: (title: string) => {
    set({ title });
  },
  clearTitle: () => {
    set({ title: "" });
  },
}));
