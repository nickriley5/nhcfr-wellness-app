# Handoff Summary (Do Not Push Secrets)

**IMPORTANT: Never push API keys or secrets to GitHub.**
Keep keys only in `.env` or `utils/localSecrets.ts` (gitignored). Do not commit any key values.

## Current State
- Project: `/Users/nhfd_dev_mac/projects/nhcfr-wellness-app`
- Pods are already installed.

## Security / Secrets
- Hardcoded keys removed; env read via `utils/env.ts`.
- `utils/localSecrets.ts` exists for local dev (gitignored).
- `.gitignore` updated for secrets.
- Secret scan scripts and pre-commit hook added.

## AI Service Refactor
- `utils/ai/aiService.ts` modularized (providers, prompts, config, JSON utils, schema).
- Added JSON repair retry in `getWorkoutRecommendation` if the AI returns malformed JSON.

## HIIT / Cardio UX
- Cardio HIIT uses interval timer with:
  - circuit format (1 round = all exercises once)
  - exercise-by-exercise countdown
  - round counter
  - 3-2-1 beeps before phase transitions and triple beep on completion
  - Stop button logs time/rounds
- HIIT screen now shows:
  - circuit list with notes
  - exercise videos (YouTube or MP4)
  - “1 round = all exercises once” text
- Interval timer syncs with workout timer.

## Quick Workout / AI Assistant
- Modal trimmed to remove fluff; focus on actionable fields.
- AI outputs structured exercises with sets/reps/rest.
- HIIT includes `interval` structure (rounds/work/rest/transition/format).
- Endurance returns `cardio` object and routes to Cardio screen.
- Apply now routes:
  - HIIT/Conditioning → `CardioWorkout`
  - Endurance → `CardioWorkout`
  - Strength/Hypertrophy → `WorkoutDetail`
- Exercise objects are formatted safely in preview and mapped to WorkoutDetail schema.

## Expanded HIIT Pool
- Includes **bodyweight exercises** (with videos only).
- When applying HIIT, exercises are resolved against library and **must have videos**.
- If AI picks exercises without videos, swap to valid ones.

## Dashboard
- Added `TodaysCardioCard` with weekly cardio progress.
- “Today’s Workout” remains strength-only.
- Coming-up modal fixed for “Unknown Exercise.”
- “Choose Program” button now navigates to Workout screen.

## Fixes
- Firestore invalid data for meal logging fixed (portionInfo sanitized).
- Expo filesystem legacy API used for image analysis.
- Gemini vision fallback improved.
- Hermes “Error.stack invalid receiver” spam reduced via safe logging + guard.

## Note
- Pods already installed; no need to run `pod install` again.
- Always verify no secrets are staged before any commit or push.
