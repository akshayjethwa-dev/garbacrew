export interface PartnerVibeMeta {
  value: string;
  label: string;
  emoji: string;
}

export const PARTNER_VIBES: PartnerVibeMeta[] = [
  { value: "traditional", label: "Traditional", emoji: "🪔" },
  { value: "techno", label: "Techno", emoji: "🎧" },
  { value: "bollywood", label: "Bollywood", emoji: "🎬" },
  { value: "chill", label: "Chill", emoji: "🌙" },
  { value: "adventurous", label: "Adventurous", emoji: "🏔️" },
  { value: "creative", label: "Creative", emoji: "🎨" },
];

export function getPartnerVibe(value: string | undefined): PartnerVibeMeta | null {
  if (!value) return null;
  return PARTNER_VIBES.find((v) => v.value === value) ?? null;
}