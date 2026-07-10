export type CardioGoalMode = 'time' | 'distance' | 'both';

export type CardioModality = {
  id: string;
  label: string;
  category: 'steady' | 'hiit';
  icon: string;
  defaultGoalMode: CardioGoalMode;
};

export type HiitTemplate = {
  id: string;
  label: string;
  equipment: string;
  rounds: number;
  workSec: number;
  restSec: number;
  exercises: Array<string | { name: string; notes?: string }>;
};

export const CARDIO_MODALITIES: CardioModality[] = [
  { id: 'run', label: 'Run', category: 'steady', icon: 'walk-outline', defaultGoalMode: 'time' },
  { id: 'row', label: 'Row', category: 'steady', icon: 'boat-outline', defaultGoalMode: 'time' },
  { id: 'assault_bike', label: 'Assault Bike', category: 'steady', icon: 'bicycle-outline', defaultGoalMode: 'time' },
  { id: 'bike', label: 'Bike', category: 'steady', icon: 'bicycle-outline', defaultGoalMode: 'time' },
  { id: 'stair_climber', label: 'Stairs', category: 'steady', icon: 'podium-outline', defaultGoalMode: 'time' },
  { id: 'bodyweight_hiit', label: 'Bodyweight HIIT', category: 'hiit', icon: 'flame-outline', defaultGoalMode: 'time' },
  { id: 'weighted_hiit', label: 'Weighted HIIT', category: 'hiit', icon: 'barbell-outline', defaultGoalMode: 'time' },
  { id: 'machine_hiit', label: 'Machine HIIT', category: 'hiit', icon: 'speedometer-outline', defaultGoalMode: 'time' },
  { id: 'fireground_hiit', label: 'Fireground HIIT', category: 'hiit', icon: 'shield-checkmark-outline', defaultGoalMode: 'time' },
];

export const HIIT_TEMPLATES: HiitTemplate[] = [
  {
    id: 'bodyweight_shift_ready',
    label: 'Bodyweight Shift Ready',
    equipment: 'No equipment',
    rounds: 4,
    workSec: 35,
    restSec: 25,
    exercises: [
      { name: 'Air Squats', notes: 'Smooth reps, full depth' },
      { name: 'Push Up', notes: 'Modify to incline if needed' },
      { name: 'High Knees', notes: 'Fast feet, tall posture' },
      { name: 'Plank Shoulder Tap', notes: 'Control the hips' },
    ],
  },
  {
    id: 'weighted_engine',
    label: 'Weighted Engine',
    equipment: 'Dumbbell or kettlebell',
    rounds: 5,
    workSec: 40,
    restSec: 20,
    exercises: [
      { name: 'Kettlebell Swing', notes: 'Explosive hips' },
      { name: 'Goblet Squat', notes: 'Brace hard' },
      { name: 'Dumbbell Push Press', notes: 'Drive through the legs' },
      { name: 'Farmer Carry', notes: 'Heavy, controlled walk' },
    ],
  },
  {
    id: 'machine_sprint_ladder',
    label: 'Machine Sprint Ladder',
    equipment: 'Rower, bike, or ski erg',
    rounds: 8,
    workSec: 30,
    restSec: 30,
    exercises: [
      { name: 'Machine Sprint', notes: 'Hard but repeatable pace' },
      { name: 'Easy Spin or Paddle', notes: 'Keep moving during rest' },
    ],
  },
  {
    id: 'fireground_capacity',
    label: 'Fireground Capacity',
    equipment: 'Station tools or loaded carry',
    rounds: 4,
    workSec: 45,
    restSec: 30,
    exercises: [
      { name: 'Step Up', notes: 'Controlled drive through each leg' },
      { name: 'Farmer Carry', notes: 'Heavy carry, tall posture' },
      { name: 'Battle Ropes', notes: 'Powerful waves' },
      { name: 'Bear Crawl', notes: 'Short, controlled lane' },
    ],
  },
];

export function getInitialCardioModalityId(type?: string): string {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('row')) return 'row';
  if (normalized.includes('assault')) return 'assault_bike';
  if (normalized.includes('bike') || normalized.includes('cycle')) return 'bike';
  if (normalized.includes('stair')) return 'stair_climber';
  if (normalized.includes('hiit') || normalized.includes('circuit') || normalized.includes('interval')) {
    return 'bodyweight_hiit';
  }
  return 'run';
}

export function getHiitTemplateForModality(modalityId: string): HiitTemplate {
  if (modalityId === 'weighted_hiit') {
    return HIIT_TEMPLATES[1];
  }
  if (modalityId === 'machine_hiit') {
    return HIIT_TEMPLATES[2];
  }
  if (modalityId === 'fireground_hiit') {
    return HIIT_TEMPLATES[3];
  }
  return HIIT_TEMPLATES[0];
}
