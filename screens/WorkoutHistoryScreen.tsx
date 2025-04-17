import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { auth, firestore } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

interface WorkoutLog {
  dayTitle: string;
  completedAt: string;
  exercises: {
    name: string;
    sets: {
      weight: string;
      reps: string;
    }[];
  }[];
}

const WorkoutHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Record<string, WorkoutLog>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // 🔍 search input state

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const logRef = collection(firestore, 'users', uid, 'workoutLogs');
        const snapshot = await getDocs(logRef);
        const logData: Record<string, WorkoutLog> = {};

        snapshot.forEach(doc => {
          logData[doc.id] = doc.data() as WorkoutLog;
        });

        setLogs(logData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  const matchesSearch = (log: WorkoutLog) => {
    if (!searchQuery.trim()) return true;
    return log.exercises.some(ex =>
      ex.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Workout History</Text>

        {/* 🔙 Back button */}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* 🔍 Search bar */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by exercise name..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* 📋 Filtered log display */}
        {Object.entries(logs)
          .sort(([a], [b]) => b.localeCompare(a))
          .filter(([_, log]) => matchesSearch(log))
          .map(([id, log]) => (
            <View key={id} style={styles.card}>
              <TouchableOpacity onPress={() => toggleExpand(id)} style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {log.dayTitle || 'Workout'} — {id}
                </Text>
                <Ionicons
                  name={expanded === id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>

              {expanded === id && (
                <View style={styles.cardBody}>
                  {log.exercises
                    .filter(ex =>
                      !searchQuery.trim() ||
                      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((ex, exIndex) => (
                      <View key={exIndex} style={styles.exerciseBlock}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        {ex.sets.map((set, setIndex) => (
                          <Text key={setIndex} style={styles.setText}>
                            Set {setIndex + 1}: {set.reps} reps @ {set.weight} lbs
                          </Text>
                        ))}
                      </View>
                    ))}
                </View>
              )}
            </View>
          ))}
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
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#333',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardBody: {
    padding: 12,
    backgroundColor: '#1c1c1c',
  },
  exerciseBlock: {
    marginBottom: 12,
  },
  exerciseName: {
    color: '#d32f2f',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  setText: {
    color: '#eee',
    fontSize: 13,
    marginLeft: 8,
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
  searchInput: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderColor: '#333',
    borderWidth: 1,
    marginBottom: 20,
  },
});

export default WorkoutHistoryScreen;
