import { PlanActivity } from "../types/plan";

export interface ActivityMeta {
  value: PlanActivity;
  label: string;
  emoji: string;
  color: string;
}

export const ACTIVITIES: ActivityMeta[] = [
  { value: "cricket", label: "Cricket", emoji: "🏏", color: "#4CAF50" },
  { value: "trek", label: "Trek", emoji: "🥾", color: "#795548" },
  { value: "garba", label: "Garba", emoji: "💃", color: "#E91E63" },
  { value: "movie", label: "Movie", emoji: "🎬", color: "#3F51B5" },
  { value: "food", label: "Food", emoji: "🍽️", color: "#FF9800" },
  { value: "party", label: "Party", emoji: "🎉", color: "#9C27B0" },
  { value: "custom", label: "Custom", emoji: "✨", color: "#607D8B" },
];

export function getActivityMeta(activity: PlanActivity): ActivityMeta {
  return ACTIVITIES.find((a) => a.value === activity) ?? ACTIVITIES[0];
}

export const CAPACITY_OPTIONS = [
  { value: 2, label: "2 people", desc: "1-on-1" },
  { value: 4, label: "4 people", desc: "Small crew" },
  { value: 6, label: "6 people", desc: "Medium crew" },
  { value: 10, label: "10 people", desc: "Big crew" },
  { value: 20, label: "20 people", desc: "Party" },
  { value: 0, label: "Unlimited", desc: "Open to all" },
];

export const DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 360, label: "6 hours" },
  { value: 480, label: "Full day (8h)" },
];

export const CITIES = [
  "Mumbai", "Pune", "Ahmedabad", "Surat", "Vadodara",
  "Rajkot", "Delhi", "Bangalore", "Hyderabad", "Chennai",
];