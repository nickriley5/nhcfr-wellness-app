// WorkoutHistoryScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { resolveExerciseDetails } from '../utils/exerciseUtils';

interface WorkoutLog {
  dayTitle: string;
  completedAt: Timestamp;
  workoutType?: 'strength' | 'cardio';
  // Strength workout fields
  exercises?: {
    name: string;
    sets: {
      weight: string;
      reps: string;
    }[];
  }[];
  // Cardio workout fields
  type?: string;
  actualDuration?: number;
  distance?: number;
  pace?: string;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  perceivedFeeling?: string;
  roundsCompleted?: number;
}

const WorkoutHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<{ id: string; log: WorkoutLog }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLastThree, setShowLastThree] = useState<Record<string, boolean>>({});
  const [_refreshing, setRefreshing] = useState(false);

  // Helper function to get readable exercise name
  const getExerciseName = (exerciseId: string): string => {
    const exercise = resolveExerciseDetails(exerciseId);
    if (exercise && exercise.name) {
      return exercise.name;
    }
    // Fallback: format the ID if not found
    return exerciseId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const fetchLogs = async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.log('❌ No user ID found');
        if (showLoadingSpinner) setLoading(false);
        else setRefreshing(false);
        return;
      }

      console.log('📊 Fetching workout logs for user:', uid);
      const logRef = collection(db, 'users', uid, 'workoutLogs');
      const q = query(logRef, orderBy('completedAt', 'desc'));
      const snapshot = await getDocs(q);

      const logsData: { id: string; log: WorkoutLog }[] = [];
      snapshot.forEach(doc => {
        logsData.push({ id: doc.id, log: doc.data() as WorkoutLog });
      });

      console.log('📊 Loaded', logsData.length, 'workout logs');
      setLogs(logsData);
    } catch (err) {
      console.error('❌ Error loading workout logs:', err);
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  // Initial load only
  useEffect(() => {
    fetchLogs(true);
  }, []);

  // Refetch when screen comes into focus (without showing loading spinner)
  useFocusEffect(
    React.useCallback(() => {
      if (!loading) {
        fetchLogs(false);
      }
    }, [loading])
  );

  const toggleExpand = (id: string) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  const toggleShowLastThree = (name: string) => {
    setShowLastThree(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const getLastThreeSessions = (exerciseName: string) =>
    logs
      .filter(l => l.log.exercises?.some(ex => ex.name === exerciseName))
      .slice(0, 3);

  const renderSmartSummary = (log: WorkoutLog) => {
    // Handle cardio workouts differently
    if (log.workoutType === 'cardio') {
      return (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Cardio Summary</Text>
          <Text style={styles.summaryItem}>⏱️ Duration: {log.actualDuration} min</Text>
          {log.distance && <Text style={styles.summaryItem}>📏 Distance: {log.distance} mi</Text>}
          {log.pace && <Text style={styles.summaryItem}>⚡ Pace: {log.pace}</Text>}
          {log.roundsCompleted && <Text style={styles.summaryItem}>🔄 Rounds: {log.roundsCompleted}</Text>}
          {log.calories && <Text style={styles.summaryItem}>🔥 Calories: {log.calories}</Text>}
          {log.avgHeartRate && <Text style={styles.summaryItem}>❤️ Avg HR: {log.avgHeartRate} bpm</Text>}
        </View>
      );
    }

    // Handle strength workouts
    if (!log.exercises || log.exercises.length === 0) {
      return null;
    }

    let totalVolume = 0;
    let heaviest = 0;
    const freqMap: Record<string, number> = {};

    log.exercises.forEach(ex => {
      freqMap[ex.name] = (freqMap[ex.name] || 0) + 1;
      ex.sets.forEach(set => {
        const reps = parseInt(set.reps, 10);
        const weight = parseFloat(set.weight);
        if (!isNaN(reps) && !isNaN(weight)) {
          totalVolume += reps * weight;
          if (weight > heaviest) {heaviest = weight;}
        }
      });
    });

    const mostFrequentId = Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!mostFrequentId) return null;
    
    const mostFrequentName = getExerciseName(mostFrequentId);

    return (
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Smart Summary</Text>
        <Text style={styles.summaryItem}>💪 Volume: {totalVolume.toLocaleString()} lbs</Text>
        <Text style={styles.summaryItem}>🔁 Frequent: {mostFrequentName}</Text>
        <Text style={styles.summaryItem}>🏆 Heaviest: {heaviest} lbs</Text>
      </View>
    );
  };

  const formatDate = (timestamp: Timestamp) =>
    timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <ActivityIndicator size="large" color="#d32f2f" />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Workout History</Text>

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
  <Ionicons name="arrow-back" size={20} color="#fff" />
  <Text style={styles.backText}>Back</Text>
</Pressable>


        <Pressable style={styles.prButton} onPress={() => navigation.navigate('PRTracker')}>
          <Ionicons name="trophy-outline" size={20} color="#fff" />
          <Text style={styles.prButtonText}>View All-Time PRs</Text>
        </Pressable>

        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No Workout History</Text>
            <Text style={styles.emptyText}>
              Complete workouts to see them here. Your workout history will track all your progress!
            </Text>
          </View>
        ) : (
          logs
          .filter(l => {
            // Show all if no search query
            if (!searchQuery) return true;
            
            const query = searchQuery.toLowerCase();
            
            // Search in title
            if (l.log.dayTitle?.toLowerCase().includes(query)) return true;
            
            // Search in cardio type
            if (l.log.workoutType === 'cardio' && l.log.type?.toLowerCase().includes(query)) return true;
            
            // Search in exercises for strength workouts
            return l.log.exercises?.some(ex =>
              ex.name.toLowerCase().includes(query)
            ) || false;
          })
          .map(({ id, log }) => (
            <View key={id} style={styles.card}>
              <TouchableOpacity onPress={() => toggleExpand(id)} style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {log.dayTitle} — {formatDate(log.completedAt)}
                </Text>
                <Ionicons
                  name={expanded === id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
              {expanded === id && (
                <View style={styles.cardBody}>
                  {log.workoutType === 'cardio' ? (
                    // Cardio workout display
                    <View style={styles.cardioDetails}>
                      <Text style={styles.cardioType}>🏃 {log.type}</Text>
                      <Text style={styles.cardioStat}>⏱️ Duration: {log.actualDuration} min</Text>
                      {log.distance && <Text style={styles.cardioStat}>📏 Distance: {log.distance} mi</Text>}
                      {log.pace && <Text style={styles.cardioStat}>⚡ Pace: {log.pace}</Text>}
                      {log.roundsCompleted && <Text style={styles.cardioStat}>🔄 Rounds: {log.roundsCompleted}</Text>}
                      {log.calories && <Text style={styles.cardioStat}>🔥 Calories: {log.calories}</Text>}
                      {log.avgHeartRate && <Text style={styles.cardioStat}>❤️ Avg HR: {log.avgHeartRate} bpm</Text>}
                      {log.maxHeartRate && <Text style={styles.cardioStat}>💥 Max HR: {log.maxHeartRate} bpm</Text>}
                      {log.perceivedFeeling && (
                        <Text style={styles.cardioStat}>😊 Feeling: {log.perceivedFeeling}</Text>
                      )}
                    </View>
                  ) : log.exercises && log.exercises.length > 0 ? (
                    // Strength workout display
                    log.exercises.map((ex, idx) => {
                    const exerciseName = getExerciseName(ex.name);
                    return (
                    <View key={idx} style={styles.exerciseBlock}>
                      <View style={styles.exerciseRow}>
                        <Text style={styles.exerciseName}>{exerciseName}</Text>
                        <Pressable onPress={() => {
                          console.log('📊 Navigating to chart. ID:', ex.name, 'Name:', exerciseName);
                          navigation.navigate('ProgressChart', { exerciseName: ex.name });
                        }}>
                          <Ionicons name="stats-chart" size={16} color="#4fc3f7" />
                        </Pressable>
                      </View>
                      {ex.sets.map((set, sIdx) => (
                        <Text key={sIdx} style={styles.setText}>
                          Set {sIdx + 1}: {set.reps} reps @ {set.weight} lbs
                        </Text>
                      ))}
                      <Pressable onPress={() => toggleShowLastThree(ex.name)}>
                        <Text style={styles.toggleText}>
                          {showLastThree[ex.name] ? '− Hide' : '+ Show'} Last 3 Sessions
                        </Text>
                      </Pressable>
                      {showLastThree[ex.name] &&
                        getLastThreeSessions(ex.name).map((entry, i) => {
                          const match = entry.log.exercises?.find(e => e.name === ex.name);
                          return (
                            <View key={i} style={styles.lastSessionBox}>
                              <Text style={styles.sessionDate}>
                                {formatDate(entry.log.completedAt)}
                              </Text>
                              {match?.sets.map((s, j) => (
                                <Text key={j} style={styles.recentSet}>
                                  Set {j + 1}: {s.reps} reps @ {s.weight} lbs
                                </Text>
                              ))}
                            </View>
                          );
                        })}
                    </View>
                    );
                  })
                  ) : (
                    <Text style={styles.emptyText}>No workout data available</Text>
                  )}
                  {renderSmartSummary(log)}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  container: { flex: 1 },
  content: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  prButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  prButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 14,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  setText: {
    color: '#eee',
    fontSize: 13,
    marginLeft: 8,
  },
  toggleText: {
    color: '#4fc3f7',
    fontSize: 12,
    marginLeft: 8,
    marginTop: 4,
  },
  lastSessionBox: {
    backgroundColor: '#292929',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  sessionDate: {
    color: '#4fc3f7',
    fontWeight: '600',
    marginBottom: 4,
  },
  recentSet: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 8,
  },
  summary: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingTop: 10,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
  },
  summaryItem: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardioDetails: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 12,
  },
  cardioType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 12,
  },
  cardioStat: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 6,
    paddingLeft: 8,
  },
});

export default WorkoutHistoryScreen;
