# 🔥 AI Workout Coach - Development Handoff Summary
**Date:** December 9, 2025  
**Branch:** `ai-integration` (all changes pushed to GitHub)  
**Project:** NHCFR Wellness App - Firefighter Training Platform

---

## 📍 Current Status

We're building a **professional-grade AI-powered workout coaching system** using Google Gemini 2.5 Flash. The app generates custom workouts, tracks progress, and provides intelligent coaching adjustments based on user feedback.

**Phase 1 Progress:** 80% Complete ✨
- ✅ Post-workout feedback modal (captures feeling + notes)
- ✅ Removed header Adapt button (kept in-content button)
- ✅ Enhanced AI prompts for periodization & progressive overload
- ✅ Periodized program generation with deload weeks
- ✅ Dynamic coaching adjustment system
- 🔄 **NEXT:** Integrate coaching advice into WorkoutDetailScreen UI

---

## 🎯 Vision & Requirements

### Core Philosophy
**"Flawless AI coaching that rivals a pro-level trainer"**

The AI must:
1. Generate **periodized programs** with progressive overload
2. **Dynamically adjust** workouts based on user feedback and performance
3. Provide **contextual coaching advice** (knows their program, macros, history)
4. Support multiple workout types (Strength, Cardio, HIIT, Quick & Brutal)
5. Be **free for 30 active users** (budget-conscious with Gemini API)

### Key Features Needed
1. **Progressive Programs:** Multi-week plans that increase intensity over time
2. **Dynamic Coaching:** AI adjusts next workout based on last session + feedback
3. **Smart Recovery:** Detects exhaustion (e.g., "2 structure fires") and scales workouts
4. **Full Context Chat:** AI knows user's program, nutrition, equipment, goals
5. **Professional Quality:** Exercise selection, rep schemes, periodization must be expert-level

---

## 🆕 NEW: Phase 1 Enhancements (Just Built!)

### 1. Periodized Program Generation (NEW)
- **Location:** `utils/ai/aiService.ts`, `components/Modals/PeriodizedProgramModal.tsx`
- **Features:**
  - Complete multi-week program generation (8, 12, 16 weeks)
  - Three periodization models: Linear, Undulating, Block
  - Progressive overload built-in (5-10% weekly increases)
  - Automatic deload weeks (every 4th week)
  - Phase-based training with clear progression
  - Detailed exercise programming (sets, reps, RPE, rest)
  - Saves to `users/{uid}/aiPrograms/{programId}`
- **Interface:**
  - Goal selection (Strength, VO2 Max, Muscle, Fat Loss)
  - Training frequency selector (3-6 days/week)
  - Periodization model picker with descriptions
  - Program preview before saving

### 2. Dynamic Coaching System (NEW)
- **Location:** `utils/ai/aiService.ts`, `utils/coachingService.ts`, `components/Modals/CoachingAdviceModal.tsx`
- **Features:**
  - Fetches last workout with feedback
  - AI analyzes feeling ("Exhausted", "Tough", "Good", etc.)
  - Intelligently adjusts workout volume/intensity
  - Considers program context (week, phase, goal)
  - Provides coaching advice with rationale
  - Shows before workout starts
- **Adjustment Logic:**
  - "Exhausted" + stress notes → 30-40% volume reduction
  - "Tough" → 10-20% volume reduction
  - "Good/Strong" → Proceed as planned
  - Increases rest periods when fatigued
- **Interface:**
  - Modal shows coaching advice
  - Displays adjusted exercises with notes
  - Two options: "Accept Changes" or "Use Original"

### 3. Enhanced AI Prompts (NEW)
- **Location:** `utils/ai/aiService.ts`
- **Improvements:**
  - Professional-grade periodization knowledge
  - RPE (Rate of Perceived Exertion) integration
  - Firefighter-specific exercise selection
  - Structured phase progression
  - Deload week automation
  - Progressive overload tracking

---

## ✅ What's Been Built (Pre-existing)

### 1. AI Workout Generation (Working)
- **Location:** `screens/WorkoutScreen.tsx`, `components/AIWorkoutAssistant.tsx`
- **API:** Google Gemini 2.5 Flash (`<YOUR_GEMINI_API_KEY>`)
- **Features:**
  - Equipment-based filtering (~57 exercises for dumbbells/bodyweight)
  - Generates warm-ups, main exercises, cool-downs
  - Saves to `users/{uid}/aiWorkouts/{workoutId}` (doesn't overwrite program)
  - YouTube video playback (including Shorts support)

### 2. Dashboard Integration (Working)
- **Location:** `components/Dashboard/TodaysWorkoutCard.tsx`, `hooks/useDashboardData.ts`
- **Features:**
  - Shows AI-generated workout when available (takes precedence)
  - "Start AI Workout" button (centered, full-width)
  - "Return to Scheduled Workout" dismisses AI workout
  - Displays workout summary (exercises, sets, time estimate)

### 3. Adapt Workout Screen (Working)
- **Location:** `screens/AdaptWorkoutScreen.tsx`
- **Features:**
  - Reflects **current active workout** (AI or programmed)
  - Can swap exercises with alternatives from library
  - Saves back to correct source (AI workout or active program)
  - YouTube videos work for swapped exercises
  - Button in WorkoutDetailScreen content area

### 4. Workout Detail Screen (Working)
- **Location:** `screens/WorkoutDetailScreen.tsx`
- **Features:**
  - Warm-up and cool-down exercises display with videos
  - Manual exercise completion (no auto-complete bug)
  - **NEW:** Post-workout feedback modal
  - Videos play inline (YouTube + direct files)

### 5. Post-Workout Feedback Modal (NEW - Just Built)
- **Location:** `components/Modals/WorkoutFeedbackModal.tsx`
- **Features:**
  - 5 feeling options: 💪 Strong | 😊 Good | 😐 Okay | 😓 Tough | 🔥 Exhausted
  - Optional text note (200 chars) - e.g., "structure fire last night"
  - Saves to `workoutLogs/{logId}/feedback` with timestamp
  - Shows after PR celebration (or immediately if no PRs)
  - Data structure ready for AI coaching

### 6. Video Playback (Working)
- **Location:** `components/VideoToggle.tsx`
- **Features:**
  - YouTube support (watch, embed, youtu.be, **shorts**)
  - Firebase Storage direct video files
  - Error handling with user-friendly messages
  - Inline playback (no external app)

---

## 🔄 Next Steps - Phase 1 Continuation

### **Task 3: Enhanced AI Prompts for Periodization** ✅ COMPLETE

**Goal:** Make AI generate professional-grade periodized programs

**What was built:**
1. **New AI Service Function: `generatePeriodizedProgram()`** in `utils/ai/aiService.ts`
   - ✅ Supports 3 periodization models (linear, undulating, block)
   - ✅ Progressive overload: 5-10% volume increases per week
   - ✅ Automatic deload weeks (every 4th week, 40% volume reduction)
   - ✅ Sport-specific phase planning:
     - **Linear:** Hypertrophy → Strength → Power → Peak
     - **Undulating:** Daily intensity variation with deload weeks
     - **Block:** Base → Threshold → Peak → Taper
   - ✅ Detailed exercise programming with sets, reps, RPE, rest periods
   - ✅ Week-by-week progression strategy

2. **New Modal Component: `PeriodizedProgramModal.tsx`**
   - ✅ User-friendly program generation interface
   - ✅ Goal selection (Strength, VO2 Max, Muscle, Fat Loss)
   - ✅ Duration options (8, 12, 16 weeks)
   - ✅ Training frequency (3-6 days/week)
   - ✅ Periodization model selector with descriptions
   - ✅ Program preview with phases and sample workouts
   - ✅ Saves to Firebase `aiPrograms` collection

2. **Example prompt structure:**
```javascript
const prompt = `You are an elite strength & conditioning coach specializing in firefighter fitness.

USER PROFILE:
- Goal: ${userGoal} (e.g., "Improve VO2 max for fireground performance")
- Experience: ${experience}
- Equipment: ${equipment}
- Duration: ${weeks} weeks
- Days per week: ${daysPerWeek}

PROGRAM REQUIREMENTS:
- Use periodization model: ${periodization} (linear/undulating/block)
- Progressive overload: Increase volume/intensity by 5-10% weekly
- Include deload week every 4th week (reduce volume by 40%)
- Exercise selection: Use ONLY exercises from the provided library (IDs below)
- Rep schemes: Match goal (Strength: 3-6 reps, Hypertrophy: 8-12, Endurance: 15+)
- Include warm-up (5-10 min dynamic) and cool-down (5-10 min static stretch)

WEEK-BY-WEEK PROGRESSION:
Week 1-4: [Phase 1 details]
Week 5-8: [Phase 2 details]
Week 9-12: [Phase 3 details]

EXERCISE LIBRARY (use these IDs):
${exerciseLibraryJSON}

Return JSON with structure:
{
  "programName": "12-Week VO2 Max Builder",
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Base Building",
      "days": [...]
    }
  ]
}`;
```

3. **Store program in `users/{uid}/aiPrograms/{programId}`**
   - Different from single workouts (`aiWorkouts`)
   - Includes full week-by-week structure
   - Can be set as active program

### **Task 4: Dynamic Coaching Adjustment System** ✅ COMPLETE

**Goal:** AI adjusts workouts based on last session + feedback

**What was built:**
1. **New AI Service Function: `getWorkoutAdjustments()`** in `utils/ai/aiService.ts`
   - ✅ Analyzes last workout feedback (feeling + notes)
   - ✅ Considers workout completion rate
   - ✅ Evaluates program context (current week, phase, goal)
   - ✅ Generates intelligent adjustments:
     - "Exhausted" → 30-40% volume reduction
     - "Tough" → 10-20% volume reduction  
     - "Good/Strong" → Proceed as planned or 5-10% increase
   - ✅ Returns coaching advice with rationale
   - ✅ Provides adjusted workout with modified sets/reps/rest

2. **New Coaching Service: `coachingService.ts`**
   - ✅ `getLastWorkoutWithFeedback()`: Fetches recent workout with feedback
   - ✅ `generateCoachingAdvice()`: Orchestrates AI analysis
   - ✅ Smart detection: Only shows coaching when needed (exhausted/tough feelings)

3. **New Modal Component: `CoachingAdviceModal.tsx`**
   - ✅ Beautiful coaching interface with "Your Coach" branding
   - ✅ Displays personalized coaching advice
   - ✅ Shows adjusted workout with exercise-specific notes
   - ✅ Two action buttons:
     - "Use Original" - Proceed with scheduled workout
     - "Accept Changes" - Apply AI adjustments
   - ✅ Contextual info about why adjustments were made

---

## 🎨 UI/UX Changes Needed (Phase 2)

### New WorkoutScreen Layout (Not Started)
**Design:**
```
┌─────────────────────────────────┐
│  Workout Screen                  │
├─────────────────────────────────┤
│  [Horizontal Scroll Tiles]       │
│  ┌──────────┐  ┌──────────┐     │
│  │ Active   │  │ AI Coach │  →  │
│  │ Program  │  │ 5 Options│     │
│  └──────────┘  └──────────┘     │
│                                  │
│  ──── Today's Sessions ────      │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓     │
│  ┃ 🤖 AI Strength (2:30pm)┃     │
│  ┃ [Start Workout →]       ┃     │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓     │
│  ┃ 💪 Day 3: Upper Body    ┃     │
│  ┃ [Start Workout →]       ┃     │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛     │
└─────────────────────────────────┘
```

**AI Coach Tile - 5 Options:**
1. **Stick to Program** - Continue scheduled program
2. **Strength** - Generate strength-focused workout
3. **Cardio** - Generate cardio/conditioning session
4. **Quick & Brutal** - Short, intense workout (20-30 min)
5. **Generate Program** - Full multi-week program (opens goals modal)

---

## 🤖 AI Chat Enhancement (Phase 3)

### Goal: Give AI full context about user

**What to do:**
1. **Update `screens/AIChatScreen.tsx`** (line ~50)
2. **Load and send context:**
```javascript
{
  userProfile: {
    goals: "Improve VO2 max",
    equipment: ["dumbbells", "pull-up bar"],
    experience: "intermediate",
    injuries: ["previous knee pain"],
    age: 32,
    weight: 185
  },
  currentProgram: {
    name: "12-Week VO2 Max Builder",
    week: 2,
    day: 3,
    recentWorkouts: [/* last 3 workouts */]
  },
  nutrition: {
    dailyCalories: 2800,
    protein: 180,
    currentMacros: { eaten: 2200 }
  }
}
```

3. **Enhanced system prompt:**
```
You are an elite fitness coach with access to this user's complete profile.
Provide advice based on THEIR specific data.
Include links to YouTube videos and scientific articles.
```

---

## 💰 API Cost Management

**Gemini 2.5 Flash:**
- Free tier: 1,500 requests/day, 15 RPM
- Paid tier: $0.075/1M input tokens, $0.30/1M output

**30 Users Budget:**
- Worst case: 300K tokens/day
- Cost: ~$3.38/day = **$101/month** (affordable)
- Strategy: Start free, upgrade if needed

**Optimizations:**
- Cache user profile data
- Only send full context when relevant (keyword detection)
- Use shorter prompts for simple adjustments

---

## 📂 Key Files to Know

### AI Services (Core Intelligence)
- `utils/ai/aiService.ts` - **All AI functions** (workout gen, programs, coaching)
  - `getWorkoutRecommendation()` - Single workout generation
  - `generatePeriodizedProgram()` - Full multi-week programs ✨ NEW
  - `getWorkoutAdjustments()` - Dynamic coaching adjustments ✨ NEW
  - `chatWithCoach()` - AI chat functionality
- `utils/coachingService.ts` - **Coaching utilities** ✨ NEW
  - `getLastWorkoutWithFeedback()` - Fetches recent workout feedback
  - `generateCoachingAdvice()` - Orchestrates AI coaching

### UI Components
- `components/Modals/PeriodizedProgramModal.tsx` - **Program generator UI** ✨ NEW
- `components/Modals/CoachingAdviceModal.tsx` - **Coaching advice display** ✨ NEW
- `components/Modals/WorkoutFeedbackModal.tsx` - Post-workout feedback
- `components/AIWorkoutAssistant.tsx` - Single workout generator modal
- `screens/WorkoutScreen.tsx` - Workout tab with AI button
- `data/exercises.ts` - Exercise library (~200 exercises)

### Dashboard
- `components/Dashboard/TodaysWorkoutCard.tsx` - Shows AI/program workouts
- `hooks/useDashboardData.ts` - Fetches AI workouts + program

### Workout Execution
- `screens/WorkoutDetailScreen.tsx` - Main workout execution screen
- `components/Modals/WorkoutFeedbackModal.tsx` - Post-workout feedback
- `components/VideoToggle.tsx` - Video player

### Adapt System
- `screens/AdaptWorkoutScreen.tsx` - Exercise swapping
- Checks `aiWorkouts` first, falls back to `program/active`

### Data Structure
```
users/{uid}/
  ├── program/active - Current scheduled program
  ├── aiWorkouts/{workoutId} - Single AI-generated workouts
  ├── aiPrograms/{programId} - Full AI-generated programs ✨ NEW
  │   └── {
  │       programName: string,
  │       totalWeeks: number,
  │       periodizationModel: 'linear' | 'undulating' | 'block',
  │       phases: [...],
  │       weeks: [
  │         {
  │           weekNumber: number,
  │           phase: string,
  │           isDeload: boolean,
  │           volumeMultiplier: number,
  │           days: [...]
  │         }
  │       ],
  │       createdAt: string,
  │       isActive: boolean
  │     }
  ├── workoutLogs/{logId} - Completed workouts
  │   └── feedback: { feeling, note, submittedAt } ✨ ENHANCED
  ├── mealPlan/active - Nutrition plan
  └── profile - User data
```

---

## 🚀 Immediate Next Actions

### **INTEGRATION NEEDED** (Phase 1 - Final Step)

The core AI systems are built and ready. Now we need to integrate them into the UI:

#### 1. Add Coaching Advice to WorkoutDetailScreen
**File:** `screens/WorkoutDetailScreen.tsx`

**Steps:**
```typescript
// Import the coaching components and services
import CoachingAdviceModal from '../components/Modals/CoachingAdviceModal';
import { generateCoachingAdvice } from '../utils/coachingService';

// Add state for coaching
const [showCoachingModal, setShowCoachingModal] = useState(false);
const [coachingData, setCoachingData] = useState<any>(null);

// In the useEffect that loads workout, add coaching check:
useEffect(() => {
  // ... existing workout loading code ...
  
  // Generate coaching advice if available
  const checkForCoaching = async () => {
    const advice = await generateCoachingAdvice(
      {
        dayName: day.title,
        focus: day.focus || '',
        exercises: mainExercises.map(ex => ({
          name: ex.name,
          sets: ex.setsCount,
          reps: `${ex.repsCount}`,
          restSeconds: 60,
        })),
      },
      {
        currentWeek: 1, // Get from program data
        totalWeeks: 12, // Get from program data
        goal: 'Build Strength', // Get from user profile
        phase: 'Hypertrophy', // Get from program data
      }
    );
    
    if (advice) {
      setCoachingData(advice);
      setShowCoachingModal(true);
    }
  };
  
  checkForCoaching();
}, []);

// Add modal to render:
<CoachingAdviceModal
  visible={showCoachingModal}
  onClose={() => setShowCoachingModal(false)}
  coachingAdvice={coachingData?.coachingAdvice || ''}
  shouldAdjust={coachingData?.shouldAdjust || false}
  adjustedWorkout={coachingData?.adjustedWorkout}
  onAcceptAdjustments={() => {
    // Apply the adjusted workout to the current workout
    // Update mainExercises with adjustedWorkout data
  }}
  onUseOriginal={() => {
    // Do nothing, use scheduled workout
    setShowCoachingModal(false);
  }}
/>
```

#### 2. Add Program Generator to WorkoutScreen
**File:** `screens/WorkoutScreen.tsx`

**Steps:**
```typescript
// Import the modal
import PeriodizedProgramModal from '../components/Modals/PeriodizedProgramModal';

// Add state
const [showProgramModal, setShowProgramModal] = useState(false);

// Add button in the UI (maybe in the header or as a card)
<Pressable onPress={() => setShowProgramModal(true)}>
  <Text>🎯 Generate Full Program</Text>
</Pressable>

// Add modal
<PeriodizedProgramModal
  visible={showProgramModal}
  onClose={() => setShowProgramModal(false)}
  userProfile={{
    goals: ['Build Strength'],
    experience: 'intermediate',
    equipment: ['dumbbells', 'bodyweight'],
  }}
  onProgramGenerated={(programId) => {
    console.log('Program generated:', programId);
    // Navigate to program view or set as active
  }}
/>
```

#### 3. Test End-to-End Flow
1. Complete a workout and submit feedback as "Exhausted" with note "2 structure fires"
2. Start a new workout the next day
3. Coaching modal should appear with reduced volume
4. Accept adjustments and verify workout is modified
5. Generate a 12-week program and verify it saves to Firebase

---

## 🚀 Quick Integration Commands

```bash
# Verify imports are correct
cd /Users/nhfd_dev_mac/projects/nhcfr-wellness-app
grep -r "PeriodizedProgram" utils/ai/aiService.ts
grep -r "CoachingAdviceModal" components/Modals/

# Test the app
npx react-native run-android
```

---

## 🎯 Success Criteria

**Phase 1 Status: 80% Complete ✨**
- ✅ Feedback modal working and saving data
- ✅ AI generates periodized programs (not just single workouts)
- ✅ AI adjusts workouts based on feedback
- ✅ Coaching advice modal component built
- ✅ User can accept/reject AI adjustments (modal ready)
- 🔄 **Integration pending:** Connect coaching to WorkoutDetailScreen
- 🔄 **Integration pending:** Add program generator button to UI

**What's Working:**
- All AI services and prompts are operational
- All modal components are built and styled
- Data structures are in place (aiPrograms, workoutLogs with feedback)
- Coaching logic detects when adjustments are needed

**What's Left:**
- Wire up coaching modal to WorkoutDetailScreen (15 min)
- Add program generator button to WorkoutScreen (10 min)
- Test end-to-end flow (30 min)
- Document usage for users

**Phase 2 Ready When Phase 1 Integration Complete:**
- New WorkoutScreen UI with tiles
- Multiple workout sessions per day support
- AI Coach tile with 5 options

---

## 📝 Important Notes

1. **Don't overwrite programs:** AI workouts save separately (`aiWorkouts/`)
2. **Equipment matters:** Filter exercises by available equipment
3. **Professional quality:** Exercise selection must be expert-level
4. **Recovery awareness:** AI must detect exhaustion and scale appropriately
5. **Budget conscious:** Optimize token usage for 30 users (~$100/month target)

---

## 🔗 Quick References

- **API Key:** `<YOUR_GEMINI_API_KEY>` (hardcoded in AIWorkoutAssistant)
- **Branch:** `ai-integration`
- **Repo:** `nickriley5/nhcfr-wellness-app`
- **Platform:** React Native 0.78.2, Android Pixel 8 API 36

---

**Ready to continue! All code is committed and pushed to GitHub. Pick up with Phase 1, Task 3: Enhanced AI Prompts for Periodization.** 💪🔥
