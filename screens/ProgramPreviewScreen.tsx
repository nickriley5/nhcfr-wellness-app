import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { PROGRAM_TEMPLATES } from '../utils/ProgramTemplates';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveExerciseDetails } from '../utils/exerciseUtils';

import { auth, db } from '../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

type ProgramDay = {
  week: number;
  day: number;
  title: string;
  warmup?: any[];
  exercises?: any[];
  cooldown?: any[];
};

const ProgramPreviewScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProgramPreview'>>();
  const { programId } = route.params;
  const insets = useSafeAreaInsets();
  const [isStarting, setIsStarting] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  /* -------------------------------------------------------------------- */
  /* look up program template locally                                     */
  /* -------------------------------------------------------------------- */
  const program = PROGRAM_TEMPLATES.find((p) => p.id === programId);

  if (!program) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Program not found</Text>
      </View>
    );
  }

  /* -------------------------------------------------------------------- */
  /* toggle day expansion                                                 */
  /* -------------------------------------------------------------------- */
  const toggleDayExpansion = (dayIndex: number) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  /* -------------------------------------------------------------------- */
  /* render expanded workout details                                      */
  /* -------------------------------------------------------------------- */
  const renderWorkoutDetails = (day: ProgramDay) => {
    const workoutSections = [
      { title: 'Warmup', exercises: day.warmup || [] },
      { title: 'Main Workout', exercises: day.exercises || [] },
      { title: 'Cooldown', exercises: day.cooldown || [] },
    ];

    return (
      <View style={styles.workoutDetails}>
        {workoutSections.map((section, sectionIdx) => {
          if (!section.exercises.length) {return null;}

          return (
            <View key={sectionIdx} style={styles.workoutSection}>
              <Text style={styles.workoutSectionTitle}>{section.title}</Text>
              {section.exercises.map((exercise: any, exerciseIdx: number) => (
                <View key={exerciseIdx} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>
                    {formatExerciseName(exercise.id || exercise.name || 'Exercise')}
                  </Text>
                  {(exercise.sets && exercise.repsOrDuration) && (
                    <Text style={styles.exerciseDetails}>
                      {exercise.sets} sets × {exercise.repsOrDuration}
                      {exercise.rpe ? ` @ RPE ${exercise.rpe}` : ''}
                    </Text>
                  )}
                  {exercise.duration && (
                    <Text style={styles.exerciseDetails}>
                      {exercise.duration}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  /* -------------------------------------------------------------------- */
  /* format exercise ID to readable name using database lookup            */
  /* -------------------------------------------------------------------- */
  const formatExerciseName = (exerciseId: string): string => {
    // Try to look up the actual exercise name from the database first
    const exercise = resolveExerciseDetails(exerciseId);
    if (exercise && exercise.name) {
      return exercise.name;
    }

    // Fallback to formatting the ID if not found in database
    return exerciseId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };  /* -------------------------------------------------------------------- */
  /* save full program + metadata to Firestore and move to Workout tab    */
  /* -------------------------------------------------------------------- */
  const handleStartProgram = async () => {
    if (isStarting) {return;} // Prevent double-tap

    setIsStarting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {throw new Error('User not authenticated');}

      await setDoc(
        doc(db, 'users', uid, 'program', 'active'),
        {
          programId: program.id,
          metadata: {
            currentDay: 1,
            startDate: Timestamp.now(),
          },
          days: program.days,
        },
        { merge: false }
      );

      // Show success message before navigating
      Alert.alert(
        'Program Started! 🔥',
        `${program.name} is now your active program. Ready to crush your first workout?`,
        [
          {
            text: 'Let\'s Go!',
            onPress: () => {
              navigation.navigate('AppDrawer', {
                screen: 'MainTabs',
                params: { screen: 'Workout' },
              });
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error starting program:', err);
      Alert.alert('Error', 'There was an issue starting the program.');
    } finally {
      setIsStarting(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /* UI                                                                   */
  /* -------------------------------------------------------------------- */
  return (
    <ScrollView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>{program.name}</Text>
      <Text style={styles.description}>{program.description}</Text>
      <Text style={styles.meta}>
        {program.durationWeeks} weeks · {program.daysPerWeek} days / week
      </Text>

      {/* Program Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{program.days?.length || 0}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{program.durationWeeks}</Text>
          <Text style={styles.statLabel}>Weeks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{program.daysPerWeek}</Text>
          <Text style={styles.statLabel}>Days/Week</Text>
        </View>
      </View>

      <Text style={styles.section}>Preview</Text>
      {program.days.slice(0, 7).map((day: ProgramDay, idx) => {
        const isExpanded = expandedDays.has(idx);

        return (
          <Pressable
            key={idx}
            style={[styles.dayCard, isExpanded && styles.dayCardExpanded]}
            onPress={() => toggleDayExpansion(idx)}
          >
            <View style={styles.dayCardHeader}>
              <View>
                <Text style={styles.dayTitle}>
                  Week {day.week} · Day {day.day}
                </Text>
                <Text style={styles.dayDesc}>{day.title}</Text>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#AAA"
              />
            </View>

            {isExpanded && renderWorkoutDetails(day)}
          </Pressable>
        );
      })}

      <Pressable
        style={[
          styles.startButton,
          isStarting && styles.startButtonDisabled,
          { marginBottom: Math.max(insets.bottom + 40, 60) },
        ]}
        onPress={handleStartProgram}
        disabled={isStarting}
      >
        <Text style={styles.startButtonText}>
          {isStarting ? 'Starting Program...' : 'Start this program'}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default ProgramPreviewScreen;

/* ---------------------------------------------------------------------- */
/* styles                                                                 */
/* ---------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    backgroundColor: '#0E0E0E',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: { color: '#FFF', fontSize: 16, marginLeft: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  description: { fontSize: 16, color: '#CCC', marginBottom: 8 },
  meta: { fontSize: 14, color: '#777', marginBottom: 16 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3C38',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
  },
  section: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 8,
    marginTop: 16,
    fontWeight: '600',
  },
  dayCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  dayCardExpanded: {
    backgroundColor: '#222',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  dayDesc: { fontSize: 13, color: '#AAA' },
  workoutDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  workoutSection: {
    marginBottom: 12,
  },
  workoutSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3C38',
    marginBottom: 6,
  },
  exerciseItem: {
    marginBottom: 4,
    paddingLeft: 8,
  },
  exerciseName: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  startButton: {
    backgroundColor: '#FF3C38',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  startButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  error: { padding: 24, color: 'red', fontSize: 16 },
});
