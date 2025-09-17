import { create } from "zustand";

interface EasterEggState {
  rotation: number;
  setRotation: (rotation: number) => void;
  resetRotation: () => void;
}

export const useEasterEggStore = create<EasterEggState>((set) => ({
  rotation: 0,
  setRotation: (rotation: number) => {
    set({ rotation });
  },
  resetRotation: () => {
    set({ rotation: 0 });
  },
}));
