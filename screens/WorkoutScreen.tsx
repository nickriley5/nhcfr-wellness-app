import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  // Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { ProgramDay } from '../types/Exercise';
// import { regenerateActiveProgram } from '../utils/programService';
import { resolveExerciseDetails } from '../utils/exerciseUtils';


interface StoredState {
  currentDayIndex: number;
}

const formatExerciseName = (id: string): string => {
  // Try to look up the actual exercise name from the database first
  const exercise = resolveExerciseDetails(id);
  if (exercise && exercise.name) {
    return exercise.name;
  }

  // Fallback to formatting the ID if not found in database
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
};


const WorkoutScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<StoredState | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [weeksArr, setWeeksArr] = useState<ProgramDay[][]>([]);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const fetchProgram = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) {return;}
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'program', 'active'));
    if (snap.exists()) {
      const data = snap.data();
      setState({ currentDayIndex: data.metadata.currentDay - 1 });
      setDays(data.days as ProgramDay[]);
    } else {
      setDays([]);                // or your array state setter
      setState({ currentDayIndex: 0 }); // safe default
      // setProgram(null);           // if you keep a program object in state
}
  } catch (err) {
    console.error('Error loading program:', err);
  }
};

useEffect(() => { fetchProgram(); }, []);

useFocusEffect(
  React.useCallback(() => {
    fetchProgram();
    return () => {};
  }, [])
);



  /* ───────── 1. LOAD PROGRAM ───────── */
  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      try {
        const snap = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        if (snap.exists()) {
          const data = snap.data();
          setState({ currentDayIndex: data.metadata.currentDay - 1 });
          setDays(data.days as ProgramDay[]);
        }
      } catch (err) {
        console.error('Error loading program:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────── 2. BUILD weeksArr ───────── */
  useEffect(() => {
    if (!state || days.length === 0) {return;}

    const map: Record<number, ProgramDay[]> = {};
    days.forEach((d) => {
      const wk =
        // prefer explicit field
        // @ts-ignore (if you haven’t typed week yet)
        d.week !== undefined ? d.week - 1
        // fallback to “Week X” in title
        : parseInt(d.title.match(/Week\s+(\d+)/)?.[1] ?? '1', 10) - 1;

      (map[wk] ||= []).push(d);
    });

    const weeks = Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b)
      .map((wk) =>
        [...map[wk]].sort(
          (a, b) =>
            // @ts-ignore (if you haven’t typed day yet)
            ((a.day ?? 0) as number) - ((b.day ?? 0) as number),
        ),
      );

    setWeeksArr(weeks);

    /* Position cursor on current day */
    let remaining = state.currentDayIndex;
    let w = 0;
    while (w < weeks.length && remaining >= weeks[w].length) {
      remaining -= weeks[w].length;
      w++;
    }
    setSelectedWeekIdx(Math.min(w, weeks.length - 1));
    setSelectedDayIdx(Math.max(0, remaining));
  }, [state, days]);

  /* ───────── 3. RENDER ───────── */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  if (!state || days.length === 0) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🏋️ Workout Hub</Text>
          <Text style={styles.subtitle}>No active program.</Text>
          <Pressable
            style={styles.generateButton}
            onPress={() => navigation.navigate('ProgramList')}
          >
            <Text style={styles.buttonText}>Choose a Program</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const daysThisWeek = weeksArr[selectedWeekIdx] || [];
  const today = daysThisWeek[selectedDayIdx];

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Program</Text>
        <View style={styles.headerIcons}>
          <Pressable onPress={() => setShowFullSchedule(true)} style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color="#d32f2f" />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ExerciseLibrary')} style={styles.iconButton}>
            <Ionicons name="book-outline" size={24} color="#d32f2f" />
          </Pressable>
          {/* <Pressable
  onPress={async () => {
    try {
      // TEMP default goals. swap to your real user goals later.
      const goals = {
        focus: ['strength', 'conditioning'],
        daysPerWeek: 4,
        includeFireground: true,
        durationWeeks: 2,
        goalType: 'Build Muscle',
        experienceLevel: 'Intermediate',
        equipment: ['Bodyweight', 'Dumbbells', 'Kettlebells'],
      } as const;
      await regenerateActiveProgram(goals as any);
      Alert.alert('Program', 'New program generated and saved.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to regenerate');
    }
  }}
  style={styles.regenerateButton}
>
  <Text style={styles.buttonText}>Regenerate Program</Text>
</Pressable> */}

        </View>
      </View>

      {/* WEEK TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekTabs}>
        {weeksArr.map((_, wi) => (
          <Pressable
            key={wi}
            style={[styles.weekTab, selectedWeekIdx === wi && styles.weekTabSelected]}
            onPress={() => {
              setSelectedWeekIdx(wi);
              setSelectedDayIdx(0);
            }}
          >
            <Text style={styles.weekTabText}>Week {wi + 1}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* DAY TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
        {daysThisWeek.map((_, di) => (
          <Pressable
            key={di}
            style={[styles.dayTab, selectedDayIdx === di && styles.dayTabSelected]}
            onPress={() => setSelectedDayIdx(di)}
          >
            <Text style={styles.dayTabText}>Day {di + 1}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* WORKOUT PREVIEW */}
      <ScrollView contentContainerStyle={styles.content}>
        {today ? (
          <>
            <Text style={styles.cardTitle}>{today.title}</Text>

            {/* Warm-up */}
            <Text style={styles.sectionHeader}>Warm-up</Text>
            {today.warmup.map((blk, i) => (
              <View
                key={`wu-${i}`}
                style={[
                  styles.exerciseRow,
                  i % 2 === 1 ? styles.rowAlt : undefined, // ✅ no “0” anymore
                ]}
              >
                <Text style={styles.exerciseName}>{formatExerciseName(blk.id)}</Text>
                <Text style={styles.exerciseSets}>{blk.repsOrDuration}</Text>
              </View>
            ))}

            {/* Main exercises */}
            <Text style={styles.sectionHeader}>Exercises</Text>
            {today.exercises.map((blk, i) => (
              <View
                key={`ex-${i}`}
                style={[
                  styles.exerciseRow,
                  i % 2 === 1 ? styles.rowAlt : undefined,
                ]}
              >
                <Text style={styles.exerciseName}>{formatExerciseName(blk.id)}</Text>
                <Text style={styles.exerciseSets}>{blk.repsOrDuration}</Text>
              </View>
            ))}

            {/* Cool-down */}
            <Text style={styles.sectionHeader}>Cool-down</Text>
            {today.cooldown.map((blk, i) => (
              <View
                key={`cd-${i}`}
                style={[
                  styles.exerciseRow,
                  i % 2 === 1 ? styles.rowAlt : undefined,
                ]}
              >
                <Text style={styles.exerciseName}>{formatExerciseName(blk.id)}</Text>
                <Text style={styles.exerciseSets}>{blk.repsOrDuration}</Text>
              </View>
            ))}

            {/* Start workout */}
            <Pressable
  style={styles.detailButton}
  onPress={() =>
    navigation.navigate('WorkoutDetail', {
      day: today,
      weekIdx: selectedWeekIdx,
      dayIdx: selectedDayIdx,
    })
  }
>
  <Text style={styles.detailButtonText}>Start Workout</Text>
</Pressable>

          </>
        ) : (
          <Text style={styles.subtitle}>No workout for this day.</Text>
        )}
      </ScrollView>

      {/* FULL-SCHEDULE MODAL */}
      <Modal visible={showFullSchedule} animationType="slide">
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Full Schedule</Text>
            <Pressable onPress={() => setShowFullSchedule(false)}>
              <Ionicons name="close-circle" size={28} color="#d32f2f" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {weeksArr.map((week, wi) => (
              <View key={wi} style={styles.weekBlock}>
                <Text style={styles.weekHeader}>Week {wi + 1}</Text>
                {week.map((day, di) => (
                  <Text key={di} style={styles.dayItem}>
                    {day.title}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

/* ───────── STYLES ───────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 12 },

  // WEEK TABS CONTAINER
weekTabs: {
  paddingHorizontal: 12,
  paddingTop: 10, // more top padding
  paddingBottom: 6,
},

weekTab: {
  paddingVertical: 12, // increased height
  paddingHorizontal: 26, // even wider
  marginRight: 12,
  marginBottom: 10,
  borderRadius: 20,
  backgroundColor: '#333',
  minWidth: 120,
  minHeight: 45,
  alignItems: 'center',
},
weekTabSelected: {
  backgroundColor: '#d32f2f',
  borderWidth: 1,
  borderColor: '#fff',
},
weekTabText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 16, // slightly larger
},

dayTabs: {
  paddingHorizontal: 12,
  paddingBottom: 10,
  paddingTop: 4,
  marginTop: 2,
},

dayTab: {
  paddingVertical: 10, // increased height
  paddingHorizontal: 24,
  marginRight: 12,
  marginBottom: 8,
  borderRadius: 20,
  backgroundColor: '#333',
  minWidth: 100,
  minHeight: 45,
  alignItems: 'center',
},
dayTabSelected: {
  backgroundColor: '#d32f2f',
  borderWidth: 1,
  borderColor: '#fff',
},
dayTabText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 15,
},


  // CONTENT BELOW PILLS
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#fff' },
  subtitle: { fontSize: 16, color: '#ccc', marginVertical: 12 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 12 },

  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
    marginTop: 20,
    marginBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#d32f2f',
  },

  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.05)' },
  exerciseName: { color: '#fff', fontSize: 16 },
  exerciseSets: { color: '#ccc', fontSize: 16 },

  detailButton: {
    marginTop: 24,
    backgroundColor: '#d32f2f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  weekBlock: { marginBottom: 16 },
  weekHeader: { fontSize: 18, color: '#d32f2f', fontWeight: '600' },
  dayItem: { color: '#fff', marginLeft: 12, marginVertical: 2 },

  generateButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
  },
  regenerateButton: {
    padding: 10,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});


export default WorkoutScreen;
