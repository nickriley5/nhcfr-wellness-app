// utils/slotRule.ts
import { SlotRule } from './selectExercises';

export const RULES: Record<string, SlotRule> = {
  'FULL_BODY': { includeTags: ['full'], requireCoreSet: false },
  'FULL_BODY_CIRCUIT': { includeTags: ['full','conditioning'], requireCoreSet: false },

  // Strength-biased with movement patterns
  'LEGS': { includeTags: ['lower','legs'], includePatterns: ['squat','hinge'], requireCoreSet: true },
  'UPPER': { includeTags: ['upper'], includePatterns: ['push_v','push_h','pull_v','pull_h'], requireCoreSet: true },
  'PUSH':  { includeTags: ['upper','push'], includePatterns: ['push_v','push_h'], requireCoreSet: true },
  'PULL':  { includeTags: ['upper','pull'], includePatterns: ['pull_v','pull_h'], requireCoreSet: true },

  // Mixed days
  'PUSH_+_CORE': { includeTags: ['push','core','upper'], includePatterns: ['push_v','push_h','core'], requireCoreSet: true },
  'PULL_+_MOBILITY': { includeTags: ['pull','mobility','upper'], includePatterns: ['pull_v','pull_h'], requireCoreSet: true },

  // Conditioning & skills
  'CONDITIONING': { includeTags: ['conditioning'], requireCoreSet: false },
  'METCON': { includeTags: ['conditioning','full'], requireCoreSet: false },
  'STRENGTH': { includeTags: ['strength'], requireCoreSet: true },
  'STRENGTH_CIRCUIT': { includeTags: ['strength','full'], requireCoreSet: true },

  // Recovery / mobility
  'CORE': { includeTags: ['core'], includePatterns: ['core'], requireCoreSet: false },
  'CORE_+_MOBILITY': { includeTags: ['core','mobility'], requireCoreSet: false },
  'MOBILITY': { includeTags: ['mobility','stretch'], requireCoreSet: false },
  'MOBILITY_&_RECOVERY': { includeTags: ['mobility','stretch'], requireCoreSet: false },
  'RECOVERY': { includeTags: ['mobility','stretch'], requireCoreSet: false },

  // Fireground
  'FIREGROUND': { includeTags: ['full','conditioning','strength'], requireCoreSet: false },
};
