import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ProgramDay } from '../utils/buildProgramFromGoals';

const ProgramPreviewScreen = () => {
  const navigation = useNavigation();
  const [program, setProgram] = useState<ProgramDay[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const docRef = doc(db, 'users', uid, 'program', 'active');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProgram(data.days || []);
        }
      } catch (err) {
        console.error('Error fetching program:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, []);

  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.screen}>
        <ActivityIndicator size="large" color="#4fc3f7" />
        <Text style={styles.loadingText}>Loading Program...</Text>
      </LinearGradient>
    );
  }

  if (!program || program.length === 0) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.screen}>
        <Text style={styles.message}>No program found. Please generate one first.</Text>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>⬅ Back to Dashboard</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>📆 Your Training Program</Text>
        {program.map((day, index) => (
          <View key={index} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day.title}</Text>
            {day.exercises.map((ex: any, i: number) => (
              <Text key={i} style={styles.exercise}>
                • {ex.name} — {ex.sets} x {ex.reps}
              </Text>
            ))}
          </View>
        ))}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>⬅ Back to Dashboard</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#ccc',
    fontSize: 16,
  },
  message: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  dayTitle: {
    fontSize: 18,
    color: '#4fc3f7',
    fontWeight: '600',
    marginBottom: 8,
  },
  exercise: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderColor: '#4fc3f7',
    borderWidth: 1,
  },
  backText: {
    color: '#4fc3f7',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProgramPreviewScreen;
