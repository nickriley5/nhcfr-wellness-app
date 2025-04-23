// src/data/exercises.ts
import raw from './exercise_library_with_goalTags.json';

export interface Exercise {
  id:           string;
  name:         string;
  category:     string;
  focusArea:    string;
  equipment:    string;
  coachingNotes:string;
  swapOptions:  string[];
  tags:         string[];
  goalTags:     string[];
  videoUrl:     string;
  thumbnailUri: string;
  level:        string;
}

const DEFAULT_THUMB = 'https://via.placeholder.com/100';
const DEFAULT_VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4';

// tell TS that raw is an array of “any”
const rawExercises = raw as any[];

export const exercises: Exercise[] = rawExercises.map((item: any): Exercise => {
  const id = item.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return {
    id,
    name:          item.name,
    category:      item.priorityCategory || item.category || item.focusArea,
    focusArea:     item.focusArea,
    equipment:     item.equipment,
    coachingNotes: item.coachingNotes,
    swapOptions:   item.swapOptions,
    tags:          item.tags,
    goalTags:      item.goalTags,
    videoUrl:      item.videoUrl || DEFAULT_VIDEO,
    thumbnailUri:  DEFAULT_THUMB,
    level:         item.level,
  };
});
