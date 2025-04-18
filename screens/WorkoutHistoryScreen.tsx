// Cleaned and fixed WorkoutHistoryScreen with all helper functions defined
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

  const renderTopProgressPanel = () => {
    const totalWorkouts = Object.keys(logs).length;
    let totalVolume = 0;
    const allExercises: string[] = [];
    let lastWorkoutDate = '';

    Object.entries(logs).forEach(([id, log]) => {
      lastWorkoutDate = id > lastWorkoutDate ? id : lastWorkoutDate;
      log.exercises.forEach(ex => {
        allExercises.push(ex.name);
        ex.sets.forEach(set => {
          const reps = parseInt(set.reps);
          const weight = parseFloat(set.weight);
          if (!isNaN(reps) && !isNaN(weight)) {
            totalVolume += reps * weight;
          }
        });
      });
    });

    const freqMap: Record<string, number> = {};
    allExercises.forEach(name => {
      freqMap[name] = (freqMap[name] || 0) + 1;
    });
    const topExercises = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name)
      .join(', ');

    return (
      <View style={styles.panelContainer}>
        <Text style={styles.panelTitle}>Your Training Stats</Text>
        <View style={styles.panelItem}>
          <Ionicons name="calendar-outline" size={16} color="#4fc3f7" />
          <Text style={styles.panelText}>Total Workouts: {totalWorkouts}</Text>
        </View>
        <View style={styles.panelItem}>
          <Ionicons name="barbell-outline" size={16} color="#4fc3f7" />
          <Text style={styles.panelText}>Lifetime Volume: {totalVolume.toLocaleString()} lbs</Text>
        </View>
        <View style={styles.panelItem}>
          <Ionicons name="repeat-outline" size={16} color="#4fc3f7" />
          <Text style={styles.panelText}>Top Exercises: {topExercises}</Text>
        </View>
        <View style={styles.panelItem}>
          <Ionicons name="time-outline" size={16} color="#4fc3f7" />
          <Text style={styles.panelText}>Last Workout: {lastWorkoutDate}</Text>
        </View>
      </View>
    );
  };

  const renderSmartSummary = (log: WorkoutLog) => {
    let totalVolume = 0;
    let heaviest = 0;
    const freqMap: Record<string, number> = {};

    log.exercises.forEach(ex => {
      freqMap[ex.name] = (freqMap[ex.name] || 0) + 1;
      ex.sets.forEach(set => {
        const reps = parseInt(set.reps);
        const weight = parseFloat(set.weight);
        if (!isNaN(reps) && !isNaN(weight)) {
          totalVolume += reps * weight;
          if (weight > heaviest) heaviest = weight;
        }
      });
    });

    const mostFrequent = Object.entries(freqMap).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0];

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Smart Summary</Text>
        <View style={styles.summaryItem}>
          <Ionicons name="barbell-outline" size={16} color="#4fc3f7" />
          <Text style={styles.summaryText}>Total Volume: {totalVolume.toLocaleString()} lbs</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="repeat-outline" size={16} color="#4fc3f7" />
          <Text style={styles.summaryText}>Most Performed: {mostFrequent}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="trophy-outline" size={16} color="#4fc3f7" />
          <Text style={styles.summaryText}>Heaviest Lift: {heaviest} lbs</Text>
        </View>
      </View>
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

        {/* 🔙 Moved Back Button to Top */}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {/* 📊 Top-of-Page Progress Panel */}
        {renderTopProgressPanel()}

{/* 🏆 View All-Time PRs Button */}
<Pressable style={styles.prButton} onPress={() => navigation.navigate('PRTracker')}>
  <Ionicons name="trophy-outline" size={16} color="#4fc3f7" />
  <Text style={styles.prButtonText}>View All-Time PRs</Text>
</Pressable>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by exercise name..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* 📘 Workout Cards Below */}
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
                                <View key={index} style={styles.sessionBox}>
  <Text style={styles.sessionDate}>{entry.id}</Text>
  {match?.sets.map((set, sIdx) => (
    <Text key={sIdx} style={styles.recentSet}>
      Set {sIdx + 1}: {set.reps} reps @ {set.weight} lbs
    </Text>
  ))}
</View>

                              );
                            })}
                          </View>
                        )}
                      </View>
                    ))}

                  {/* 📌 Insert Smart Summary under the workout details */}
                  {renderSmartSummary(log)}
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
  summaryContainer: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryText: {
    color: '#ddd',
    marginLeft: 8,
    fontSize: 13,
  },
  panelContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    borderColor: '#444',
    borderWidth: 1,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  panelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  panelText: {
    color: '#ccc',
    marginLeft: 8,
    fontSize: 13,
  },
  prButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  prButtonText: {
    color: '#4fc3f7',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  }, 
  sessionBox: {
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
    backgroundColor: '#292929',
  }, 
  sessionDate: {
    color: '#4fc3f7',
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default WorkoutHistoryScreen;
