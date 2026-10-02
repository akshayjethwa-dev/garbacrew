import { create } from "zustand";
import { ProfileSetupData } from "../types/user";

interface ProfileStore {
  currentStep: number;
  data: ProfileSetupData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<ProfileSetupData>) => void;
  reset: () => void;
}

const initialData: ProfileSetupData = {
  photoUri: null,
  name: "",
  age: null,
  gender: null,
  city: "",
  area: "",
  latitude: null,
  longitude: null,
  languages: [],
  activities: [],
  danceSkill: null,
  preferredStyles: [],
  yearsAttendingNavratri: null,
  groupSizePreference: null,
  lookingFor: null,
  vibeScore: 5,
  favoriteActivitySong: "",
  postActivityRitual: "",
  bio: "",
};

export const useProfileStore = create<ProfileStore>((set) => ({
  currentStep: 0,
  data: { ...initialData },
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    })),
  updateData: (partial) =>
    set((state) => ({ data: { ...state.data, ...partial } })),
  reset: () => set({ currentStep: 0, data: { ...initialData } }),
}));

export const TOTAL_STEPS = 9;