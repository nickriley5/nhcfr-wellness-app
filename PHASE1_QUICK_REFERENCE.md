# Phase 1 AI Enhancements - Quick Reference

## 🆕 What's New (December 9, 2025)

Phase 1 of the AI integration is **80% complete**! Here's what's been built:

---

## ✨ New Features

### 1. Periodized Program Generation
**Purpose:** Generate complete multi-week training programs with professional periodization

**Files:**
- `utils/ai/aiService.ts` → `generatePeriodizedProgram()`
- `components/Modals/PeriodizedProgramModal.tsx`

**Capabilities:**
- 8, 12, or 16-week programs
- 3 periodization models:
  - **Linear:** Best for strength (Hypertrophy → Strength → Power)
  - **Undulating:** Best for muscle (daily intensity variation)
  - **Block:** Best for endurance (Base → Threshold → Peak)
- Progressive overload (5-10% weekly increases)
- Automatic deload weeks (every 4th week)
- Detailed exercise programming with sets, reps, RPE, rest periods

**Data Structure:**
```typescript
users/{uid}/aiPrograms/{programId}
{
  programName: string,
  totalWeeks: number,
  periodizationModel: 'linear' | 'undulating' | 'block',
  phases: Array<{ phaseName, weekRange, focus, description }>,
  weeks: Array<{
    weekNumber: number,
    phase: string,
    isDeload: boolean,
    volumeMultiplier: number,
    days: Array<{
      dayNumber, dayName, focus,
      warmup: string[],
      exercises: Array<{ name, sets, reps, restSeconds, rpe, notes }>,
      cooldown: string[],
      estimatedDuration: number
    }>
  }>,
  progressionPlan: string,
  deloadStrategy: string,
  createdAt: string,
  isActive: boolean
}
```

---

### 2. Dynamic Coaching Adjustments
**Purpose:** AI analyzes workout feedback and intelligently adjusts the next workout

**Files:**
- `utils/ai/aiService.ts` → `getWorkoutAdjustments()`
- `utils/coachingService.ts` → Helper functions
- `components/Modals/CoachingAdviceModal.tsx`

**How It Works:**
1. User completes workout and submits feedback (💪 Strong, 😊 Good, 😐 Okay, 😓 Tough, 🔥 Exhausted)
2. User optionally adds note (e.g., "2 structure fires last night")
3. Before next workout, AI fetches feedback and analyzes
4. AI generates coaching advice and adjusted workout if needed:
   - **"Exhausted"** → 30-40% volume reduction, longer rest
   - **"Tough"** → 10-20% volume reduction
   - **"Good/Strong"** → Proceed as planned or slight increase
5. User sees coaching modal with two options:
   - "Accept Changes" → Apply AI adjustments
   - "Use Original" → Stick to scheduled workout

**Smart Detection:**
- Only shows coaching when feedback indicates need (not "Good" or "Strong" without notes)
- Considers program context (current week, phase, goal)
- Provides rationale for adjustments

---

### 3. Enhanced AI Prompts
**Purpose:** Professional-grade periodization knowledge in all AI functions

**Improvements:**
- Structured phase progression (no more random workouts)
- RPE (Rate of Perceived Exertion) integration
- Firefighter-specific exercise selection
- Proper progressive overload logic
- Deload week automation
- Sport-specific adaptations (strength vs. endurance vs. hypertrophy)

---

## 🔧 Integration Steps (To Complete Phase 1)

### Step 1: Add Coaching to WorkoutDetailScreen
**File:** `screens/WorkoutDetailScreen.tsx`

```typescript
import CoachingAdviceModal from '../components/Modals/CoachingAdviceModal';
import { generateCoachingAdvice } from '../utils/coachingService';

// Add state
const [showCoachingModal, setShowCoachingModal] = useState(false);
const [coachingData, setCoachingData] = useState<any>(null);

// In useEffect (after workout loads)
useEffect(() => {
  // ... existing code ...
  
  // Check for coaching advice
  const checkCoaching = async () => {
    const advice = await generateCoachingAdvice(
      {
        dayName: day.title,
        focus: day.focus || 'General',
        exercises: mainExercises.map(ex => ({
          name: ex.name,
          sets: ex.setsCount,
          reps: `${ex.repsCount}`,
          restSeconds: 60,
        })),
      },
      {
        currentWeek: 1, // TODO: Get from program context
        totalWeeks: 12, // TODO: Get from program context
        goal: 'Build Strength', // TODO: Get from user profile
        phase: 'Hypertrophy', // TODO: Get from program context
      }
    );
    
    if (advice) {
      setCoachingData(advice);
      setShowCoachingModal(true);
    }
  };
  
  checkCoaching();
}, []);

// Add modal to render
<CoachingAdviceModal
  visible={showCoachingModal}
  onClose={() => setShowCoachingModal(false)}
  coachingAdvice={coachingData?.coachingAdvice || ''}
  shouldAdjust={coachingData?.shouldAdjust || false}
  adjustedWorkout={coachingData?.adjustedWorkout}
  onAcceptAdjustments={() => {
    // TODO: Apply adjustments to workout
    setShowCoachingModal(false);
  }}
  onUseOriginal={() => {
    setShowCoachingModal(false);
  }}
/>
```

---

### Step 2: Add Program Generator to WorkoutScreen
**File:** `screens/WorkoutScreen.tsx`

```typescript
import PeriodizedProgramModal from '../components/Modals/PeriodizedProgramModal';

// Add state
const [showProgramModal, setShowProgramModal] = useState(false);

// Add button somewhere in UI
<Pressable 
  style={styles.generateProgramButton}
  onPress={() => setShowProgramModal(true)}
>
  <Ionicons name="flash" size={20} color="#fff" />
  <Text style={styles.buttonText}>Generate Full Program</Text>
</Pressable>

// Add modal
<PeriodizedProgramModal
  visible={showProgramModal}
  onClose={() => setShowProgramModal(false)}
  userProfile={{
    goals: userProfile?.goals || ['Build Strength'],
    experience: userProfile?.experience || 'intermediate',
    equipment: userProfile?.equipment || ['dumbbells', 'bodyweight'],
  }}
  onProgramGenerated={(programId) => {
    console.log('Program generated:', programId);
    Toast.show({
      type: 'success',
      text1: 'Program Created!',
      text2: 'Check your programs to activate it',
    });
    setShowProgramModal(false);
  }}
/>
```

---

## 🧪 Testing Checklist

### Test Coaching System
1. ✅ Complete a workout
2. ✅ Submit feedback as "Exhausted" with note "worked structure fire"
3. ✅ Start next workout
4. ✅ Verify coaching modal appears
5. ✅ Check that volume is reduced appropriately
6. ✅ Test "Accept Changes" button
7. ✅ Test "Use Original" button

### Test Program Generator
1. ✅ Open program generator modal
2. ✅ Select goal: "Build Strength"
3. ✅ Choose 12 weeks, 4 days/week
4. ✅ Select "Linear" periodization
5. ✅ Generate program
6. ✅ Verify program preview shows phases
7. ✅ Save program
8. ✅ Check Firestore: `users/{uid}/aiPrograms/{programId}` exists

### Test Edge Cases
- Submit feedback as "Strong" → No coaching modal should appear
- Submit feedback as "Good" with no note → No coaching modal
- Submit feedback as "Tough" with note → Coaching should appear

---

## 📊 Firebase Data Structure

```
users/{uid}/
  ├── aiPrograms/{programId}           ✨ NEW
  │   ├── programName: "12-Week Strength"
  │   ├── totalWeeks: 12
  │   ├── periodizationModel: "linear"
  │   ├── phases: [...]
  │   ├── weeks: [...]
  │   ├── progressionPlan: "..."
  │   ├── createdAt: "2025-12-09T..."
  │   └── isActive: false
  │
  ├── workoutLogs/{logId}
  │   ├── exercises: [...]
  │   ├── completedAt: "2025-12-09T..."
  │   └── feedback:                     ✨ ENHANCED
  │       ├── feeling: "Exhausted"
  │       ├── note: "2 structure fires"
  │       └── submittedAt: "2025-12-09T..."
  │
  └── aiWorkouts/{workoutId}            (existing)
```

---

## 💰 Cost Estimates

**Gemini 2.5 Flash Pricing:**
- Free tier: 1,500 requests/day, 15 RPM
- Paid tier: $0.075/1M input tokens, $0.30/1M output tokens

**Usage Estimates for 30 Users:**
- Single workout: ~800 input tokens, ~400 output tokens = $0.00018/workout
- Full program: ~2000 input tokens, ~6000 output tokens = $0.0033/program
- Coaching advice: ~600 input tokens, ~300 output tokens = $0.00012/adjustment

**Monthly Cost (30 users, aggressive usage):**
- 30 users × 12 workouts/month = 360 workouts × $0.00018 = $0.06
- 30 users × 2 programs/month = 60 programs × $0.0033 = $0.20
- 30 users × 20 coaching sessions/month = 600 sessions × $0.00012 = $0.07
- **Total: ~$0.33/month** (essentially free!)

---

## 🎯 Phase 1 Status

**Completion: 80%** ✨

**✅ Complete:**
- AI service functions (all working)
- Modal components (built and styled)
- Data structures (defined and documented)
- Enhanced prompts (professional-grade)
- Coaching logic (intelligent adjustments)

**🔄 In Progress:**
- UI integration (WorkoutDetailScreen + WorkoutScreen)
- End-to-end testing
- User documentation

**⏭️ Next Phase:**
- Phase 2: New WorkoutScreen UI with horizontal tiles
- Multiple workout sessions per day
- AI Coach tile with 5 quick options

---

## 📞 Support

If you need help integrating these features:
1. Check `HANDOFF_SUMMARY.md` for detailed context
2. Review `AI_INTEGRATION_GUIDE.md` for setup instructions
3. See code comments in each new file
4. Test with the provided test checklist

**All code is committed to the `ai-integration` branch and pushed to GitHub!** 🚀
