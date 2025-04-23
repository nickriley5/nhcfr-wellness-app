import { exercises } from '../data/exercises';

interface UserProfile {
  goal: string;
  equipment: string[];
}

export interface Exercise {
    id: string;
    name: string;
    category: string;
    focusArea: string;
    equipment: string;
    coachingNotes: string;
    swapOptions: string[];
    tags: string[];
    videoUrl?: string;
    thumbnailUri?: string;
    level: string;
    createdBy: string;
    lastUpdated: string;
    goalTags: string[];
  }
  

export const generateDailyWorkout = async (
  userProfile: UserProfile
): Promise<Exercise[]> => {
  const userEquip = userProfile.equipment.map(e => e.toLowerCase());
  const goal = userProfile.goal.toLowerCase();

  const filtered = exercises.filter(ex =>
    userEquip.some(e => ex.equipment.toLowerCase().includes(e)) &&
    ex.goalTags.map(t => t.toLowerCase()).includes(goal)
  );

  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6); // Return up to 6 exercises
};
