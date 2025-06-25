import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { PROGRAM_TEMPLATES } from '../utils/ProgramTemplates';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { auth, db } from '../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

type ProgramDay = {
  week: number;
  day: number;
  title: string;
};

const ProgramPreviewScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProgramPreview'>>();
  const { programId } = route.params;

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
  /* save full program + metadata to Firestore and move to Workout tab    */
  /* -------------------------------------------------------------------- */
  const handleStartProgram = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');

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

      navigation.navigate('AppDrawer', {
        screen: 'MainTabs',
        params: { screen: 'Workout' },
      });
    } catch (err) {
      console.error('Error starting program:', err);
      alert('There was an issue starting the program.');
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

      <Text style={styles.section}>Weekly overview</Text>
      {program.days.slice(0, 7).map((day: ProgramDay, idx) => (
        <View key={idx} style={styles.dayCard}>
          <Text style={styles.dayTitle}>
            Week {day.week} · Day {day.day}
          </Text>
          <Text style={styles.dayDesc}>{day.title}</Text>
        </View>
      ))}

      <Pressable style={styles.startButton} onPress={handleStartProgram}>
        <Text style={styles.startButtonText}>Start this program</Text>
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
  dayTitle: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  dayDesc: { fontSize: 13, color: '#AAA' },
  startButton: {
    backgroundColor: '#FF3C38',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
    marginBottom: 48,
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  error: { padding: 24, color: 'red', fontSize: 16 },
});
