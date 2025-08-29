/**
 * Comprehensive exercise video mapping for warm-up and cool-down exercises
 * This ensures all videos work correctly for beta deployment
 */

export interface ExerciseVideoData {
  name: string;
  videoUrl: string;
  id?: string;
}

export const exerciseVideoDatabase: Record<string, ExerciseVideoData> = {
  // === WARM-UP EXERCISES ===
  'banded_face_pull': {
    name: 'Banded Face Pulls',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/firefighter-wellness-app.firebasestorage.app/o/banded-face-pulls.mp4?alt=media&token=88322496-bed1-41cd-9ae7-616bb28dc3ee',
    id: '23bd9b6584994f83b8b0e37a1bec9ba0',
  },
  'wall_slide': {
    name: 'Wall Slide',
    videoUrl: 'https://www.youtube.com/watch?v=d6V2Exzb324',
  },
  'arm_circle_pvc_pass': {
    name: 'Arm Circles / PVC Pass',
    videoUrl: 'https://www.youtube.com/watch?v=qvqLMgOhFFE',
  },
  'arm_circles': {
    name: 'Arm Circles',
    videoUrl: 'https://www.youtube.com/watch?v=qvqLMgOhFFE',
  },
  'glute_bridge': {
    name: 'Glute Bridge',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/firefighter-wellness-app.firebasestorage.app/o/glute-bridge.mp4?alt=media&token=0a046f95-2ce5-47a7-8bd1-0d18121429c7',
    id: 'd68572790c034f40afbd39433926bc96',
  },
  'worlds_greatest_stretch': {
    name: "World's Greatest Stretch",
    videoUrl: 'https://www.youtube.com/watch?v=pO3KPQ5fzJ0',
    id: '6a17372890d54d949fe5779a88bb328a',
  },
  'banded_lateral_walk': {
    name: 'Banded Lateral Walk',
    videoUrl: 'https://www.youtube.com/watch?v=6LLlhCZLohI',
  },
  'scap_pushup': {
    name: 'Scapular Push-ups',
    videoUrl: 'https://www.youtube.com/watch?v=akgQbxrhOc',
  },
  'banded_external_rotation': {
    name: 'Banded External Rotation',
    videoUrl: 'https://www.youtube.com/watch?v=Ry9CfjBaQRo',
  },
  'arm_swing_cross': {
    name: 'Arm Swing Cross Body',
    videoUrl: 'https://www.youtube.com/watch?v=B5jZQHvDbOQ',
  },
  'shoulder_rolls': {
    name: 'Shoulder Rolls',
    videoUrl: 'https://www.youtube.com/watch?v=2_e4I-brfqs',
  },
  'leg_swings_front_back': {
    name: 'Leg Swings Front to Back',
    videoUrl: 'https://www.youtube.com/watch?v=8EKlJhVzGgI',
  },
  'leg_swings_side': {
    name: 'Leg Swings Side to Side',
    videoUrl: 'https://www.youtube.com/watch?v=JNNx3BqGb90',
  },
  'hip_circles': {
    name: 'Hip Circles',
    videoUrl: 'https://www.youtube.com/watch?v=YQmpO9VT2X4',
  },
  'bodyweight_squat': {
    name: 'Bodyweight Squat',
    videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ',
  },
  'walking_lunge_unweighted': {
    name: 'Walking Lunge (Unweighted)',
    videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs',
  },
  'walking_high_knees': {
    name: 'Walking High Knees',
    videoUrl: 'https://www.youtube.com/watch?v=8ophYxQ_HRE',
  },

  // === COOL-DOWN EXERCISES ===
  'band_shoulder_stretch': {
    name: 'Band Shoulder Stretch',
    videoUrl: 'https://www.youtube.com/watch?v=HSoHeSjvIdY',
  },
  'wall_pec_stretch': {
    name: 'Wall Pec Stretch',
    videoUrl: 'https://www.youtube.com/watch?v=dOJy_qGNqWg',
  },
  'incline_walk': {
    name: 'Incline Walk',
    videoUrl: 'https://www.youtube.com/watch?v=mrpzaCJGMQs',
  },
  'hip_flexor_stretch': {
    name: 'Hip Flexor Stretch',
    videoUrl: 'https://www.youtube.com/watch?v=UGEpQ1BRx-4',
  },
  'hamstring_stretch_floor': {
    name: 'Hamstring Stretch (Floor)',
    videoUrl: 'https://www.youtube.com/watch?v=5f7bJg98TgI',
  },
  'box_breathing': {
    name: 'Box Breathing',
    videoUrl: 'https://www.youtube.com/watch?v=tEmt1Znux58',
  },
  'walk_cooldown': {
    name: 'Walking Cooldown',
    videoUrl: 'https://www.youtube.com/watch?v=mrpzaCJGMQs',
  },
  'flow_cooldown_stretch': {
    name: 'Flow Cooldown Stretch',
    videoUrl: 'https://www.youtube.com/watch?v=EKckKcZEK1E',
  },

  // === MAIN EXERCISES (Common ones that might need mapping) ===
  'barbell_bench_press': {
    name: 'Barbell Bench Press',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/firefighter-wellness-app.firebasestorage.app/o/barbell-bench-press.mp4?alt=media&token=261385db-bc65-4710-b5b3-0c428444074a',
  },
  'chin_up_weighted': {
    name: 'Weighted Chin-ups',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/firefighter-wellness-app.firebasestorage.app/o/chin-up.mp4?alt=media&token=0d08e1ca-ba1d-49af-ba7a-00af99cccd7e',
  },
  'barbell_ohp': {
    name: 'Barbell Overhead Press',
    videoUrl: 'https://www.youtube.com/watch?v=cGnhixvC8uA',
  },
  'barbell_back_squat': {
    name: 'Barbell Back Squat',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/firefighter-wellness-app.firebasestorage.app/o/barbell-squat.mp4?alt=media&token=41ffe1f6-8805-44ea-9563-aa2297746552',
  },
};

export function getExerciseVideoData(exerciseId: string): ExerciseVideoData | null {
  return exerciseVideoDatabase[exerciseId] || null;
}
