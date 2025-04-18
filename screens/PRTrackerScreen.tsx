// PRTrackerScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { auth, firestore } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

interface WorkoutLog {
  exercises: {
    name: string;
    sets: {
      weight: string;
      reps: string;
    }[];
  }[];
}

interface PRMap {
  [exercise: string]: number; // max weight
}

const PRTrackerScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [prs, setPrs] = useState<PRMap>({});

  useEffect(() => {
    const fetchPRs = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const logRef = collection(firestore, 'users', uid, 'workoutLogs');
        const snapshot = await getDocs(logRef);
        const prMap: PRMap = {};

        snapshot.forEach(doc => {
          const data = doc.data() as WorkoutLog;
          data.exercises.forEach(ex => {
            ex.sets.forEach(set => {
              const weight = parseFloat(set.weight);
              if (!isNaN(weight)) {
                if (!prMap[ex.name] || weight > prMap[ex.name]) {
                  prMap[ex.name] = weight;
                }
              }
            });
          });
        });

        setPrs(prMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPRs();
  }, []);

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>All-Time PRs</Text>

        {/* Back button */}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator size="large" color="#d32f2f" />
        ) : Object.keys(prs).length === 0 ? (
          <Text style={styles.noPRText}>No PRs found yet. Start logging workouts!</Text>
        ) : (
          Object.entries(prs)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, weight]) => (
              <View key={name} style={styles.prItem}>
                <Ionicons name="trophy-outline" size={18} color="#4fc3f7" style={{ marginRight: 8 }} />
                <Text style={styles.prText}>{name}: {weight} lbs</Text>
              </View>
            ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  noPRText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  prItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  prText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PRTrackerScreen;