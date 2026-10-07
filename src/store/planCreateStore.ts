import { create } from "zustand";
import { PlanDraft, EMPTY_PLAN_DRAFT } from "../types/plan";

interface PlanCreateStore {
  currentStep: number;
  draft: PlanDraft;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateDraft: (partial: Partial<PlanDraft>) => void;
  reset: () => void;
}

export const TOTAL_PLAN_STEPS = 8;

export const usePlanCreateStore = create<PlanCreateStore>((set) => ({
  currentStep: 0,
  draft: { ...EMPTY_PLAN_DRAFT },
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
  updateDraft: (partial) =>
    set((s) => ({ draft: { ...s.draft, ...partial } })),
  reset: () => set({ currentStep: 0, draft: { ...EMPTY_PLAN_DRAFT } }),
}));