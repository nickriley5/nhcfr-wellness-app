import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

interface ProgramDay {
  title: string;
  date: Timestamp;
  exercises: { name: string; sets: number; reps: number }[];
}

interface StoredProgram {
  days: ProgramDay[];
  currentDay: number;
}

const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [currentProgram, setCurrentProgram] = useState<StoredProgram | null>(null);
  const [weeksArr, setWeeksArr] = useState<ProgramDay[][]>([]);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        if (snap.exists()) setCurrentProgram(snap.data() as StoredProgram);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!currentProgram) return;
    const map: Record<number, ProgramDay[]> = {};
    currentProgram.days.forEach(day => {
      const m = day.title.match(/^Week (\d+)/);
      const wk = m ? +m[1] : 1;
      (map[wk] ||= []).push(day);
    });
    const weeks = Object.keys(map)
      .map(n => +n)
      .sort((a, b) => a - b)
      .map(n => map[n]);
    setWeeksArr(weeks);

    const idx = currentProgram.currentDay - 1;
    const perWeek = weeks[0]?.length || 1;
    setSelectedWeekIdx(Math.floor(idx / perWeek));
    setSelectedDayIdx(idx % perWeek);
  }, [currentProgram]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  if (!currentProgram) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🏋️‍♂️ Workout Hub</Text>
          <Text style={styles.subtitle}>No program found.</Text>
          <Pressable
            style={styles.generateButton}
            onPress={() => navigation.navigate('ProgramPreview')}
          >
            <Text style={styles.buttonText}>Generate Program</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const daysThisWeek = weeksArr[selectedWeekIdx] || [];
  const today = daysThisWeek[selectedDayIdx];

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Program</Text>
        <View style={styles.headerIcons}>
          <Pressable onPress={() => setShowFullSchedule(true)} style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color="#d32f2f" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ExerciseLibrary')}
            style={styles.iconButton}
          >
            <Ionicons name="book-outline" size={24} color="#d32f2f" />
          </Pressable>
        </View>
      </View>

      {/* Week Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekTabs}
      >
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

      {/* Day Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}
      >
        {daysThisWeek.map((_, di) => (
          <Pressable
            key={di}
            style={[styles.dayTab, selectedDayIdx === di && styles.dayTabSelected]}
            onPress={() => setSelectedDayIdx(di)}
          >
            <Text style={styles.dayTabText}>
              Day {selectedWeekIdx * daysThisWeek.length + di + 1}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Today’s Workout Preview */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.cardTitle}>{today?.title}</Text>
        {today?.exercises.map((ex, idx) => (
          <View key={idx} style={styles.exerciseRow}>
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.exerciseSets}>{ex.sets}×{ex.reps}</Text>
          </View>
        ))}

        <Pressable
          style={styles.detailButton}
          onPress={() => navigation.navigate('WorkoutDetail')}
        >
          <Text style={styles.detailButtonText}>Start Workout</Text>
        </Pressable>
      </ScrollView>

      {/* Full Schedule Modal */}
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
                  <Text key={di} style={styles.dayItem}>{day.title}</Text>
                ))}
              </View>
            ))}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

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

  weekTabs: { paddingHorizontal: 8 },
  weekTab: {
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  weekTabSelected: { backgroundColor: '#d32f2f' },
  weekTabText: { color: '#fff', fontWeight: '600' },

  dayTabs: { paddingHorizontal: 8 },
  dayTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  dayTabSelected: { backgroundColor: '#d32f2f' },
  dayTabText: { color: '#fff' },

  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#d32f2f' },
  subtitle: { fontSize: 16, color: '#ccc', marginVertical: 12 },

  cardTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 12 },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  exerciseName: { color: '#fff', fontSize: 16 },
  exerciseSets: { color: '#ccc', fontSize: 16 },

  detailButton: {
    marginTop: 20,
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailButtonText: { color: '#fff', fontWeight: '700' },

  generateButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700' },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  weekBlock: { marginBottom: 16 },
  weekHeader: { fontSize: 18, color: '#d32f2f', fontWeight: '600' },
  dayItem: { color: '#fff', marginLeft: 12, marginVertical: 2 },
});

export default WorkoutScreen;
