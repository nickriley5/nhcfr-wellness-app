// screens/WorkoutDetailScreen.tsx
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from '../components/Toast';
import PRCelebration from '../components/PRCelebration';
import { useNavigation, useRoute, RouteProp, StackActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { checkAndAdjustRestDays } from '../utils/performanceMonitor';
import type { ExerciseBlock } from '../utils/types';
import EnhancedTimerBar from '../components/EnhancedTimerBar';
import CheckOffBlock from '../components/CheckOffBlock';
import VideoToggle from '../components/VideoToggle';
import { resolveExerciseDetails } from '../utils/exerciseUtils';

type WorkoutSet = { reps: string; weight: string };

/* ───────── helpers ───────── */
const pretty = (id: string) => {
  // Try to look up the actual exercise name from the database first
  const exercise = resolveExerciseDetails(id);
  if (exercise && exercise.name) {
    return exercise.name;
  }

  // Fallback to formatting the ID if not found in database
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmtTime = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
const numFromStr = (s?: string) =>
  s ? parseInt(s.match(/\d+/)?.[0] ?? '', 10) : undefined;

/* ───────── util types ───────── */
type IntervalId = ReturnType<typeof setInterval>;
type WorkoutDetailRoute = RouteProp<RootStackParamList, 'WorkoutDetail'>;

/* ───────── types ───────── */
interface FirestoreExercise {
  name?: string;
  videoUrl?: string;
  sets?: number;
  reps?: number;
  repsOrTime?: number;
  type?: 'reps' | 'time';
}

interface EnrichedExercise {
  id: string;
  name: string;
  videoUri: string;
  setsCount: number;
  repsCount: number; // seconds if type === 'time'
  rpe: number;
  type: 'reps' | 'time' | 'amrap' | 'max_effort' | 'competition' | 'special';
}

interface TimedStatus {
  running: boolean;
  seconds: number;
  done: boolean;
  mode: 'stopwatch' | 'countdown';
  intervalId?: IntervalId;
}

/* ───────── child component ───────── */
interface MainExercisesSectionProps {
  title: string;
  list: EnrichedExercise[];
  progress: WorkoutSet[][];
  lastSession: Record<string, { reps: string; weight: string }[]>;
  timedRef: React.MutableRefObject<Record<string, TimedStatus[]>>;
  formatDesc: (ex: EnrichedExercise) => string;
  startTimedSet: (exId: string, setIdx: number, targetSec: number) => void;
  toggleMode: (exId: string, setIdx: number) => void;
  updateInput: (
    exIdx: number,
    setIdx: number,
    field: 'reps' | 'weight',
    val: string
  ) => void;
  onPressChart: (exerciseId: string) => void;
}

const MainExercisesSection: React.FC<MainExercisesSectionProps> = ({
  title,
  list,
  progress,
  lastSession,
  timedRef,
  formatDesc,
  startTimedSet,
  toggleMode,
  updateInput,
  onPressChart,
}) => {
  return (
    <>
      <Text style={styles.sectionHeader}>{title}</Text>

      {list.map((ex, exIdx) => {
        const isComplete = progress[exIdx]?.every((s) => s.reps && s.weight);
        const last = lastSession[ex.id] ?? [];

        return (
          <View key={ex.id} style={[styles.card, isComplete && styles.cardDone]}>
            {/* header */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, isComplete && styles.cardTitleDone]}>
                {ex.name}
              </Text>

              <Pressable onPress={() => onPressChart(ex.id)}>
                <Ionicons name="stats-chart" size={20} color="#4fc3f7" />
              </Pressable>

              {/* ○ / ✔︎ toggle */}
              <Pressable
                onPress={() => {
                  const next = progress.map((sets, i) =>
                    i === exIdx
                      ? sets.map((_s) =>
                          isComplete ? { reps: '', weight: '' } : { reps: '✓', weight: '✓' }
                        )
                      : sets
                  );
                  next[exIdx].forEach((s, j) => {
                    updateInput(exIdx, j, 'reps', s.reps);
                    updateInput(exIdx, j, 'weight', s.weight);
                  });
                }}
              >
                <Ionicons
                  name={isComplete ? 'checkmark-circle' : 'ellipse-outline'}
                  size={28}
                  color={isComplete ? '#66bb6a' : '#bbb'}
                />
              </Pressable>
            </View>

            <Text style={styles.recommend}>
              {formatDesc(ex)} • RPE {ex.rpe}
            </Text>

            {/* video */}
            {!!ex.videoUri && <VideoToggle uri={ex.videoUri} />}

            {/* sets */}
            {Array.from({ length: ex.setsCount }).map((_, si) => {
              if (ex.type === 'time') {
                const t = timedRef.current[ex.id][si];
                return (
                  <View key={si} style={styles.setBlock}>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>Set {si + 1}</Text>
                      <Text style={styles.timerDigits}>
                        {fmtTime(t.mode === 'countdown' ? Math.max(0, t.seconds) : t.seconds)}
                      </Text>
                      <Pressable onPress={() => startTimedSet(ex.id, si, ex.repsCount)}>
                        <Ionicons
                          name={t.running ? 'pause-circle' : 'play-circle'}
                          size={28}
                          color="#4caf50"
                        />
                      </Pressable>
                      <Pressable onPress={() => toggleMode(ex.id, si)} style={styles.ml6}>
                        <Ionicons name="swap-horizontal" size={22} color="#fff" />
                      </Pressable>
                    </View>
                    {t.done && <Text style={styles.lastTxt}>Done ✔</Text>}
                  </View>
                );
              }

              if (ex.type === 'amrap') {
                const t = timedRef.current[ex.id][si];
                const set = progress[exIdx][si];
                return (
                  <View key={si} style={styles.setBlock}>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>AMRAP {ex.repsCount / 60} min</Text>
                      <Text style={styles.timerDigits}>
                        {fmtTime(t.mode === 'countdown' ? Math.max(0, t.seconds) : t.seconds)}
                      </Text>
                      <Pressable onPress={() => startTimedSet(ex.id, si, ex.repsCount)}>
                        <Ionicons
                          name={t.running ? 'pause-circle' : 'play-circle'}
                          size={28}
                          color="#4caf50"
                        />
                      </Pressable>
                    </View>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>Rounds</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="rounds"
                        placeholderTextColor="#777"
                        keyboardType="number-pad"
                        editable={!isComplete}
                        value={String(set.reps ?? '')}
                        onChangeText={(text) => updateInput(exIdx, si, 'reps', text)}
                      />
                    </View>
                    {t.done && <Text style={styles.lastTxt}>AMRAP Complete ✔</Text>}
                  </View>
                );
              }

              if (ex.type === 'max_effort' || ex.type === 'competition' || ex.type === 'special') {
                const set = progress[exIdx][si];
                return (
                  <View key={si} style={styles.setBlock}>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>Performance</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="result"
                        placeholderTextColor="#777"
                        keyboardType="decimal-pad"
                        editable={!isComplete}
                        value={String(set.reps ?? '')}
                        onChangeText={(text) => updateInput(exIdx, si, 'reps', text)}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="time/weight"
                        placeholderTextColor="#777"
                        keyboardType="decimal-pad"
                        editable={!isComplete}
                        value={String(set.weight ?? '')}
                        onChangeText={(text) => updateInput(exIdx, si, 'weight', text)}
                      />
                    </View>
                    {last[si] && (
                      <Text style={styles.lastTxt}>
                        Last: {last[si].reps} @ {last[si].weight}
                      </Text>
                    )}
                  </View>
                );
              }

              // regular reps / weight
              const set = progress[exIdx][si];
              return (
                <View key={si} style={styles.setBlock}>
                  <View style={styles.setRow}>
                    <Text style={styles.setLabel}>Set {si + 1}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="reps"
                      placeholderTextColor="#777"
                      keyboardType="number-pad"
                      editable={!isComplete}
                      value={String(set.reps ?? '')}
                      onChangeText={(text) => updateInput(exIdx, si, 'reps', text)}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="lbs"
                      placeholderTextColor="#777"
                      keyboardType="decimal-pad"
                      editable={!isComplete}
                      value={String(set.weight ?? '')}
                      onChangeText={(text) => updateInput(exIdx, si, 'weight', text)}
                    />
                  </View>
                  {last[si] && (
                    <Text style={styles.lastTxt}>
                      Last: {last[si].reps} reps @ {last[si].weight} lbs
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </>
  );
};

/* ───────── component ───────── */
const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<WorkoutDetailRoute>();
  const { day, weekIdx, dayIdx } = params;

  /* -------- loading -------- */
  const [loading, setLoading] = useState(true);

  /* -------- data -------- */
  const [warmup, setWarmup] = useState<EnrichedExercise[]>([]);
  const [main, setMain] = useState<EnrichedExercise[]>([]);
  const [cooldown, setCooldown] = useState<EnrichedExercise[]>([]);

  function navigateToWorkoutRoot() {
  // hop to the Workout tab if you use tabs
  navigation.getParent?.()?.navigate?.('Workout');
  // then clear this stack back to its root so Adapt/Detail aren’t left behind
  navigation.dispatch(StackActions.popToTop());
}

  /* -------- inputs -------- */
  const [progress, setProgress] = useState<WorkoutSet[][]>(() =>
    day.exercises.map((blk: ExerciseBlock) =>
      Array.from({ length: blk.sets ?? 1 }).map(() => ({ reps: '', weight: '' } as WorkoutSet))
    )
  );

  const [lastSession, setLastSession] = useState<
    Record<string, { reps: string; weight: string }[]>
  >({});

  /* -------- timers -------- */
  const [elapsedSec, setElapsedSec] = useState(0);
  const [workState, setWorkState] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
  const globalTimer = useRef<IntervalId | null>(null);

  // per-exercise timers  ➜  { exerciseId: TimedStatus[] }
  const timedRef = useRef<Record<string, TimedStatus[]>>({});

  /* -------- toasts & pop-ups -------- */
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nextUp, setNextUp] = useState<string | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [prMsgs, setPrMsgs] = useState<string[]>([]);
  const [showPR, setShowPR] = useState(false);

  /* ---- header: Adapt button ---- */
  // Move headerRight button out of render to avoid inline component definition
  const HeaderRightButton = React.useCallback(() => (
    <Pressable
      onPress={() => navigation.navigate('AdaptWorkout')}
      disabled={workState === 'running'}
      style={({ pressed }) => ({
        opacity: pressed || workState === 'running' ? 0.6 : 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
      })}
      accessibilityLabel="Adapt workout"
    >
      <Ionicons name="swap-horizontal" size={22} color="#fff" />
    </Pressable>
  ), [navigation, workState]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: HeaderRightButton,
    });
  }, [navigation, workState, HeaderRightButton]);

  /* ── enrichment ── */
  const enrich = async (blk: ExerciseBlock): Promise<EnrichedExercise> => {
    // Map human-readable IDs to actual hexadecimal IDs in database
    const exerciseIdMap: Record<string, string> = {
      'banded_face_pull': '609e6c422c9349a885fa69c2dd2141f7', // Banded Face Pulls
      'glute_bridge': 'd68572790c034f40afbd39433926bc96', // Glute Bridge
      'worlds_greatest_stretch': '39292bf9cd8d403e9279d4c9bb8497c9', // World's Greatest Stretch
      // Add more mappings as needed - we'll get the video URLs from Firebase now!
    };

    // Use mapped ID if available, otherwise use the original ID
    const actualId = exerciseIdMap[blk.id] || blk.id;

    const snap = await getDoc(doc(db, 'exercises', actualId));
    const meta: FirestoreExercise = snap.exists() ? (snap.data() as any) : {};

    // Check for special workout types
    const repsText = blk.repsOrDuration.toLowerCase();
    const isAMRAP = repsText.includes('amrap');
    const isMaxEffort = repsText.includes('max') && (repsText.includes('distance') || repsText.includes('reps') || repsText.includes('flips') || repsText.includes('flights'));
    const isCompetition = repsText.includes('competition') || repsText.includes('test') || repsText.includes('challenge');

    // Fallback video URL - try to provide exercise-specific videos
    let fallbackVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // default fallback

    // Map common warm-up/cool-down exercises to appropriate videos
    const exerciseVideoMap: Record<string, string> = {
      'banded_face_pull': 'https://www.youtube.com/watch?v=HSoHeSjvIdY', // Face Pull demonstration
      'wall_slide': 'https://www.youtube.com/watch?v=d6V2Exzb324', // Wall Slide mobility
      'arm_circle_pvc_pass': 'https://www.youtube.com/watch?v=qvqLMgOhFFE', // Arm circles
      'glute_bridge': 'https://firebasestorage.googleapis.com/v0/b/firefighter-wellness-app.firebasestorage.app/o/glute-bridge.mp4?alt=media', // Use existing if available
      'scap_pushup': 'https://www.youtube.com/watch?v=akgQbxhrhOc', // Scapular push-ups
      'worlds_greatest_stretch': 'https://www.youtube.com/watch?v=EKckKcZEK1E', // World's greatest stretch
      'hip_flexor_stretch': 'https://www.youtube.com/watch?v=UGEpQ1BRx-4', // Hip flexor stretch
      'hamstring_stretch_floor': 'https://www.youtube.com/watch?v=5f7bJg98TgI', // Hamstring stretch
      'box_breathing': 'https://www.youtube.com/watch?v=tEmt1Znux58', // Box breathing
      'band_shoulder_stretch': 'https://www.youtube.com/watch?v=HSoHeSjvIdY', // Band shoulder stretch
      'wall_pec_stretch': 'https://www.youtube.com/watch?v=dOJy_qGNqWg', // Wall pec stretch
      'incline_walk': 'https://www.youtube.com/watch?v=mrpzaCJGMQs', // Incline walking
    };

    if (exerciseVideoMap[blk.id]) {
      fallbackVideoUrl = exerciseVideoMap[blk.id];
    }

    // For special workouts, use custom logic
    if (isAMRAP || isMaxEffort || isCompetition) {
      return {
        id: blk.id,
        name: meta.name ?? pretty(blk.id),
        videoUri:
          meta.videoUrl && meta.videoUrl.trim()
            ? meta.videoUrl
            : fallbackVideoUrl,
        setsCount: 1, // Special workouts are typically single efforts
        repsCount: isAMRAP ? (numFromStr(blk.repsOrDuration) ?? 1) * 60 : 1, // AMRAP time in seconds, others just 1
        rpe: blk.rpe,
        type: isAMRAP ? 'amrap' : isMaxEffort ? 'max_effort' : isCompetition ? 'competition' : 'special',
      };
    }

    // Original logic for normal exercises
    return {
      id: blk.id,
      name: meta.name ?? pretty(blk.id),
      videoUri:
        meta.videoUrl && meta.videoUrl.trim()
          ? meta.videoUrl
          : fallbackVideoUrl,
      setsCount: meta.sets ?? blk.sets ?? 3,
      repsCount:
        meta.reps ??
        (blk.repsOrDuration.toLowerCase().includes('min')
          ? (numFromStr(blk.repsOrDuration) ?? 1) * 60
          : numFromStr(blk.repsOrDuration) ?? 8),
      rpe: blk.rpe,
      type:
        meta.type ??
        (blk.repsOrDuration.toLowerCase().includes('sec') ||
        blk.repsOrDuration.toLowerCase().includes('min')
          ? 'time'
          : 'reps'),
    };
  };

  /* ── fetch / initialise ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [w, m, c] = await Promise.all([
          Promise.all(day.warmup.map(enrich)),
          Promise.all(day.exercises.map(enrich)),
          Promise.all(day.cooldown.map(enrich)),
        ]);

        /* progress */
        const progInit = m.map((ex) =>
          Array.from({ length: ex.setsCount }).map(() => ({
            reps: '',
            weight: '',
          }))
        );

        /* timer state */
        const timerInit: Record<string, TimedStatus[]> = {};
        [...w, ...m, ...c].forEach((ex) => {
          if (ex.type === 'time' || ex.type === 'amrap') {
            timerInit[ex.id] = Array.from({ length: ex.setsCount }).map(() => ({
              running: false,
              seconds: 0,
              done: false,
              mode: ex.type === 'amrap' ? 'countdown' : 'stopwatch',
            }));
          }
        });
        timedRef.current = timerInit;

        /* last-session lookup */
        const uid = auth.currentUser?.uid;
        const last: Record<string, { reps: string; weight: string }[]> = {};
        if (uid) {
          for (const ex of m) {
            const q = await getDocs(
              query(
                collection(db, 'users', uid, 'workoutLogs'),
                orderBy('completedAt', 'desc'),
                limit(5)
              )
            );
            for (const d of q.docs) {
              const data: any = d.data();
              const hit = data.exercises.find((e: any) => e.name === ex.id);
              if (hit) {
                last[ex.id] = hit.sets;
                break;
              }
            }
          }
        }

        if (alive) {
          setWarmup(w);
          setMain(m);
          setCooldown(c);
          setProgress(progInit);
          setLastSession(last);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (alive) {setLoading(false);}
      }
    })();
    return () => {
      alive = false;
      if (globalTimer.current) {clearInterval(globalTimer.current);}
    };
  }, [day]);

  /* ── GLOBAL TIMER EFFECT ── */
  useEffect(() => {
    if (workState === 'running') {
      globalTimer.current = setInterval(() => setElapsedSec((prev) => prev + 1), 1000);
    } else if (globalTimer.current) {
      clearInterval(globalTimer.current);
      globalTimer.current = null;
    }
  }, [workState]);

  /* ── helpers ── */
  const formatDesc = (ex: EnrichedExercise) => {
    if (ex.type === 'amrap') {
      return `${ex.repsCount / 60} min AMRAP`;
    } else if (ex.type === 'max_effort') {
      return 'Max Effort Challenge';
    } else if (ex.type === 'competition') {
      return 'Competition Test';
    } else if (ex.type === 'special') {
      return 'Special Challenge';
    } else if (ex.type === 'time') {
      return `${ex.setsCount}×${
        ex.repsCount % 60 === 0 ? `${ex.repsCount / 60} min` : `${ex.repsCount} sec`
      }`;
    } else {
      return `${ex.setsCount}×${ex.repsCount} reps`;
    }
  };

  const updateInput = (
    exIdx: number,
    setIdx: number,
    field: 'reps' | 'weight',
    val: string
  ) => {
    setProgress((prev) =>
      prev.map((exerciseSets, i) =>
        i === exIdx
          ? exerciseSets.map((set, j) => (j === setIdx ? { ...set, [field]: val } : set))
          : exerciseSets
      )
    );
  };

  /* ── PER-SET TIMER HANDLERS ── */
  const startTimedSet = (exId: string, setIdx: number, targetSec: number) => {
    const status = timedRef.current[exId]?.[setIdx];
    if (!status || status.running || status.done) {return;}

    status.running = true;
    status.seconds = status.mode === 'countdown' ? targetSec : 0;

    const id = setInterval(() => {
      if (!status.running) {return;} // safety

      status.seconds = status.mode === 'countdown' ? status.seconds - 1 : status.seconds + 1;

      // kick a re-render
      setElapsedSec((_prev) => _prev);

      if (status.mode === 'countdown' && status.seconds <= 0) {
        clearInterval(status.intervalId as IntervalId);
        status.running = false;
        status.done = true;
        markTimedSetComplete(exId, setIdx);
      }
    }, 1000) as IntervalId;

    status.intervalId = id;
  };

  const toggleMode = (exId: string, setIdx: number) => {
    const status = timedRef.current[exId]?.[setIdx];
    if (!status || status.running) {return;}
    status.mode = status.mode === 'stopwatch' ? 'countdown' : 'stopwatch';
    setElapsedSec((_prev) => _prev); // force paint
  };

  const markTimedSetComplete = (exId: string, setIdx: number) => {
    const exIndex = main.findIndex((e) => e.id === exId);
    if (exIndex === -1) {return;}
    setProgress((p) => {
      const next = [...p];
      next[exIndex][setIdx] = { reps: '✓', weight: '✓' };
      return next;
    });

    // Toast next-up
    const flat = [...warmup, ...main, ...cooldown];
    const curIdx = flat.findIndex((e) => e.id === exId);
    if (curIdx !== -1 && curIdx + 1 < flat.length) {
      setNextUp(flat[curIdx + 1].name);
      setTimeout(() => setNextUp(null), 3500);
    }
  };

  /* ── SAVE ── */
  const saveWorkout = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    const logId = Date.now().toString();
    const payload = main.map((ex, i) => ({
      name: ex.id,
      sets: progress[i].map((s) => ({
        reps: s.reps === '✓' ? ex.repsCount.toString() : s.reps,
        weight: s.weight === '✓' ? '0' : s.weight,
      })),
    }));

    const log = {
      dayTitle: day.title,
      weekIdx,
      dayIdx,
      completedAt: Timestamp.now(),
      elapsedSec,
      exercises: payload,
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'workoutLogs', logId), log);
      batch.update(doc(db, 'users', uid, 'program', 'active'), { 'metadata.currentDay': increment(1) });
      await batch.commit();
      await checkAndAdjustRestDays(uid);

      // PR detection (simple)
      const prs: Record<string, number> = {};
      main.forEach((ex, i) =>
        progress[i].forEach((s) => {
          const w = Number(s.weight);
          if (!isNaN(w)) {prs[ex.id] = Math.max(prs[ex.id] || 0, w);}
        })
      );
      const newPRs = Object.entries(prs).map(([k, v]) => `${pretty(k)}: ${v} lbs`);

      setToastMessage('Workout saved!');
      if (newPRs.length) {
        setPrMsgs(newPRs);
        setShowPR(true);
      }
      setSummaryVisible(true);
    } catch (e) {
      console.error(e);
      setToastMessage('Could not save workout.');
    }
  };

  /* ── SUMMARY CALCS ── */
  const setsPlanned = useMemo(
    () => main.reduce((sum, ex) => sum + ex.setsCount, 0),
    [main]
  );
  const setsCompleted = useMemo(
    () => progress.flat().filter((s) => s.reps || s.weight).length,
    [progress]
  );

  /* -------- render -------- */
  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{day.title}</Text>

        {/* Adapt CTA */}
        <Pressable
          style={styles.adaptBtn}
          onPress={() => navigation.navigate('AdaptWorkout')}
          disabled={workState === 'running'}
        >
          <Ionicons name="swap-horizontal" size={20} color="#fff" style={styles.iconRight} />
          <Text style={styles.btnTxt}>Adapt Today’s Workout</Text>
        </Pressable>

        {/* WARM-UP – check-off style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warm-up</Text>
          {warmup.map((ex) => (
            <CheckOffBlock
              key={ex.id}
              id={ex.id}
              name={ex.name}
              sets={ex.setsCount}
              repsOrDuration={formatDesc(ex).split('×')[1]}
              videoUri={ex.videoUri}
              isTimed={ex.type === 'time'}
              seconds={ex.repsCount}
            />
          ))}
        </View>

        {/* MAIN WORK */}
        <MainExercisesSection
          title="Exercises"
          list={main}
          progress={progress}
          lastSession={lastSession}
          timedRef={timedRef}
          formatDesc={formatDesc}
          startTimedSet={startTimedSet}
          toggleMode={toggleMode}
          updateInput={updateInput}
          onPressChart={(exerciseId) =>
            navigation.navigate('ProgressChart', { exerciseName: exerciseId })
          }
        />

        {/* COOL-DOWN – check-off style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cool-down</Text>
          {cooldown.map((ex) => (
            <CheckOffBlock
              key={ex.id}
              id={ex.id}
              name={ex.name}
              sets={ex.setsCount}
              repsOrDuration={formatDesc(ex).split('×')[1]}
              videoUri={ex.videoUri}
              isTimed={ex.type === 'time'}
              seconds={ex.repsCount}
            />
          ))}
        </View>

        <Pressable
          style={styles.saveBtn}
          onPress={saveWorkout}
          disabled={workState === 'running'}
        >
          <Ionicons name="save" size={20} color="#fff" style={styles.iconRight} />
          <Text style={styles.btnTxt}>Save Workout</Text>
        </Pressable>

        <Pressable
          style={[styles.saveBtn, styles.backBtn]}
          onPress={() => navigation.goBack()}
          disabled={workState === 'running'}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" style={styles.iconRight} />
          <Text style={styles.btnTxt}>Back</Text>
        </Pressable>
      </ScrollView>

      <EnhancedTimerBar
        seconds={elapsedSec}
        state={workState}
        onStart={() => setWorkState('running')}
        onPause={() => setWorkState('paused')}
        onStop={() => setWorkState('stopped')}
      />

      {/* SUMMARY MODAL */}
      <Modal visible={summaryVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Session Complete</Text>
            <Text style={styles.summaryText}>Total time: {fmtTime(elapsedSec)}</Text>
            <Text style={styles.summaryText}>Sets: {setsCompleted}/{setsPlanned}</Text>
            {prMsgs.length > 0 && (
              <>
                <Text style={[styles.summaryText, styles.summarySubheading]}>🔥 New PRs:</Text>
                {prMsgs.map((m) => (
                  <Text key={m} style={styles.summaryText}>
                    • {m}
                  </Text>
                ))}
              </>
            )}
            <Pressable style={[styles.saveBtn, styles.mt16]}
            onPress={() => {
    setSummaryVisible(false);
    navigateToWorkoutRoot(); // Navigate when summary is closed
  }}
>
              <Text style={styles.btnTxt}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* toasts & celebrations */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      {nextUp && <Toast message={`Next: ${nextUp}`} onClose={() => setNextUp(null)} />}
      {showPR && (
        <PRCelebration visible={showPR} messages={prMsgs} onClose={() => setShowPR(false)} />
      )}
    </LinearGradient>
  );
};

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 120 }, // leave space for timer bar
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
    marginTop: 18,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#d32f2f',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardDone: { opacity: 1, borderColor: '#4caf50', borderWidth: 1, backgroundColor: '#2e7d32' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#aaa' },
  recommend: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  /* sets UI */
  setBlock: { marginBottom: 6 },
  setRow: { flexDirection: 'row', alignItems: 'center' },
  setLabel: { color: '#ccc', width: 60, marginRight: 8 },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 8,
    borderRadius: 6,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 6,
  },
  lastTxt: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 60,
    marginBottom: 4,
  },
  timerDigits: {
    color: '#fff',
    fontVariant: ['tabular-nums'],
    marginRight: 8,
    width: 60,
    textAlign: 'center',
  },
  /* buttons */
  adaptBtn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1.5,
    borderColor: '#4fc3f7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1.5,
    borderColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 24,
    justifyContent: 'center',
  },
  backBtn: { marginTop: 12, borderColor: '#888' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  /* summary */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryBox: {
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius: 12,
    width: '80%',
  },
  summaryTitle: {
    fontSize: 20,
    color: '#d32f2f',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryText: { color: '#fff', textAlign: 'center', marginVertical: 2 },

  /* sections */
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },

  /* extracted replacements for inline styles */
  ml6: { marginLeft: 6 },
  flex1: { flex: 1 },
  iconRight: { marginRight: 8 },
  summarySubheading: { marginTop: 8, fontWeight: '700' },
  mt16: { marginTop: 16 },
});

export default WorkoutDetailScreen;
