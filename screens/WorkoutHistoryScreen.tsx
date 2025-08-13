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
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

interface WorkoutLog {
  dayTitle: string;
  completedAt: Timestamp;
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
  const [logs, setLogs] = useState<{ id: string; log: WorkoutLog }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLastThree, setShowLastThree] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {return;}

        const logRef = collection(db, 'users', uid, 'workoutLogs');
        const q = query(logRef, orderBy('completedAt', 'desc'));
        const snapshot = await getDocs(q);

        const logsData: { id: string; log: WorkoutLog }[] = [];
        snapshot.forEach(doc => {
          logsData.push({ id: doc.id, log: doc.data() as WorkoutLog });
        });

        setLogs(logsData);
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

  const toggleShowLastThree = (name: string) => {
    setShowLastThree(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const getLastThreeSessions = (exerciseName: string) =>
    logs
      .filter(l => l.log.exercises.some(ex => ex.name === exerciseName))
      .slice(0, 3);

  const renderSmartSummary = (log: WorkoutLog) => {
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

    const mostFrequent = Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0][0];

    return (
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Smart Summary</Text>
        <Text style={styles.summaryItem}>💪 Volume: {totalVolume.toLocaleString()} lbs</Text>
        <Text style={styles.summaryItem}>🔁 Frequent: {mostFrequent}</Text>
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


        <Pressable style={styles.prLink} onPress={() => navigation.navigate('PRTracker')}>
          <Ionicons name="trophy-outline" size={18} color="#4fc3f7" />
          <Text style={styles.prText}> View All-Time PRs</Text>
        </Pressable>

        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {logs
          .filter(l =>
            l.log.exercises.some(ex =>
              ex.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          )
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
                  {log.exercises.map((ex, idx) => (
                    <View key={idx} style={styles.exerciseBlock}>
                      <View style={styles.exerciseRow}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Pressable onPress={() => navigation.navigate('ProgressChart', { exerciseName: ex.name })}>
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
                          const match = entry.log.exercises.find(e => e.name === ex.name);
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
                  ))}
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
  prLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    justifyContent: 'center',
  },
  prText: {
    color: '#4fc3f7',
    fontSize: 14,
    marginLeft: 6,
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
});

export default WorkoutHistoryScreen;
