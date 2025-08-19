import type { ProgramTemplate } from './types';
import { strength_to_hypertrophy_8week } from './programs/strength_to_hypertrophy';
import { firefighter_hybrid_6week } from './programs/firefighter_hybrid_6week';
import { calisthenics_foundation_6week } from './programs/calisthenics_foundation_6week';

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  strength_to_hypertrophy_8week,
  firefighter_hybrid_6week,
  calisthenics_foundation_6week,
];
