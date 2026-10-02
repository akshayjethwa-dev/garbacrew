import { useMemo } from "react";
import { computeProfileScore, getProfileTips } from "../services/userService";
import { GarbaCrewUser } from "../types/user";

export function useProfileScore(user: GarbaCrewUser | null) {
  const score = useMemo(() => {
    if (!user) return 0;
    return computeProfileScore({
      photoUrl: user.photoUrl,
      name: user.name,
      age: user.age,
      gender: user.gender,
      city: user.city,
      languages: user.languages,
      activities: user.activities,
      danceSkill: user.danceSkill,
      vibeScore: user.vibeScore,
      bio: user.bio,
      favoriteActivitySong: user.favoriteActivitySong,
      postActivityRitual: user.postActivityRitual,
    });
  }, [user]);

  const tips = useMemo(() => getProfileTips(score), [score]);

  return { score, tips };
}