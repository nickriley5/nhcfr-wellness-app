import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../App';

const screenWidth = Dimensions.get('window').width - 40;
type ProgressScreenRouteProp = RouteProp<RootStackParamList, 'ProgressChart'>;

interface WorkoutLog {
  completedAt: string;
  exercises: {
    name: string;
    sets: {
      weight: string;
      reps: string;
    }[];
  }[];
}

const ProgressChartScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ProgressScreenRouteProp>();
  const { exerciseName } = route.params;

  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'weight' | 'reps' | 'volume'>('weight');
  const [dateRange, setDateRange] = useState<'7D' | '30D' | 'ALL'>('ALL');
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {return;}

        const logRef = collection(db, 'users', uid, 'workoutLogs');
        const snapshot = await getDocs(logRef);

        const sortedLogs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.id.localeCompare(b.id)) as (WorkoutLog & { id: string })[];

        const now = new Date();
        let filteredLogs = sortedLogs;

        if (dateRange === '7D') {
          filteredLogs = sortedLogs.filter(log => {
            const logDate = new Date(log.id);
            const diff = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 7;
          });
        } else if (dateRange === '30D') {
          filteredLogs = sortedLogs.filter(log => {
            const logDate = new Date(log.id);
            const diff = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 30;
          });
        }

        const entries: number[] = [];
        const entryLabels: string[] = [];

        filteredLogs.forEach(log => {
          const exercise = log.exercises.find(ex => ex.name === exerciseName);
          if (exercise) {
            let value = 0;
            if (chartType === 'weight') {
              value = exercise.sets.reduce((acc, set) => acc + parseInt(set.weight || '0', 10), 0);
            } else if (chartType === 'reps') {
              value = exercise.sets.reduce((acc, set) => acc + parseInt(set.reps || '0', 10), 0);
            } else if (chartType === 'volume') {
              value = exercise.sets.reduce(
                (acc, set) => acc + (parseInt(set.reps || '0', 10) * parseInt(set.weight || '0', 10)),
                0
              );
            }
            entries.push(value);
            entryLabels.push(log.id.slice(5));
          }
        });

        setDataPoints(entries);
        setLabels(entryLabels);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [chartType, dateRange, exerciseName]);

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
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>{exerciseName} Progress</Text>

        <View style={styles.toggleGroup}>
          {(['weight', 'reps', 'volume'] as const).map(key => (
            <Pressable
              key={key}
              style={[styles.toggleButton, chartType === key && styles.toggleActive]}
              onPress={() => setChartType(key)}
            >
              <Text style={styles.toggleText}>{key.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.rangeGroup}>
          {(['7D', '30D', 'ALL'] as const).map(key => (
            <Pressable
              key={key}
              style={[styles.rangeButton, dateRange === key && styles.rangeActive]}
              onPress={() => setDateRange(key)}
            >
              <Text style={styles.rangeText}>{key}</Text>
            </Pressable>
          ))}
        </View>

        {dataPoints.length === 0 ? (
          <Text style={styles.emptyText}>No data available for this exercise yet.</Text>
        ) : (
          <LineChart
            data={{ labels, datasets: [{ data: dataPoints }] }}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#1c1c1c',
              backgroundGradientTo: '#1c1c1c',
              color: () => '#d32f2f',
              labelColor: () => '#fff',
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#fff' },
            }}
            style={styles.chart}
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginBottom: 20,
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  toggleActive: {
    backgroundColor: '#d32f2f',
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
  },
  rangeGroup: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rangeButton: {
    backgroundColor: '#444',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  rangeActive: {
    backgroundColor: '#4fc3f7',
  },
  rangeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 40,
  },
  chart: {
    marginVertical: 16,
    borderRadius: 10,
  },
});

export default ProgressChartScreen;
