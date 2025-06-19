// screens/WorkoutDetailScreen.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Toast from '../components/Toast';
import PRCelebration from '../components/PRCelebration';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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


/* ───────── helpers ───────── */
const pretty = (id: string) =>
  id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmtTime = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
const numFromStr = (s?: string) =>
  s ? parseInt(s.match(/\d+/)?.[0] ?? '', 10) : undefined;

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
  type: 'reps' | 'time';
}

interface TimedStatus {
  running: boolean;
  seconds: number;
  done: boolean;
  mode: 'stopwatch' | 'countdown';
  intervalId?: IntervalId;
}

/* ───────── util types ───────── */
type IntervalId = ReturnType<typeof setInterval>;
type WorkoutDetailRoute = RouteProp<RootStackParamList, 'WorkoutDetail'>;

/* ───────── component ───────── */
const WorkoutDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<WorkoutDetailRoute>();
  const { day, weekIdx, dayIdx } = params;

  /* -------- loading -------- */
  const [loading, setLoading] = useState(true);

  /* -------- data -------- */
  const [warmup, setWarmup] = useState<EnrichedExercise[]>([]);
  const [main, setMain] = useState<EnrichedExercise[]>([]);
  const [cooldown, setCooldown] = useState<EnrichedExercise[]>([]);

  /* -------- inputs -------- */
  const [progress, setProgress] = useState<{ reps: string; weight: string }[][]>(
    [],
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

  /* -------- pop-ups -------- */
  const [videoPlaying, setVideoPlaying] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [nextUp, setNextUp] = useState<string | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [prMsgs, setPrMsgs] = useState<string[]>([]);
  const [showPR, setShowPR] = useState(false);

  /* ── enrichment ── */
  const enrich = async (blk: ExerciseBlock): Promise<EnrichedExercise> => {
    const snap = await getDoc(doc(db, 'exercises', blk.id));
    const meta: FirestoreExercise = snap.exists() ? (snap.data() as any) : {};
    return {
      id: blk.id,
      name: meta.name ?? pretty(blk.id),
      videoUri:
        meta.videoUrl && meta.videoUrl.trim()
          ? meta.videoUrl
          : 'https://www.w3schools.com/html/mov_bbb.mp4',
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
          })),
        );

        /* timer state */
        const timerInit: Record<string, TimedStatus[]> = {};
        [...w, ...m, ...c].forEach((ex) => {
          if (ex.type === 'time') {
            timerInit[ex.id] = Array.from({ length: ex.setsCount }).map(
              () => ({
                running: false,
                seconds: 0,
                done: false,
                mode: 'stopwatch',
              }),
            );
          }
        });
        timedRef.current = timerInit;

        /* last-session lookup */
        const uid = auth.currentUser?.uid;
        const last: Record<
          string,
          { reps: string; weight: string }[]
        > = {};
        if (uid) {
          for (const ex of m) {
            const q = await getDocs(
              query(
                collection(db, 'users', uid, 'workoutLogs'),
                orderBy('completedAt', 'desc'),
                limit(5),
              ),
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
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      if (globalTimer.current) clearInterval(globalTimer.current);
    };
  }, [day]);

  /* ── GLOBAL TIMER EFFECT ── */
  useEffect(() => {
    if (workState === 'running') {
      globalTimer.current = setInterval(
        () => setElapsedSec((s) => s + 1),
        1000,
      );
    } else if (globalTimer.current) {
      clearInterval(globalTimer.current);
      globalTimer.current = null;
    }
  }, [workState]);

  /* ── helpers ── */
  const formatDesc = (ex: EnrichedExercise) =>
    ex.type === 'time'
      ? `${ex.setsCount}×${
          ex.repsCount % 60 === 0
            ? `${ex.repsCount / 60} min`
            : `${ex.repsCount} sec`
        }`
      : `${ex.setsCount}×${ex.repsCount} reps`;

  const updateInput = (
    exIdx: number,
    setIdx: number,
    field: 'reps' | 'weight',
    val: string,
  ) =>
    setProgress((p) => {
      const next = [...p];
      next[exIdx][setIdx][field] = val;
      return next;
    });

  const setsDone = (arr: { reps: string; weight: string }[]) =>
    arr.every((s) => s.reps && s.weight);

  const toggleVideo = (id: string) =>
    setVideoPlaying((prev) => (prev === id ? null : id));

  /* ── PER-SET TIMER HANDLERS ── */
  const startTimedSet = (exId: string, setIdx: number, targetSec: number) => {
    const status = timedRef.current[exId]?.[setIdx];
    if (!status || status.running || status.done) return;

    status.running = true;
    status.seconds = status.mode === 'countdown' ? targetSec : 0;

    const id = setInterval(() => {
      if (!status.running) return; // safety

      status.seconds =
        status.mode === 'countdown'
          ? status.seconds - 1
          : status.seconds + 1;

      // kick a re-render
      setElapsedSec((s) => s);

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
    if (!status || status.running) return;
    status.mode = status.mode === 'stopwatch' ? 'countdown' : 'stopwatch';
    setElapsedSec((s) => s); // force paint
  };

  const markTimedSetComplete = (exId: string, setIdx: number) => {
    const exIndex = main.findIndex((e) => e.id === exId);
    if (exIndex === -1) return;
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
    if (!uid) return;

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
      batch.update(
        doc(db, 'users', uid, 'program', 'active'),
        { currentDay: increment(1) },
      );
      await batch.commit();
      await checkAndAdjustRestDays(uid);

      // PR detection (simple)
      const prs: Record<string, number> = {};
      main.forEach((ex, i) =>
        progress[i].forEach((s) => {
          const w = Number(s.weight);
          if (!isNaN(w)) prs[ex.id] = Math.max(prs[ex.id] || 0, w);
        }),
      );
      const newPRs = Object.entries(prs).map(
        ([k, v]) => `${pretty(k)}: ${v} lbs`,
      );

      setShowToast(true);
      if (newPRs.length) {
        setPrMsgs(newPRs);
        setShowPR(true);
      }
      setSummaryVisible(true);
    } catch (e) {
      console.error(e);
      alert('Could not save workout.');
    }
  };

  /* ── SUMMARY CALCS ── */
  const setsPlanned = useMemo(
    () => main.reduce((sum, ex) => sum + ex.setsCount, 0),
    [main],
  );
  const setsCompleted = useMemo(
    () => progress.flat().filter((s) => s.reps || s.weight).length,
    [progress],
  );

  /* ── SECTION COMPONENT ── */
  const Section = ({
    title,
    list,
    trackSets,
  }: {
    title: string;
    list: EnrichedExercise[];
    trackSets?: boolean;
  }) => (
    <>
      <Text style={styles.sectionHeader}>{title}</Text>
      {list.map((ex, exIdx) => {
        const finished = trackSets ? setsDone(progress[exIdx]) : false;
        const last = lastSession[ex.id] ?? [];
        const videoOpen = videoPlaying === ex.id;

        return (
          <View
            key={ex.id}
            style={[styles.card, finished && styles.cardDone]}>
            {/* header */}
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.cardTitle,
                  finished && styles.cardTitleDone,
                ]}>
                {ex.name}
              </Text>
              {trackSets && (
                <Pressable
                  onPress={() =>
                    navigation.navigate('ProgressChart', {
                      exerciseName: ex.id,
                    })
                  }>
                  <Ionicons
                    name="stats-chart"
                    size={20}
                    color="#4fc3f7"
                  />
                </Pressable>
              )}
            </View>

            <Text style={styles.recommend}>
              {formatDesc(ex)} • RPE {ex.rpe}
            </Text>

            {/* video */}
            {!!ex.videoUri && (
              <TouchableOpacity
                onPress={() => toggleVideo(ex.id)}
                style={styles.videoBox}>
                {videoOpen ? (
                  <Video
                    source={{ uri: ex.videoUri }}
                    style={styles.video}
                    controls
                    paused={false}
                    onEnd={() => setVideoPlaying(null)}
                  />
                ) : (
                  <View style={styles.playOverlay}>
                    <Ionicons
                      name="play-circle-outline"
                      size={42}
                      color="#fff"
                    />
                    <Text style={styles.playText}>Play Video</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* sets */}
            {trackSets &&
              Array.from({ length: ex.setsCount }).map((_, si) => {
                if (ex.type === 'time') {
                  const t = timedRef.current[ex.id][si];
                  return (
                    <View key={si} style={styles.setBlock}>
                      <View style={styles.setRow}>
                        <Text style={styles.setLabel}>Set {si + 1}</Text>
                        <Text style={styles.timerDigits}>
                          {fmtTime(
                            t.mode === 'countdown'
                              ? Math.max(0, t.seconds)
                              : t.seconds,
                          )}
                        </Text>
                        <Pressable
                          onPress={() =>
                            startTimedSet(ex.id, si, ex.repsCount)
                          }>
                          <Ionicons
                            name={
                              t.running ? 'pause-circle' : 'play-circle'
                            }
                            size={28}
                            color="#4caf50"
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => toggleMode(ex.id, si)}
                          style={{ marginLeft: 6 }}>
                          <Ionicons
                            name="swap-horizontal"
                            size={22}
                            color="#fff"
                          />
                        </Pressable>
                      </View>
                      {t.done && (
                        <Text style={styles.lastTxt}>Done ✔</Text>
                      )}
                    </View>
                  );
                }

                // normal reps/weight
                const set = progress[exIdx][si];
                return (
                  <View key={si} style={styles.setBlock}>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>Set {si + 1}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="reps"
                        placeholderTextColor="#777"
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={(t) =>
                          updateInput(exIdx, si, 'reps', t)
                        }
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="lbs"
                        placeholderTextColor="#777"
                        keyboardType="numeric"
                        value={set.weight}
                        onChangeText={(t) =>
                          updateInput(exIdx, si, 'weight', t)
                        }
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

  /* -------- render -------- */
  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  /* bar colour */
  const barColor =
    workState === 'running'
      ? '#2e7d32'
      : workState === 'paused'
      ? '#f9a825'
      : workState === 'stopped'
      ? '#c62828'
      : '#333';

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{day.title}</Text>
        {/* WARM-UP – check-off style */}
{/* WARM-UP – check-off style */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Warm-up</Text>

  {warmup.map((ex, idx) => (
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

{/* MAIN WORK – leave this as is */}
<Section title="Exercises" list={main} trackSets />

{/* COOL-DOWN – check-off style */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Cool-down</Text>

  {cooldown.map((ex, idx) => (
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
          disabled={workState === 'running'}>
          <Ionicons
            name="save"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.btnTxt}>Save Workout</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, styles.backBtn]}
          onPress={() => navigation.goBack()}
          disabled={workState === 'running'}>
          <Ionicons
            name="arrow-back"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
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
            <Text style={styles.summaryText}>
              Total time: {fmtTime(elapsedSec)}
            </Text>
            <Text style={styles.summaryText}>
              Sets: {setsCompleted}/{setsPlanned}
            </Text>
            {prMsgs.length > 0 && (
              <>
                <Text
                  style={[
                    styles.summaryText,
                    { marginTop: 8, fontWeight: '700' },
                  ]}>
                  🔥 New PRs:
                </Text>
                {prMsgs.map((m) => (
                  <Text key={m} style={styles.summaryText}>
                    • {m}
                  </Text>
                ))}
              </>
            )}
            <Pressable
              style={[styles.saveBtn, { marginTop: 16 }]}
              onPress={() => setSummaryVisible(false)}>
              <Text style={styles.btnTxt}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* toasts & celebrations */}
      {showToast && (
        <Toast message="Workout saved!" onClose={() => setShowToast(false)} />
      )}
      {nextUp && (
        <Toast message={`Next: ${nextUp}`} onClose={() => setNextUp(null)} />
      )}
      {showPR && (
        <PRCelebration
          visible={showPR}
          messages={prMsgs}
          onClose={() => setShowPR(false)}
        />
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
    marginBottom: 20,
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
  cardDone: { opacity: 0.6, borderColor: '#4caf50', borderWidth: 1 },
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
  /* video */
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: { alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#fff', fontSize: 14, marginTop: 4 },
  /* buttons */
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
  /* timer bar */
  timerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  timerMain: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    fontFamily: 'monospace',
  },
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

});

export default WorkoutDetailScreen;
