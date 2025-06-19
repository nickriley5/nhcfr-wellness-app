// utils/types.ts

/**
 * A full exercise entry from your library.
 * Used for lookups (name, videoUrl, equipment, etc).
 */
export interface Exercise {
  id: string;                // matches the ExerciseBlock.id
  name: string;              // user-friendly display name
  description?: string;      // optional longer description
  videoUrl?: string;         // optional tutorial/demo link
  equipment?: string[];      // optional equipment tags
  muscleGroup?: string;      // optional grouping tag
  tags?: string[];           // any other tags you use
}

/**
 * A block in your program (warmup/exercise/cooldown).
 * Contains only the minimal scheduling info.
 */
export interface ExerciseBlock {
  id: string;                // matches an Exercise.id
  sets: number;
  repsOrDuration: string;    // e.g. "8-10 reps" or "1 min"
  rpe: number;               // 1–10 RPE scale
  tags?: string[];           // e.g. ["push","upper"] or whatever
  replacements?: string[];   // alternative Exercise.id values
}

/**
 * A single day in an 8-week (or any length) program.
 * Has separate warmup/main/cooldown lists.
 */
export interface ProgramDay {
  week: number;
  day: number;
  title: string;
  priority: number;
  type: 'training' | 'recovery';
  phase: 'Strength' | 'Hypertrophy' | 'Volume' | 'Deload' | 'Peak';
  warmup: ExerciseBlock[];
  exercises: ExerciseBlock[];
  cooldown: ExerciseBlock[];
}

/**
 * The shape of a program template you ship in your bundle.
 */
export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  daysPerWeek: number;
  days: ProgramDay[];
}
