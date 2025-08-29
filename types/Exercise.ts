export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category?: string;
  focusArea?: string;
  equipment: string;
  coachingNotes?: string;
  swapOptions?: string[];
  tags: string[];
  goalTags: string[];
  videoUrl?: string;
  thumbnailUri?: string;
  level: string;
  sets?: number;
  reps?: number;
  isTimed?: boolean;
  timePerSet?: number;
  createdBy?: string;
  lastUpdated?: string;
}

export interface ExerciseBlock {
  id: string;
  sets: number;
  repsOrDuration: string;
  rpe: number;
  tags?: string[];
  replacements?: string[];
}

export interface ProgramDay {
  week: number;
  day: number;
  title: string;
  priority: number;
  type: 'training' | 'recovery';
  phase: 'Strength' | 'Hypertrophy' | 'Volume' | 'Overload' | 'Deload';
  warmup: ExerciseBlock[];
  exercises: ExerciseBlock[];
  cooldown: ExerciseBlock[];
}

export interface ProgramTemplate {
  id: string;
  name: string;
  durationWeeks: number;
  description?: string;
  days: ProgramDay[];
}


