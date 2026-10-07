import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PartnerFilters, DEFAULT_PARTNER_FILTERS } from "../types/partner";

interface PartnerFiltersStore {
  filters: PartnerFilters;
  setFilters: (partial: Partial<PartnerFilters>) => void;
  resetFilters: () => void;
}

export const usePartnerFiltersStore = create<PartnerFiltersStore>()(
  persist(
    (set) => ({
      filters: { ...DEFAULT_PARTNER_FILTERS },
      setFilters: (partial) =>
        set((s) => ({ filters: { ...s.filters, ...partial } })),
      resetFilters: () => set({ filters: { ...DEFAULT_PARTNER_FILTERS } }),
    }),
    {
      name: "partnerFilters",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);