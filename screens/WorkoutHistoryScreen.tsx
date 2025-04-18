// Updated WorkoutHistoryScreen with clean toggle and unified chart style
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
import {
  useNavigation,
  NavigationProp,
} from '@react-navigation/native';
import { RootStackParamList } from '../App';

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
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Record<string, WorkoutLog>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLastThree, setShowLastThree] = useState<Record<string, boolean>>({});

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

  const toggleShowLastThree = (exerciseName: string) => {
    setShowLastThree(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName],
    }));
  };

  const matchesSearch = (log: WorkoutLog) => {
    if (!searchQuery.trim()) return true;
    return log.exercises.some(ex =>
      ex.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  };

  const getLastThreeSessions = (exerciseName: string) => {
    const entries = Object.entries(logs)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([id, log]) => ({ id, ...log }))
      .filter(log =>
        log.exercises.some(ex =>
          ex.name.toLowerCase() === exerciseName.toLowerCase()
        )
      );
    return entries.slice(0, 3);
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

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by exercise name..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

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
                        <View style={styles.progressRow}>
                          <Text style={styles.exerciseName}>{ex.name}</Text>
                          <Pressable
                            onPress={() =>
                              navigation.navigate('ProgressChart', {
                                exerciseName: ex.name,
                              })
                            }
                          >
                            <Ionicons name="stats-chart" size={16} color="#4fc3f7" />
                          </Pressable>
                        </View>
                        {ex.sets.map((set, setIndex) => (
                          <Text key={setIndex} style={styles.setText}>
                            Set {setIndex + 1}: {set.reps} reps @ {set.weight} lbs
                          </Text>
                        ))}

                        <Pressable onPress={() => toggleShowLastThree(ex.name)}>
                          <Text style={styles.toggleLast3}>
                            {showLastThree[ex.name] ? '− Hide Last 3 Sessions' : '+ Show Last 3 Sessions'}
                          </Text>
                        </Pressable>

                        {showLastThree[ex.name] && (
                          <View>
                            {getLastThreeSessions(ex.name).map((entry, index) => {
                              const match = entry.exercises.find(e => e.name === ex.name);
                              return (
                                <View key={index}>
                                  {match?.sets.map((set, sIdx) => (
                                    <Text key={sIdx} style={styles.recentSet}>
                                      {entry.id}: {set.reps} reps @ {set.weight} lbs
                                    </Text>
                                  ))}
                                </View>
                              );
                            })}
                          </View>
                        )}
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  toggleLast3: {
    fontSize: 12,
    color: '#4fc3f7',
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 8,
  },
  recentSet: {
    color: '#bbb',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default WorkoutHistoryScreen;