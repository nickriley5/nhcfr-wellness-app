// screens/AdaptWorkoutScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import Toast from '../components/Toast';
import VideoToggle from '../components/VideoToggle';
import { getExerciseVideoData } from '../utils/exerciseVideoMap';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ---------- types ---------- */
type ExCategory = 'strength' | 'mobility' | 'conditioning' | 'skill' | 'unknown';

type ExerciseCard = {
  id: string;
  name: string;
  tags: string[];
  focusArea?: string;
  videoUri?: string;
  thumbnailUri?: string;

  // signals for relevance
  pattern?: string;      // e.g. 'vertical_pull' | 'elbow_flexion'
  muscles?: string[];    // e.g. ['lats','biceps']
  equipKey?: string;     // canonical equipment key (e.g. 'pullup_bar','cable','db')
  equipment?: string;    // display string
  category?: ExCategory; // strength/mobility/conditioning/skill
};

const fallbackVideos: Record<string, string> = {
  Pushups: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Bent-over Rows': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Overhead Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Air Squat': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const pretty = (id: string) =>
  id?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Exercise';

/* ---------------- inference helpers ---------------- */
const norm = (s?: string) => (s || '').toLowerCase();

const equipKeyFrom = (equip?: string | string[], nameOrTags = ''): string => {
  const s = Array.isArray(equip) ? equip.join(' ') : (equip || '') + ' ' + nameOrTags;
  const t = norm(s);
  if (t.includes('ez')) {return 'ez_bar';}
  if (t.includes('barbell')) {return 'barbell';}
  if (t.includes('dumbbell') || t.includes('db')) {return 'db';}
  if (t.includes('kettlebell') || t.includes('kb')) {return 'kb';}
  if (t.includes('cable') || t.includes('lat pull')) {return 'cable';}
  if (t.includes('machine')) {return 'machine';}
  if (t.includes('ring')) {return 'rings';}
  if (t.includes('band')) {return 'band';}
  if (t.includes('pull-up') || t.includes('pullup') || t.includes('chin')) {return 'pullup_bar';}
  if (t.includes('sled')) {return 'sled';}
  if (t.includes('trap bar') || t.includes('hex')) {return 'trapbar';}
  if (t.includes('smith')) {return 'smith';}
  if (t.includes('bodyweight') || t.includes('no equipment') || t.includes('air')) {return 'none';}
  return (Array.isArray(equip) ? equip[0] : equip)
    ? norm(Array.isArray(equip) ? equip[0] : equip)
    : 'unknown';
};

const inferPatternAndMuscles = (name: string, tags: string[] = []) => {
  const text = `${norm(name)} ${norm(tags.join(' '))}`;

  // ⭐ precise accessory: curls / elbow flexion
  if (/curl|bicep|biceps|hammer curl|preacher/.test(text)) {
    return { pattern: 'elbow_flexion', muscles: ['biceps', 'brachialis', 'forearms'] };
  }

  if (/(pull-?up|chin-?up)/.test(text)) {
    return { pattern: 'vertical_pull', muscles: ['lats', 'biceps', 'upper_back'] };
  }
  if (/(lat\s?pull-?down|pulldown|pull-down)/.test(text)) {
    return { pattern: 'vertical_pull', muscles: ['lats', 'biceps'] };
  }
  if (/row|inverted row|seal row|pendlay/.test(text)) {
    return { pattern: 'horizontal_pull', muscles: ['upper_back', 'lats', 'rear_delts', 'biceps'] };
  }
  if (/(bench|push-?up)/.test(text)) {
    return { pattern: 'horizontal_push', muscles: ['chest', 'triceps', 'front_delts'] };
  }
  if (/(ohp|overhead|shoulder press)/.test(text)) {
    return { pattern: 'vertical_push', muscles: ['shoulders', 'triceps', 'upper_chest'] };
  }
  if (/deadlift|rdl|hinge|good morning/.test(text)) {
    return { pattern: 'hinge', muscles: ['glutes', 'hamstrings', 'erectors'] };
  }
  if (/squat|front squat|back squat|air squat/.test(text)) {
    return { pattern: 'squat', muscles: ['quads', 'glutes', 'adductors'] };
  }
  if (/lunge|split squat|step-?up/.test(text)) {
    return { pattern: 'lunge', muscles: ['quads', 'glutes', 'calves'] };
  }

  // broad fallbacks
  if (text.includes('pull')) {return { pattern: 'pull', muscles: ['upper_back', 'lats', 'biceps'] };}
  if (text.includes('push')) {return { pattern: 'push', muscles: ['chest', 'shoulders', 'triceps'] };}

  return { pattern: undefined, muscles: [] as string[] };
};

const inferCategory = (name: string, tags: string[] = []): ExCategory => {
  const t = `${norm(name)} ${norm(tags.join(' '))}`;

  // mobility (CARs, flows, stretches)
  if (/car(s)?|controlled\s*articular|mobility|stretch|flow|yoga|t-?spine|thoracic|pass-?through/.test(t)) {
    return 'mobility';
  }
  // conditioning / circuits / cardio
  if (/run|rower|bike|burpee|carry|sled|jump rope|double under|metcon|amrap|emom|assault|airdyne|scba/.test(t)) {
    return 'conditioning';
  }
  // skill/core (leave in strength family unless clearly mobility/conditioning)
  if (/plank|hollow|toes to bar|skill/.test(t)) {return 'skill';}

  return 'strength';
};

const macroFromPattern = (p?: string) => {
  if (!p) {return undefined;}
  if (p.includes('pull')) {return 'pull';}
  if (p.includes('push')) {return 'push';}
  if (['squat', 'lunge', 'hinge'].includes(p)) {return 'lower';}
  if (p === 'elbow_flexion') {return 'upper_accessory';}
  return p;
};

/* ---------------- relevance scoring ---------------- */
const overlapCount = (a: string[] = [], b: string[] = []) => {
  if (!a.length || !b.length) {return 0;}
  const A = new Set(a);
  let n = 0;
  b.forEach((x) => A.has(x) && n++);
  return n;
};

const scoreCandidate = (current: ExerciseCard, cand: ExerciseCard) => {
  if (current.id === cand.id) {return -1;}

  // hard filter: category must match (when known)
  if (current.category && cand.category && current.category !== 'unknown' && cand.category !== 'unknown') {
    if (current.category !== cand.category) {return -1;}
  }

  // must share pattern or at least one muscle
  const musclesShared = overlapCount(current.muscles || [], cand.muscles || []);
  const samePattern = !!(current.pattern && cand.pattern && current.pattern === cand.pattern);
  if (!samePattern && musclesShared === 0) {return -1;}

  let score = 0;

  // pattern match is king
  if (samePattern) {score += 12;}

  // muscles
  score += musclesShared * 3;

  // macro bump
  const m1 = macroFromPattern(current.pattern);
  const m2 = macroFromPattern(cand.pattern);
  if (m1 && m2 && m1 === m2) {score += 2;}

  // prefer different equipment (for variety)
  if (current.equipKey && cand.equipKey) {
    if (current.equipKey !== cand.equipKey) {score += 2;}
    if (current.equipKey === cand.equipKey) {score -= 1;}
  }

  return score;
};

/* =================================================================== */
const AdaptWorkoutScreen: React.FC = () => {
  console.log('🔴 AdaptWorkoutScreen COMPONENT MOUNTED 🔴');
  const navigation = useNavigation<Nav>();
  const [adapted, setAdapted] = useState<ExerciseCard[]>([]);
  const [library, setLibrary] = useState<ExerciseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showAllReplacements, setShowAllReplacements] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ---------- load today's plan (enriched) + full library ----------
  const loadData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      console.log('AdaptWorkout: Starting load');
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.error('AdaptWorkout: No user authenticated');
        Alert.alert('Error', 'No user authenticated');
        if (showLoadingSpinner) setLoading(false);
        else setRefreshing(false);
        return;
        }
        console.log('AdaptWorkout: User ID:', uid);
        const progRef = doc(db, 'users', uid, 'program', 'active');
        const progSnap = await getDoc(progRef);
        console.log('AdaptWorkout: Program exists:', progSnap.exists());
        if (!progSnap.exists()) {
          Alert.alert('No Program', 'No active program found. Please set up your workout program first.');
          if (showLoadingSpinner) setLoading(false);
          else setRefreshing(false);
          navigation.goBack();
          return;
        }

        const data = progSnap.data() as any;
        const curDay = data?.metadata?.currentDay ?? data?.currentDay ?? 1;
        const dayIdx = Math.max(0, curDay - 1);
        console.log('AdaptWorkout: Current day:', curDay, 'Day index:', dayIdx);

        const blocks: any[] = data.days?.[dayIdx]?.exercises ?? [];
        console.log('AdaptWorkout: Exercises count:', blocks.length);

        if (blocks.length === 0) {
          Alert.alert('No Exercises', `No exercises found for day ${curDay}. Total days in program: ${data.days?.length ?? 0}`);
          if (showLoadingSpinner) setLoading(false);
          else setRefreshing(false);
          navigation.goBack();
          return;
        }

        // Enrich today's items
        const enriched: ExerciseCard[] = await Promise.all(
          blocks.map(async (blk: any) => {
            const exId = blk.id || blk.exerciseId || blk.name;
            const snap = exId ? await getDoc(doc(db, 'exercises', exId)) : null;
            const r = snap?.exists() ? (snap.data() as any) : {};
            
            console.log('Exercise data for', exId, ':', {
              hasVideoUrl: !!r.videoUrl,
              hasVideoUri: !!r.videoUri,
              hasVideo_url: !!r.video_url,
              hasBlkVideoUri: !!blk.videoUri,
              videoUrl: r.videoUrl,
              videoUri: r.videoUri,
              video_url: r.video_url,
              allKeys: Object.keys(r)
            });
            
            const name = r.name || blk.name || pretty(exId);
            const tags: string[] = Array.isArray(r.tags) ? r.tags : Array.isArray(blk.tags) ? blk.tags : [];
            const { pattern, muscles } = inferPatternAndMuscles(name, tags);
            const equipKey = equipKeyFrom(r.equipment, `${name} ${tags.join(' ')}`);
            const equipment =
              Array.isArray(r.equipment) ? r.equipment.join(', ') :
              (r.equipment ?? blk.equipment ?? undefined);
            const category = inferCategory(name, tags);

            // Try multiple sources for video URL
            let videoUri = r.videoUrl || r.videoUri || r.video_url || blk.videoUri;
            
            // If no video URL found, try the exerciseVideoMap
            if (!videoUri || videoUri.includes('w3schools')) {
              const videoData = getExerciseVideoData(exId);
              if (videoData?.videoUrl) {
                videoUri = videoData.videoUrl;
                console.log('Using exerciseVideoMap for', name, ':', videoUri);
              }
            }
            
            // Final fallback
            if (!videoUri) {
              videoUri = fallbackVideos[name] || fallbackVideos.Pushups;
            }
            
            console.log('Final videoUri for', name, ':', videoUri);

            return {
              id: exId,
              name,
              tags,
              focusArea: r.focusArea ?? blk.focusArea,
              videoUri,
              thumbnailUri: r.thumbnailUri || blk.thumbnailUri,
              pattern, muscles, equipKey, equipment, category,
            } as ExerciseCard;
          })
        );        // Full library
        const libSnap = await getDocs(collection(db, 'exercises'));
        const lib: ExerciseCard[] = libSnap.docs.map((d: any) => {
          const r = d.data() as any;
          const name = r.name || pretty(d.id);
          const tags: string[] = Array.isArray(r.tags) ? r.tags : [];
          const { pattern, muscles } = inferPatternAndMuscles(name, tags);
          const equipKey = equipKeyFrom(r.equipment, `${name} ${tags.join(' ')}`);
          const category = inferCategory(name, tags);
          
          // Try multiple possible video URL field names
          const videoUri = r.videoUrl || r.videoUri || r.video_url || fallbackVideos[name] || fallbackVideos.Pushups;
          
          return {
            id: d.id,
            name,
            tags,
            focusArea: r.focusArea,
            videoUri,
            thumbnailUri: r.thumbnailUri,
            equipment: Array.isArray(r.equipment) ? r.equipment.join(', ') : r.equipment,
            pattern, muscles, equipKey, category,
          };
        });

        console.log('AdaptWorkout: Setting adapted exercises:', enriched.length);
        console.log('AdaptWorkout: Setting library:', lib.length);
        setAdapted(enriched);
        setLibrary(lib);
        console.log('AdaptWorkout: Data set, loading should end');
      } catch (err) {
        console.error('Adapt load error:', err);
        Alert.alert('Error', `Failed to load workout: ${err}`);
        if (showLoadingSpinner) setLoading(false);
        else setRefreshing(false);
        navigation.goBack();
      } finally {
        console.log('AdaptWorkout: Setting loading to false');
        if (showLoadingSpinner) setLoading(false);
        else setRefreshing(false);
      }
    };
  
  // Initial load
  useEffect(() => {
    loadData(true);
  }, []);

  // Refocus load
  useFocusEffect(
    React.useCallback(() => {
      if (!loading) {
        loadData(false);
      }
    }, [loading])
  );

  // ---------- suggestions tailored to the selected exercise ----------
  const suggestions: ExerciseCard[] = useMemo(() => {
    if (currentIndex == null) {return [];}
    const cur = adapted[currentIndex];
    if (!cur) {return [];}

    // category gate first (keeps curls away from mobility/conditioning lists)
    const pool =
      cur.category && cur.category !== 'unknown'
        ? library.filter((c: ExerciseCard) => (c.category ?? 'unknown') === cur.category)
        : library;

    const MIN_SCORE = 6;

    const ranked = pool
      .map((c: ExerciseCard) => ({ c, s: scoreCandidate(cur, c) }))
      .filter((x: { c: ExerciseCard; s: number }) => x.s >= MIN_SCORE)
      .sort((a: { c: ExerciseCard; s: number }, b: { c: ExerciseCard; s: number }) => b.s - a.s)
      .map((x: { c: ExerciseCard; s: number }) => x.c);

    // elbow_flexion fallback: seed with curl family if nothing hit
    if (ranked.length === 0 && cur.pattern === 'elbow_flexion') {
      return pool
        .filter((c: ExerciseCard) => /curl|bicep|biceps|preacher|hammer/.test(norm(c.name)))
        .slice(0, 20);
    }

    // relaxed fallback by macro pattern
    if (ranked.length === 0 && cur.pattern) {
      const macro = macroFromPattern(cur.pattern);
      const relaxed = pool.filter((c: ExerciseCard) => macroFromPattern(c.pattern) === macro && c.id !== cur.id);
      return relaxed.slice(0, 20);
    }

    return ranked.slice(0, 20);
  }, [currentIndex, adapted, library]);

  // ---------- handlers ----------
  const handleAdapt = (i: number) => {
    setCurrentIndex(i);
    setShowAllReplacements(false);
    setModalVisible(true);
  };

  const selectReplacement = (replacement: ExerciseCard) => {
    if (currentIndex === null) {return;}
    const next = [...adapted];
    next[currentIndex] = { ...next[currentIndex], ...replacement };
    setAdapted(next);
    setModalVisible(false);
    setCurrentIndex(null);
  };

  const handleSave = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      const ref = doc(db, 'users', uid, 'program', 'active');
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        Alert.alert('Error', 'No active program found. Please set up your program first.');
        return;
      }
      const data = snap.data() as any;
      const dayIdx = (data.currentDay ?? 1) - 1;

      const merged = (data.days?.[dayIdx]?.exercises ?? []).map((orig: any, i: number) => {
        const a = adapted[i];
        return {
          ...orig,
          id: a?.id ?? orig.id,
          name: a?.name ?? orig.name,
          videoUri: a?.videoUri ?? orig.videoUri ?? '',
          thumbnailUri: a?.thumbnailUri ?? orig.thumbnailUri ?? '',
        };
      });

      data.days[dayIdx].exercises = merged;
      await setDoc(ref, data, { merge: true });
      setShowToast(true);

      setTimeout(() => {
        navigation.navigate('WorkoutDetail', {
          day: data.days[dayIdx],
          weekIdx: data.currentWeek ?? 0,
          dayIdx,
          adapt: true,
        });
      }, 800);
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', `Failed to save adapted workout: ${err}`);
    }
  };

  // ---------- render ----------
  console.log('AdaptWorkout: Rendering, loading:', loading, 'adapted count:', adapted.length);
  
  if (loading) {
    console.log('AdaptWorkout: Still loading, showing spinner');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }} edges={['top']}>
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <View style={styles.content}>
            <ActivityIndicator size="large" color="#d32f2f" />
            <Text style={{ color: '#fff', marginTop: 20, textAlign: 'center' }}>Loading exercises...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Check if we have exercises to show
  if (adapted.length === 0) {
    console.log('AdaptWorkout: No exercises in adapted array');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }} edges={['top']}>
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <View style={styles.content}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Ionicons name="barbell-outline" size={64} color="#666" />
              <Text style={styles.title}>No Exercises Found</Text>
              <Text style={{ color: '#999', textAlign: 'center', marginTop: 12 }}>
                There are no exercises in today's workout to adapt.
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  console.log('AdaptWorkout: Rendering main content with', adapted.length, 'exercises');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }} edges={['top']}>
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>Adapt Today's Workout</Text>

        {adapted.map((ex: any, i: number) => {
          console.log('AdaptWorkout: Rendering exercise', i, ex.name);
          return (
          <View key={`${ex.id}-${i}`} style={styles.card}>
            <Text style={styles.cardTitle}>{ex.name}</Text>

            {ex.videoUri && (
              <View style={styles.videoBox}>
                <VideoToggle uri={ex.videoUri} />
              </View>
            )}

            <Text style={styles.metaLine}>
              {ex.equipment ? `🏷 ${ex.equipment}` : '🏷 No Equipment'}
              {ex.pattern ? ` • ${ex.pattern.replace(/_/g, ' ')}` : ''}
            </Text>

            <Pressable style={styles.button} onPress={() => handleAdapt(i)}>
              <Text style={styles.buttonText}>Swap Exercise</Text>
            </Pressable>
          </View>
          );
        })}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Save Adapted Workout</Text>
        </Pressable>
      </ScrollView>

      {/* Replacement Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentIndex !== null && adapted[currentIndex] && (
              <>
                <Text style={styles.modalTitle}>
                  Replacing: <Text style={styles.replacementName}>{adapted[currentIndex].name}</Text>
                </Text>
                <Text style={styles.modalSubTitle}>Choose a replacement:</Text>

                <FlatList
                  data={(suggestions || []).slice(0, showAllReplacements ? undefined : 10)}
                  keyExtractor={(item: ExerciseCard) => item.id}
                  renderItem={({ item }: { item: ExerciseCard }) => (
                    <Pressable style={styles.replacementItem} onPress={() => selectReplacement(item)}>
                      <View style={styles.rowAlignCenter}>
                        {item.thumbnailUri ? (
                          <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnailImage} />
                        ) : (
                          <View style={styles.thumbnailImage} />
                        )}
                        <View>
                          <Text style={styles.replacementText}>{item.name}</Text>
                          <Text style={styles.replacementTag}>
                            🏷 {item.equipment || 'No Equipment'}
                            {item.pattern ? ` • ${item.pattern.replace(/_/g, ' ')}` : ''}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={[styles.replacementText, styles.replacementEmpty]}>
                      No close matches yet. Add tags to this exercise to improve suggestions.
                    </Text>
                  }
                />

                {suggestions.length > 10 && (
                  <Pressable
                    onPress={() => setShowAllReplacements((p: boolean) => !p)}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllReplacements ? '➖ Show Less' : '➕ Show More'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            <Pressable
              style={[styles.button, styles.buttonMarginTop]}
              onPress={() => {
                setModalVisible(false);
                setShowAllReplacements(false);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {showToast && (
        <Toast message="Adapted workout saved!" onClose={() => setShowToast(false)} />
      )}
    </LinearGradient>
    </SafeAreaView>
  );
};

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },
  topBar: { alignSelf: 'flex-start', marginBottom: 12, marginTop: 8 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: { alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#fff', fontSize: 14, marginTop: 4 },
  metaLine: { color: '#bbb', marginBottom: 10 },
  button: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  icon: { marginRight: 8 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backText: { color: '#fff', fontSize: 16, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  modalSubTitle: { fontSize: 14, color: '#bbb', textAlign: 'center', marginBottom: 10 },
  replacementItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  replacementText: { color: '#fff', fontSize: 16 },
  replacementTag: { fontSize: 12, color: '#aaa', marginTop: 2, fontStyle: 'italic' },
  replacementName: { color: '#4fc3f7' },
  rowAlignCenter: { flexDirection: 'row', alignItems: 'center' },
  thumbnailImage: { width: 50, height: 50, marginRight: 10, borderRadius: 8, backgroundColor: '#333' },
  showMoreButton: { alignItems: 'center', marginVertical: 8 },
  showMoreText: { color: '#4fc3f7', fontSize: 14 },
  buttonMarginTop: { marginTop: 12 },
  replacementEmpty: { textAlign: 'center', opacity: 0.8 },
});

export default AdaptWorkoutScreen;
