import type { ProgramTemplate } from '../types';



export const strength_to_hypertrophy_8week: ProgramTemplate = {
  id: "strength_to_hypertrophy_8week",
  name: "Strength to Hypertrophy (8-Week)",
  durationWeeks: 8,
  daysPerWeek: 4,
  description: "Periodized program starting with strength-focused blocks and transitioning to hypertrophy, optimized for firefighters.",
  days: [
    {
      week: 1,
      day: 1,
      title: "Upper Body Strength",
      priority: 1,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "banded_face_pull", sets: 2, repsOrDuration: "20 reps", rpe: 4 },
        { id: "wall_slide", sets: 2, repsOrDuration: "10 reps", rpe: 3 },
        { id: "arm_circle_pvc_pass", sets: 1, repsOrDuration: "1-2 min", rpe: 2 }
      ],
      exercises: [
        {
          id: "barbell_bench_press",
          sets: 4,
          repsOrDuration: "5 reps",
          rpe: 8,
          tags: ["chest", "strength"],
          replacements: ["db_bench_press", "pushup", "band_press"]
        },
        {
          id: "chin_up_weighted",
          sets: 4,
          repsOrDuration: "6 reps",
          rpe: 8,
          tags: ["back", "vertical_pull"],
          replacements: ["lat_pulldown", "band_assist_chinup"]
        },
        {
          id: "barbell_ohp",
          sets: 3,
          repsOrDuration: "6 reps",
          rpe: 8,
          tags: ["shoulders", "press"],
          replacements: ["db_ohp", "kb_ohp", "landmine_press"]
        },
        {
          id: "barbell_row",
          sets: 3,
          repsOrDuration: "8 reps",
          rpe: 8,
          tags: ["back", "row", "hinge"],
          replacements: ["db_row", "suspension_row"]
        },
        {
          id: "db_curl",
          sets: 3,
          repsOrDuration: "10 reps",
          rpe: 7,
          tags: ["arms"],
          replacements: ["barbell_curl", "banded_curl"]
        },
        {
          id: "cable_triceps_pressdown",
          sets: 3,
          repsOrDuration: "12 reps",
          rpe: 7,
          tags: ["arms"],
          replacements: ["dips", "db_triceps_kickback"]
        }
      ],
      cooldown: [
        { id: "band_shoulder_stretch", sets: 1, repsOrDuration: "2 min", rpe: 2 },
        { id: "wall_pec_stretch", sets: 1, repsOrDuration: "2 min", rpe: 2 },
        { id: "incline_walk", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    {
      week: 1,
      day: 2,
      title: "Lower Body Strength",
      priority: 2,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "glute_bridge", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "worlds_greatest_stretch", sets: 2, repsOrDuration: "1 min", rpe: 3 },
        { id: "banded_lateral_walk", sets: 2, repsOrDuration: "15 steps each way", rpe: 4 }
      ],
      exercises: [
        {
          id: "barbell_back_squat",
          sets: 4,
          repsOrDuration: "5 reps",
          rpe: 8,
          tags: ["legs", "compound"],
          replacements: ["db_goblet_squat", "trap_bar_squat", "belt_squat"]
        },
        {
          id: "romanian_deadlift",
          sets: 3,
          repsOrDuration: "6 reps",
          rpe: 8,
          tags: ["hamstrings", "posterior_chain"],
          replacements: ["db_rdl", "kb_rdl"]
        },
        {
          id: "barbell_reverse_lunge",
          sets: 3,
          repsOrDuration: "8 reps per leg",
          rpe: 8,
          tags: ["legs", "unilateral"],
          replacements: ["db_reverse_lunge", "goblet_step_up"]
        },
        {
          id: "hamstring_curl_machine",
          sets: 3,
          repsOrDuration: "10 reps",
          rpe: 7,
          tags: ["hamstrings"],
          replacements: ["nordic_curl", "banded_leg_curl"]
        },
        {
          id: "standing_calf_raise",
          sets: 3,
          repsOrDuration: "15 reps",
          rpe: 7,
          tags: ["calves"],
          replacements: ["seated_calf_raise", "single_leg_calf_raise"]
        }
      ],
      cooldown: [
        { id: "hip_flexor_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "hamstring_stretch_floor", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "box_breathing", sets: 1, repsOrDuration: "3 min", rpe: 1 }
      ]
    },
    {
      week: 1,
      day: 3,
      title: "Upper Body Hypertrophy",
      priority: 3,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "scap_pushup", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "banded_external_rotation", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_swing_cross", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ],
      exercises: [
        {
          id: "db_incline_press",
          sets: 4,
          repsOrDuration: "10 reps",
          rpe: 8,
          tags: ["chest", "hypertrophy"],
          replacements: ["barbell_incline_press", "banded_press"]
        },
        {
          id: "lat_pulldown",
          sets: 4,
          repsOrDuration: "10 reps",
          rpe: 8,
          tags: ["back", "vertical_pull"],
          replacements: ["chin_up", "banded_pullup"]
        },
        {
          id: "db_ohp",
          sets: 3,
          repsOrDuration: "10 reps",
          rpe: 8,
          tags: ["shoulders"],
          replacements: ["kb_ohp", "landmine_press"]
        },
        {
          id: "cable_row",
          sets: 3,
          repsOrDuration: "12 reps",
          rpe: 8,
          tags: ["back", "row"],
          replacements: ["db_row", "band_row"]
        },
        {
          id: "incline_db_curl",
          sets: 3,
          repsOrDuration: "12 reps",
          rpe: 7,
          tags: ["arms"],
          replacements: ["barbell_curl", "preacher_curl"]
        },
        {
          id: "overhead_triceps_extension",
          sets: 3,
          repsOrDuration: "12 reps",
          rpe: 7,
          tags: ["arms"],
          replacements: ["triceps_dip", "kickback"]
        }
      ],
      cooldown: [
        { id: "shoulder_circle_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "banded_lats_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "walk_cooldown", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    {
      week: 1,
      day: 4,
      title: "Lower Body Hypertrophy",
      priority: 4,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "bodyweight_squat", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "leg_swings_front_back", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "walking_lunge_unweighted", sets: 1, repsOrDuration: "10 steps", rpe: 3 }
      ],
      exercises: [
        {
          id: "db_goblet_squat",
          sets: 4,
          repsOrDuration: "12 reps",
          rpe: 8,
          tags: ["legs", "hypertrophy"],
          replacements: ["belt_squat", "hack_squat"]
        },
        {
          id: "leg_press",
          sets: 4,
          repsOrDuration: "12 reps",
          rpe: 8,
          tags: ["quads"],
          replacements: ["goblet_split_squat", "bulgarian_split_squat"]
        },
        {
          id: "kb_rdl",
          sets: 3,
          repsOrDuration: "10 reps",
          rpe: 8,
          tags: ["hamstrings"],
          replacements: ["db_rdl", "banded_goodmorning"]
        },
        {
          id: "glute_bridge_weighted",
          sets: 3,
          repsOrDuration: "12 reps",
          rpe: 7,
          tags: ["glutes"],
          replacements: ["hip_thrust", "single_leg_glute_bridge"]
        },
        {
          id: "seated_calf_raise",
          sets: 3,
          repsOrDuration: "15 reps",
          rpe: 7,
          tags: ["calves"],
          replacements: ["standing_calf_raise", "donkey_calf_raise"]
        }
      ],
      cooldown: [
        { id: "pigeon_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "quad_stretch_wall", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "light_cycling", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },

    // --- WEEK 2 (same structure as Week 1) ---
    {
      week: 2,
      day: 1,
      title: "Upper Body Strength",
      priority: 1,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "banded_face_pull", sets: 2, repsOrDuration: "20 reps", rpe: 4 },
        { id: "wall_slide", sets: 2, repsOrDuration: "10 reps", rpe: 3 },
        { id: "arm_circle_pvc_pass", sets: 1, repsOrDuration: "1-2 min", rpe: 2 }
      ],
      exercises: [
        { id: "barbell_bench_press", sets: 4, repsOrDuration: "5 reps", rpe: 8, tags: ["chest", "strength"], replacements: ["db_bench_press", "pushup", "band_press"] },
        { id: "chin_up_weighted", sets: 4, repsOrDuration: "6 reps", rpe: 8, tags: ["back", "vertical_pull"], replacements: ["lat_pulldown", "band_assist_chinup"] },
        { id: "barbell_ohp", sets: 3, repsOrDuration: "6 reps", rpe: 8, tags: ["shoulders", "press"], replacements: ["db_ohp", "kb_ohp", "landmine_press"] },
        { id: "barbell_row", sets: 3, repsOrDuration: "8 reps", rpe: 8, tags: ["back", "row", "hinge"], replacements: ["db_row", "suspension_row"] },
        { id: "db_curl", sets: 3, repsOrDuration: "10 reps", rpe: 7, tags: ["arms"], replacements: ["barbell_curl", "banded_curl"] },
        { id: "cable_triceps_pressdown", sets: 3, repsOrDuration: "12 reps", rpe: 7, tags: ["arms"], replacements: ["dips", "db_triceps_kickback"] }
      ],
      cooldown: [
        { id: "band_shoulder_stretch", sets: 1, repsOrDuration: "2 min", rpe: 2 },
        { id: "wall_pec_stretch", sets: 1, repsOrDuration: "2 min", rpe: 2 },
        { id: "incline_walk", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    {
      week: 2,
      day: 2,
      title: "Lower Body Strength",
      priority: 2,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "glute_bridge", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "worlds_greatest_stretch", sets: 2, repsOrDuration: "1 min", rpe: 3 },
        { id: "banded_lateral_walk", sets: 2, repsOrDuration: "15 steps each way", rpe: 4 }
      ],
      exercises: [
        { id: "barbell_back_squat", sets: 4, repsOrDuration: "5 reps", rpe: 8, tags: ["legs", "compound"], replacements: ["db_goblet_squat", "trap_bar_squat", "belt_squat"] },
        { id: "romanian_deadlift", sets: 3, repsOrDuration: "6 reps", rpe: 8, tags: ["hamstrings", "posterior_chain"], replacements: ["db_rdl", "kb_rdl"] },
        { id: "barbell_reverse_lunge", sets: 3, repsOrDuration: "8 reps per leg", rpe: 8, tags: ["legs", "unilateral"], replacements: ["db_reverse_lunge", "goblet_step_up"] },
        { id: "hamstring_curl_machine", sets: 3, repsOrDuration: "10 reps", rpe: 7, tags: ["hamstrings"], replacements: ["nordic_curl", "banded_leg_curl"] },
        { id: "standing_calf_raise", sets: 3, repsOrDuration: "15 reps", rpe: 7, tags: ["calves"], replacements: ["seated_calf_raise", "single_leg_calf_raise"] }
      ],
      cooldown: [
        { id: "hip_flexor_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "hamstring_stretch_floor", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "box_breathing", sets: 1, repsOrDuration: "3 min", rpe: 1 }
      ]
    },
    {
      week: 2,
      day: 3,
      title: "Upper Body Hypertrophy",
      priority: 3,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "scap_pushup", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "banded_external_rotation", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_swing_cross", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ],
      exercises: [
        { id: "db_incline_press", sets: 4, repsOrDuration: "10 reps", rpe: 8, tags: ["chest", "hypertrophy"], replacements: ["barbell_incline_press", "banded_press"] },
        { id: "lat_pulldown", sets: 4, repsOrDuration: "10 reps", rpe: 8, tags: ["back", "vertical_pull"], replacements: ["chin_up", "banded_pullup"] },
        { id: "db_ohp", sets: 3, repsOrDuration: "10 reps", rpe: 8, tags: ["shoulders"], replacements: ["kb_ohp", "landmine_press"] },
        { id: "cable_row", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["back", "row"], replacements: ["db_row", "band_row"] },
        { id: "incline_db_curl", sets: 3, repsOrDuration: "12 reps", rpe: 7, tags: ["arms"], replacements: ["barbell_curl", "preacher_curl"] },
        { id: "overhead_triceps_extension", sets: 3, repsOrDuration: "12 reps", rpe: 7, tags: ["arms"], replacements: ["triceps_dip", "kickback"] }
      ],
      cooldown: [
        { id: "shoulder_circle_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "banded_lats_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "walk_cooldown", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    {
      week: 2,
      day: 4,
      title: "Lower Body Hypertrophy",
      priority: 4,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "bodyweight_squat", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "leg_swings_front_back", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "walking_lunge_unweighted", sets: 1, repsOrDuration: "10 steps", rpe: 3 }
      ],
      exercises: [
        { id: "db_goblet_squat", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["legs", "hypertrophy"], replacements: ["belt_squat", "hack_squat"] },
        { id: "leg_press", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["quads"], replacements: ["goblet_split_squat", "bulgarian_split_squat"] },
        { id: "kb_rdl", sets: 3, repsOrDuration: "10 reps", rpe: 8, tags: ["hamstrings"], replacements: ["db_rdl", "banded_goodmorning"] },
        { id: "glute_bridge_weighted", sets: 3, repsOrDuration: "12 reps", rpe: 7, tags: ["glutes"], replacements: ["hip_thrust", "single_leg_glute_bridge"] },
        { id: "seated_calf_raise", sets: 3, repsOrDuration: "15 reps", rpe: 7, tags: ["calves"], replacements: ["standing_calf_raise", "donkey_calf_raise"] }
      ],
      cooldown: [
        { id: "pigeon_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "quad_stretch_wall", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "light_cycling", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    // --- WEEK 3 (same structure with progressive overload cues) ---
    {
      week: 3,
      day: 1,
      title: "Upper Body Strength",
      priority: 1,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "banded_face_pull", sets: 2, repsOrDuration: "20 reps", rpe: 4 },
        { id: "wall_slide", sets: 2, repsOrDuration: "10 reps", rpe: 3 },
        { id: "arm_circle_pvc_pass", sets: 1, repsOrDuration: "1-2 min", rpe: 2 }
      ],
      exercises: [
        { id: "barbell_bench_press", sets: 4, repsOrDuration: "6 reps", rpe: 8, tags: ["chest", "strength"], replacements: ["db_bench_press", "pushup", "band_press"] },
        { id: "chin_up_weighted", sets: 4, repsOrDuration: "6-8 reps", rpe: 8, tags: ["back", "vertical_pull"], replacements: ["lat_pulldown", "band_assist_chinup"] },
        { id: "barbell_ohp", sets: 3, repsOrDuration: "6-8 reps", rpe: 8, tags: ["shoulders", "press"], replacements: ["db_ohp", "kb_ohp", "landmine_press"] },
        { id: "barbell_row", sets: 3, repsOrDuration: "8 reps", rpe: 8, tags: ["back", "row", "hinge"], replacements: ["db_row", "suspension_row"] },
        { id: "db_curl", sets: 3, repsOrDuration: "10-12 reps", rpe: 8, tags: ["arms"], replacements: ["barbell_curl", "banded_curl"] },
        { id: "cable_triceps_pressdown", sets: 3, repsOrDuration: "12-15 reps", rpe: 7, tags: ["arms"], replacements: ["dips", "db_triceps_kickback"] }
      ],
      cooldown: [
        { id: "band_shoulder_stretch", sets: 1, repsOrDuration: "2 min", rpe: 2 },
        { id: "wall_pec_stretch", sets: 1, repsOrDuration: "2 min", rpe: 2 },
        { id: "incline_walk", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    {
      week: 3,
      day: 2,
      title: "Lower Body Strength",
      priority: 2,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "glute_bridge", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "worlds_greatest_stretch", sets: 2, repsOrDuration: "1 min", rpe: 3 },
        { id: "banded_lateral_walk", sets: 2, repsOrDuration: "15 steps each way", rpe: 4 }
      ],
      exercises: [
        { id: "barbell_back_squat", sets: 4, repsOrDuration: "6 reps", rpe: 8, tags: ["legs", "compound"], replacements: ["db_goblet_squat", "trap_bar_squat", "belt_squat"] },
        { id: "romanian_deadlift", sets: 3, repsOrDuration: "8 reps", rpe: 8, tags: ["hamstrings", "posterior_chain"], replacements: ["db_rdl", "kb_rdl"] },
        { id: "barbell_reverse_lunge", sets: 3, repsOrDuration: "8 reps per leg", rpe: 8, tags: ["legs", "unilateral"], replacements: ["db_reverse_lunge", "goblet_step_up"] },
        { id: "hamstring_curl_machine", sets: 3, repsOrDuration: "10 reps", rpe: 7, tags: ["hamstrings"], replacements: ["nordic_curl", "banded_leg_curl"] },
        { id: "standing_calf_raise", sets: 3, repsOrDuration: "15-20 reps", rpe: 7, tags: ["calves"], replacements: ["seated_calf_raise", "single_leg_calf_raise"] }
      ],
      cooldown: [
        { id: "hip_flexor_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "hamstring_stretch_floor", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "box_breathing", sets: 1, repsOrDuration: "3 min", rpe: 1 }
      ]
    },
    {
      week: 3,
      day: 3,
      title: "Upper Body Hypertrophy",
      priority: 3,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "scap_pushup", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "banded_external_rotation", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_swing_cross", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ],
      exercises: [
        { id: "db_incline_press", sets: 4, repsOrDuration: "10 reps", rpe: 8, tags: ["chest", "hypertrophy"], replacements: ["barbell_incline_press", "banded_press"] },
        { id: "lat_pulldown", sets: 4, repsOrDuration: "10 reps", rpe: 8, tags: ["back", "vertical_pull"], replacements: ["chin_up", "banded_pullup"] },
        { id: "db_ohp", sets: 3, repsOrDuration: "10 reps", rpe: 8, tags: ["shoulders"], replacements: ["kb_ohp", "landmine_press"] },
        { id: "cable_row", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["back", "row"], replacements: ["db_row", "band_row"] },
        { id: "incline_db_curl", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["arms"], replacements: ["barbell_curl", "preacher_curl"] },
        { id: "overhead_triceps_extension", sets: 3, repsOrDuration: "12-15 reps", rpe: 8, tags: ["arms"], replacements: ["triceps_dip", "kickback"] }
      ],
      cooldown: [
        { id: "shoulder_circle_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "banded_lats_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "walk_cooldown", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    {
      week: 3,
      day: 4,
      title: "Lower Body Hypertrophy",
      priority: 4,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "bodyweight_squat", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "leg_swings_front_back", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "walking_lunge_unweighted", sets: 1, repsOrDuration: "10 steps", rpe: 3 }
      ],
      exercises: [
        { id: "db_goblet_squat", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["legs", "hypertrophy"], replacements: ["belt_squat", "hack_squat"] },
        { id: "leg_press", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["quads"], replacements: ["goblet_split_squat", "bulgarian_split_squat"] },
        { id: "kb_rdl", sets: 3, repsOrDuration: "10 reps", rpe: 8, tags: ["hamstrings"], replacements: ["db_rdl", "banded_goodmorning"] },
        { id: "glute_bridge_weighted", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["glutes"], replacements: ["hip_thrust", "single_leg_glute_bridge"] },
        { id: "seated_calf_raise", sets: 3, repsOrDuration: "15-20 reps", rpe: 8, tags: ["calves"], replacements: ["standing_calf_raise", "donkey_calf_raise"] }
      ],
      cooldown: [
        { id: "pigeon_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "quad_stretch_wall", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "light_cycling", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    // --- WEEK 4 ---
    {
      week: 4,
      day: 1,
      title: "Upper Body Strength",
      priority: 1,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "banded_face_pull", sets: 2, repsOrDuration: "20 reps", rpe: 4 },
        { id: "wall_slide", sets: 2, repsOrDuration: "10 reps", rpe: 3 },
        { id: "arm_circle_pvc_pass", sets: 1, repsOrDuration: "1-2 min", rpe: 2 }
      ],
      exercises: [
        { id: "barbell_bench_press", sets: 4, repsOrDuration: "6 reps", rpe: 8, tags: ["chest", "strength"], replacements: ["db_bench_press", "pushup", "band_press"] },
        { id: "chin_up_weighted", sets: 4, repsOrDuration: "6-8 reps", rpe: 8, tags: ["back", "vertical_pull"], replacements: ["lat_pulldown", "band_assist_chinup"] },
        { id: "barbell_ohp", sets: 3, repsOrDuration: "6-8 reps", rpe: 8, tags: ["shoulders", "press"], replacements: ["db_ohp", "kb_ohp", "landmine_press"] },
        { id: "barbell_row", sets: 3, repsOrDuration: "8 reps", rpe: 8, tags: ["back", "row", "hinge"], replacements: ["db_row", "suspension_row"] },
        { id: "db_curl", sets: 3, repsOrDuration: "10-12 reps", rpe: 8, tags: ["arms"], replacements: ["barbell_curl", "banded_curl"] },
        { id: "cable_triceps_pressdown", sets: 3, repsOrDuration: "12-15 reps", rpe: 7, tags: ["arms"], replacements: ["dips", "db_triceps_kickback"] }
      ],
      cooldown: [
        { id: "band_shoulder_stretch", sets: 1, repsOrDuration: "2 min", rpe: 2 },
        { id: "wall_pec_stretch", sets: 1, repsOrDuration: "2 min", rpe: 2 },
        { id: "incline_walk", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    {
      week: 4,
      day: 2,
      title: "Lower Body Strength",
      priority: 2,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "glute_bridge", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "worlds_greatest_stretch", sets: 2, repsOrDuration: "1 min", rpe: 3 },
        { id: "banded_lateral_walk", sets: 2, repsOrDuration: "15 steps each way", rpe: 4 }
      ],
      exercises: [
        { id: "barbell_back_squat", sets: 4, repsOrDuration: "6 reps", rpe: 8, tags: ["legs", "compound"], replacements: ["db_goblet_squat", "trap_bar_squat", "belt_squat"] },
        { id: "romanian_deadlift", sets: 3, repsOrDuration: "8 reps", rpe: 8, tags: ["hamstrings", "posterior_chain"], replacements: ["db_rdl", "kb_rdl"] },
        { id: "barbell_reverse_lunge", sets: 3, repsOrDuration: "8 reps per leg", rpe: 8, tags: ["legs", "unilateral"], replacements: ["db_reverse_lunge", "goblet_step_up"] },
        { id: "hamstring_curl_machine", sets: 3, repsOrDuration: "10 reps", rpe: 7, tags: ["hamstrings"], replacements: ["nordic_curl", "banded_leg_curl"] },
        { id: "standing_calf_raise", sets: 3, repsOrDuration: "15-20 reps", rpe: 7, tags: ["calves"], replacements: ["seated_calf_raise", "single_leg_calf_raise"] }
      ],
      cooldown: [
        { id: "hip_flexor_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "hamstring_stretch_floor", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "box_breathing", sets: 1, repsOrDuration: "3 min", rpe: 1 }
      ]
    },
    {
      week: 4,
      day: 3,
      title: "Upper Body Hypertrophy",
      priority: 3,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "scap_pushup", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "banded_external_rotation", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_swing_cross", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ],
      exercises: [
        { id: "db_incline_press", sets: 4, repsOrDuration: "10 reps", rpe: 8, tags: ["chest", "hypertrophy"], replacements: ["barbell_incline_press", "banded_press"] },
        { id: "lat_pulldown", sets: 4, repsOrDuration: "10 reps", rpe: 8, tags: ["back", "vertical_pull"], replacements: ["chin_up", "banded_pullup"] },
        { id: "db_ohp", sets: 3, repsOrDuration: "10 reps", rpe: 8, tags: ["shoulders"], replacements: ["kb_ohp", "landmine_press"] },
        { id: "cable_row", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["back", "row"], replacements: ["db_row", "band_row"] },
        { id: "incline_db_curl", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["arms"], replacements: ["barbell_curl", "preacher_curl"] },
        { id: "overhead_triceps_extension", sets: 3, repsOrDuration: "12-15 reps", rpe: 8, tags: ["arms"], replacements: ["triceps_dip", "kickback"] }
      ],
      cooldown: [
        { id: "shoulder_circle_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "banded_lats_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "walk_cooldown", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    {
      week: 4,
      day: 4,
      title: "Lower Body Hypertrophy",
      priority: 4,
      type: "training",
      phase: "Volume",
      warmup: [
        { id: "bodyweight_squat", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "leg_swings_front_back", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "walking_lunge_unweighted", sets: 1, repsOrDuration: "10 steps", rpe: 3 }
      ],
      exercises: [
        { id: "db_goblet_squat", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["legs", "hypertrophy"], replacements: ["belt_squat", "hack_squat"] },
        { id: "leg_press", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["quads"], replacements: ["goblet_split_squat", "bulgarian_split_squat"] },
        { id: "kb_rdl", sets: 3, repsOrDuration: "10 reps", rpe: 8, tags: ["hamstrings"], replacements: ["db_rdl", "banded_goodmorning"] },
        { id: "glute_bridge_weighted", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["glutes"], replacements: ["hip_thrust", "single_leg_glute_bridge"] },
        { id: "seated_calf_raise", sets: 3, repsOrDuration: "15-20 reps", rpe: 8, tags: ["calves"], replacements: ["standing_calf_raise", "donkey_calf_raise"] }
      ],
      cooldown: [
        { id: "pigeon_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "quad_stretch_wall", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "light_cycling", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    // --- WEEK 5 ---
    {
      week: 5,
      day: 1,
      title: "Upper Body Hypertrophy A",
      priority: 1,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "banded_face_pull", sets: 2, repsOrDuration: "15-20 reps", rpe: 3 },
        { id: "scap_pushup", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_circle_pvc_pass", sets: 1, repsOrDuration: "1-2 min", rpe: 2 }
      ],
      exercises: [
        { id: "db_flat_bench_press", sets: 4, repsOrDuration: "10-12 reps", rpe: 8, tags: ["chest"] },
        { id: "lat_pulldown", sets: 4, repsOrDuration: "10-12 reps", rpe: 8, tags: ["back"] },
        { id: "db_lateral_raise", sets: 3, repsOrDuration: "15 reps", rpe: 7, tags: ["shoulders"] },
        { id: "cable_row", sets: 3, repsOrDuration: "12-15 reps", rpe: 8, tags: ["back"] },
        { id: "incline_db_curl", sets: 3, repsOrDuration: "12-15 reps", rpe: 8, tags: ["arms"] },
        { id: "triceps_rope_pushdown", sets: 3, repsOrDuration: "12-15 reps", rpe: 8, tags: ["arms"] }
      ],
      cooldown: [
        { id: "banded_chest_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "lat_stretch_wall", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 5,
      day: 2,
      title: "Lower Body Hypertrophy A",
      priority: 2,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "glute_bridge", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "bodyweight_squat", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "leg_swings_front_back", sets: 2, repsOrDuration: "15 reps", rpe: 3 }
      ],
      exercises: [
        { id: "leg_press", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["quads"] },
        { id: "db_rdl", sets: 4, repsOrDuration: "10-12 reps", rpe: 8, tags: ["hamstrings"] },
        { id: "bulgarian_split_squat", sets: 3, repsOrDuration: "10 reps per leg", rpe: 8, tags: ["legs"] },
        { id: "hip_thrust", sets: 3, repsOrDuration: "12-15 reps", rpe: 8, tags: ["glutes"] },
        { id: "standing_calf_raise", sets: 3, repsOrDuration: "15-20 reps", rpe: 7, tags: ["calves"] }
      ],
      cooldown: [
        { id: "pigeon_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "hamstring_stretch_floor", sets: 1, repsOrDuration: "1 min per side", rpe: 2 }
      ]
    },
    {
      week: 5,
      day: 3,
      title: "Upper Body Hypertrophy B",
      priority: 3,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "wall_slide", sets: 2, repsOrDuration: "10 reps", rpe: 3 },
        { id: "banded_external_rotation", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_swing_cross", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ],
      exercises: [
        { id: "incline_db_press", sets: 4, repsOrDuration: "10-12 reps", rpe: 8, tags: ["chest"] },
        { id: "chin_up", sets: 4, repsOrDuration: "8-10 reps", rpe: 8, tags: ["back"] },
        { id: "db_shoulder_press", sets: 3, repsOrDuration: "10-12 reps", rpe: 8, tags: ["shoulders"] },
        { id: "db_row", sets: 3, repsOrDuration: "10-12 reps", rpe: 8, tags: ["back"] },
        { id: "barbell_curl", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["arms"] },
        { id: "overhead_triceps_extension", sets: 3, repsOrDuration: "12-15 reps", rpe: 8, tags: ["arms"] }
      ],
      cooldown: [
        { id: "doorway_chest_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "banded_lats_stretch", sets: 1, repsOrDuration: "1 min per side", rpe: 2 }
      ]
    },
    {
      week: 5,
      day: 4,
      title: "Lower Body Hypertrophy B",
      priority: 4,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "walking_lunge_unweighted", sets: 2, repsOrDuration: "10 steps each leg", rpe: 3 },
        { id: "cossack_squat", sets: 2, repsOrDuration: "10 reps", rpe: 3 },
        { id: "glute_activation_band_walk", sets: 2, repsOrDuration: "10 steps each direction", rpe: 3 }
      ],
      exercises: [
        { id: "db_goblet_squat", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["quads"] },
        { id: "hamstring_curl_machine", sets: 4, repsOrDuration: "12 reps", rpe: 8, tags: ["hamstrings"] },
        { id: "step_up_weighted", sets: 3, repsOrDuration: "10 reps per leg", rpe: 8, tags: ["glutes"] },
        { id: "kb_rdl", sets: 3, repsOrDuration: "12 reps", rpe: 8, tags: ["hamstrings"] },
        { id: "seated_calf_raise", sets: 3, repsOrDuration: "15-20 reps", rpe: 7, tags: ["calves"] }
      ],
      cooldown: [
        { id: "quad_stretch_wall", sets: 1, repsOrDuration: "1 min per side", rpe: 2 },
        { id: "light_cycling", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    // --- WEEK 6 ---
    {
      week: 6,
      day: 1,
      title: "Upper Body Hypertrophy A",
      priority: 1,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "banded_face_pull", sets: 2, repsOrDuration: "20 reps", rpe: 3 },
        { id: "scap_pushup", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_circle_pvc_pass", sets: 1, repsOrDuration: "2 min", rpe: 2 }
      ],
      exercises: [
        { id: "barbell_flat_bench_press", sets: 4, repsOrDuration: "10 reps", rpe: 8 },
        { id: "pull_up", sets: 4, repsOrDuration: "10 reps", rpe: 8 },
        { id: "db_lateral_raise", sets: 3, repsOrDuration: "15 reps", rpe: 7 },
        { id: "cable_face_pull", sets: 3, repsOrDuration: "15 reps", rpe: 7 },
        { id: "db_hammer_curl", sets: 3, repsOrDuration: "12 reps", rpe: 8 },
        { id: "dips", sets: 3, repsOrDuration: "12 reps", rpe: 8 }
      ],
      cooldown: [
        { id: "chest_opener_floor", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "lat_stretch_wall", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 6,
      day: 2,
      title: "Lower Body Hypertrophy A",
      priority: 2,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "glute_bridge", sets: 2, repsOrDuration: "20 reps", rpe: 3 },
        { id: "air_squat", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "dynamic_leg_swing", sets: 2, repsOrDuration: "15 reps", rpe: 3 }
      ],
      exercises: [
        { id: "barbell_back_squat", sets: 4, repsOrDuration: "10 reps", rpe: 8 },
        { id: "romanian_deadlift", sets: 4, repsOrDuration: "12 reps", rpe: 8 },
        { id: "walking_lunge_weighted", sets: 3, repsOrDuration: "20 steps", rpe: 8 },
        { id: "glute_kickback", sets: 3, repsOrDuration: "15 reps each", rpe: 8 },
        { id: "standing_calf_raise", sets: 3, repsOrDuration: "20 reps", rpe: 7 }
      ],
      cooldown: [
        { id: "seated_hamstring_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "kneeling_quad_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 6,
      day: 3,
      title: "Upper Body Hypertrophy B",
      priority: 3,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "arm_swing_cross", sets: 2, repsOrDuration: "1 min", rpe: 2 },
        { id: "banded_internal_rotation", sets: 2, repsOrDuration: "15 reps", rpe: 3 }
      ],
      exercises: [
        { id: "incline_barbell_press", sets: 4, repsOrDuration: "10-12 reps", rpe: 8 },
        { id: "t_bar_row", sets: 4, repsOrDuration: "10-12 reps", rpe: 8 },
        { id: "arnold_press", sets: 3, repsOrDuration: "12 reps", rpe: 8 },
        { id: "reverse_fly_machine", sets: 3, repsOrDuration: "15 reps", rpe: 7 },
        { id: "concentration_curl", sets: 3, repsOrDuration: "12 reps", rpe: 8 },
        { id: "skullcrusher", sets: 3, repsOrDuration: "12-15 reps", rpe: 8 }
      ],
      cooldown: [
        { id: "shoulder_stretch_doorway", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "wrist_extensor_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 6,
      day: 4,
      title: "Lower Body Hypertrophy B",
      priority: 4,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "side_lunge_bodyweight", sets: 2, repsOrDuration: "10 reps each", rpe: 3 },
        { id: "banded_glute_walk", sets: 2, repsOrDuration: "15 steps each way", rpe: 3 }
      ],
      exercises: [
        { id: "front_squat", sets: 4, repsOrDuration: "10 reps", rpe: 8 },
        { id: "hamstring_curl_machine", sets: 4, repsOrDuration: "12 reps", rpe: 8 },
        { id: "reverse_lunge_barbell", sets: 3, repsOrDuration: "10 reps per leg", rpe: 8 },
        { id: "glute_bridge_elevated", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "seated_calf_raise", sets: 3, repsOrDuration: "20 reps", rpe: 7 }
      ],
      cooldown: [
        { id: "couch_stretch", sets: 1, repsOrDuration: "1 min per leg", rpe: 2 },
        { id: "light_elliptical", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    // --- WEEK 7 ---
    {
      week: 7,
      day: 1,
      title: "Upper Body Hypertrophy A",
      priority: 1,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "banded_face_pull", sets: 2, repsOrDuration: "20 reps", rpe: 3 },
        { id: "scap_pushup", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_circle_pvc_pass", sets: 1, repsOrDuration: "2 min", rpe: 2 }
      ],
      exercises: [
        { id: "barbell_flat_bench_press", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "pull_up", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "db_lateral_raise", sets: 3, repsOrDuration: "12 reps", rpe: 8 },
        { id: "cable_face_pull", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "ez_bar_curl", sets: 3, repsOrDuration: "10 reps", rpe: 9 },
        { id: "triceps_rope_pushdown", sets: 3, repsOrDuration: "10 reps", rpe: 9 }
      ],
      cooldown: [
        { id: "chest_opener_floor", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "lat_stretch_wall", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 7,
      day: 2,
      title: "Lower Body Hypertrophy A",
      priority: 2,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "glute_bridge", sets: 2, repsOrDuration: "20 reps", rpe: 3 },
        { id: "air_squat", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "dynamic_leg_swing", sets: 2, repsOrDuration: "15 reps", rpe: 3 }
      ],
      exercises: [
        { id: "barbell_back_squat", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "romanian_deadlift", sets: 4, repsOrDuration: "10 reps", rpe: 9 },
        { id: "walking_lunge_weighted", sets: 3, repsOrDuration: "16 steps", rpe: 8 },
        { id: "glute_kickback", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "seated_calf_raise", sets: 3, repsOrDuration: "20 reps", rpe: 7 }
      ],
      cooldown: [
        { id: "seated_hamstring_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "kneeling_quad_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 7,
      day: 3,
      title: "Upper Body Hypertrophy B",
      priority: 3,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "arm_swing_cross", sets: 2, repsOrDuration: "1 min", rpe: 2 },
        { id: "banded_internal_rotation", sets: 2, repsOrDuration: "15 reps", rpe: 3 }
      ],
      exercises: [
        { id: "incline_barbell_press", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "t_bar_row", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "arnold_press", sets: 3, repsOrDuration: "10 reps", rpe: 8 },
        { id: "reverse_fly_machine", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "concentration_curl", sets: 3, repsOrDuration: "10 reps", rpe: 9 },
        { id: "skullcrusher", sets: 3, repsOrDuration: "12 reps", rpe: 9 }
      ],
      cooldown: [
        { id: "shoulder_stretch_doorway", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "wrist_extensor_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 7,
      day: 4,
      title: "Lower Body Hypertrophy B",
      priority: 4,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "side_lunge_bodyweight", sets: 2, repsOrDuration: "10 reps each", rpe: 3 },
        { id: "banded_glute_walk", sets: 2, repsOrDuration: "15 steps each way", rpe: 3 }
      ],
      exercises: [
        { id: "front_squat", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "hamstring_curl_machine", sets: 4, repsOrDuration: "10 reps", rpe: 9 },
        { id: "reverse_lunge_barbell", sets: 3, repsOrDuration: "10 reps per leg", rpe: 8 },
        { id: "glute_bridge_elevated", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "standing_calf_raise", sets: 3, repsOrDuration: "20 reps", rpe: 7 }
      ],
      cooldown: [
        { id: "couch_stretch", sets: 1, repsOrDuration: "1 min per leg", rpe: 2 },
        { id: "light_elliptical", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    },
    // --- WEEK 8 ---
    {
      week: 8,
      day: 1,
      title: "Upper Body Hypertrophy A",
      priority: 1,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "banded_face_pull", sets: 2, repsOrDuration: "20 reps", rpe: 3 },
        { id: "scap_pushup", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "arm_circle_pvc_pass", sets: 1, repsOrDuration: "2 min", rpe: 2 }
      ],
      exercises: [
        { id: "barbell_flat_bench_press", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "pull_up", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "db_lateral_raise", sets: 3, repsOrDuration: "12 reps", rpe: 8 },
        { id: "cable_face_pull", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "ez_bar_curl", sets: 3, repsOrDuration: "10 reps", rpe: 9 },
        { id: "triceps_rope_pushdown", sets: 3, repsOrDuration: "10 reps", rpe: 9 }
      ],
      cooldown: [
        { id: "chest_opener_floor", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "lat_stretch_wall", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 8,
      day: 2,
      title: "Lower Body Hypertrophy A",
      priority: 2,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "glute_bridge", sets: 2, repsOrDuration: "20 reps", rpe: 3 },
        { id: "air_squat", sets: 2, repsOrDuration: "15 reps", rpe: 3 },
        { id: "dynamic_leg_swing", sets: 2, repsOrDuration: "15 reps", rpe: 3 }
      ],
      exercises: [
        { id: "barbell_back_squat", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "romanian_deadlift", sets: 4, repsOrDuration: "10 reps", rpe: 9 },
        { id: "walking_lunge_weighted", sets: 3, repsOrDuration: "16 steps", rpe: 8 },
        { id: "glute_kickback", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "seated_calf_raise", sets: 3, repsOrDuration: "20 reps", rpe: 7 }
      ],
      cooldown: [
        { id: "seated_hamstring_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "kneeling_quad_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 8,
      day: 3,
      title: "Upper Body Hypertrophy B",
      priority: 3,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "arm_swing_cross", sets: 2, repsOrDuration: "1 min", rpe: 2 },
        { id: "banded_internal_rotation", sets: 2, repsOrDuration: "15 reps", rpe: 3 }
      ],
      exercises: [
        { id: "incline_barbell_press", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "t_bar_row", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "arnold_press", sets: 3, repsOrDuration: "10 reps", rpe: 8 },
        { id: "reverse_fly_machine", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "concentration_curl", sets: 3, repsOrDuration: "10 reps", rpe: 9 },
        { id: "skullcrusher", sets: 3, repsOrDuration: "12 reps", rpe: 9 }
      ],
      cooldown: [
        { id: "shoulder_stretch_doorway", sets: 1, repsOrDuration: "1 min", rpe: 2 },
        { id: "wrist_extensor_stretch", sets: 1, repsOrDuration: "1 min", rpe: 2 }
      ]
    },
    {
      week: 8,
      day: 4,
      title: "Lower Body Hypertrophy B",
      priority: 4,
      type: "training",
      phase: "Hypertrophy",
      warmup: [
        { id: "side_lunge_bodyweight", sets: 2, repsOrDuration: "10 reps each", rpe: 3 },
        { id: "banded_glute_walk", sets: 2, repsOrDuration: "15 steps each way", rpe: 3 }
      ],
      exercises: [
        { id: "front_squat", sets: 4, repsOrDuration: "8 reps", rpe: 9 },
        { id: "hamstring_curl_machine", sets: 4, repsOrDuration: "10 reps", rpe: 9 },
        { id: "reverse_lunge_barbell", sets: 3, repsOrDuration: "10 reps per leg", rpe: 8 },
        { id: "glute_bridge_elevated", sets: 3, repsOrDuration: "15 reps", rpe: 8 },
        { id: "standing_calf_raise", sets: 3, repsOrDuration: "20 reps", rpe: 7 }
      ],
      cooldown: [
        { id: "couch_stretch", sets: 1, repsOrDuration: "1 min per leg", rpe: 2 },
        { id: "light_elliptical", sets: 1, repsOrDuration: "5 min", rpe: 4 }
      ]
    }
  ]
};