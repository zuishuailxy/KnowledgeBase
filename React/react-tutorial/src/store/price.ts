import { create } from "zustand";

interface PriceStore {
  price: number;
  setPrice: (newPrice: number) => void;
  getPrice: () => number;
  resetPrice: () => void;
  incrementPrice: () => void;
  decrementPrice: () => void;
}

const usePriceStore = create<PriceStore>((set, get) => ({
  price: 0,
  setPrice: (newPrice: number) => set({ price: newPrice }),
  getPrice: () => get().price,
  resetPrice: () => set(() => ({ price: 0 })),
  incrementPrice: () =>
    set((state) => ({ price: state.price + 1 })),
  decrementPrice: () =>
    set((state) => ({ price: state.price - 1 })),
}));

export default usePriceStore;
