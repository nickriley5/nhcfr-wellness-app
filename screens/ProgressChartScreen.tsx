import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { auth, db } from '../firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../App';
import { resolveExerciseDetails } from '../utils/exerciseUtils';

const screenWidth = Dimensions.get('window').width - 40;
type ProgressScreenRouteProp = RouteProp<RootStackParamList, 'ProgressChart'>;

interface WorkoutLog {
  completedAt: Timestamp;
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

  // Get readable exercise name for display
  const getReadableExerciseName = (): string => {
    const exercise = resolveExerciseDetails(exerciseName);
    if (exercise && exercise.name) {
      return exercise.name;
    }
    // Fallback: format the ID if not found
    return exerciseName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  useEffect(() => {
    console.log('📊 ProgressChart - Component mounted/updated');
    console.log('📊 ProgressChart - Received exerciseName:', exerciseName);
    
    const fetchLogs = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          console.log('📊 ProgressChart - No user ID');
          setLoading(false);
          return;
        }

        console.log('📊 ProgressChart - Fetching logs for exercise:', exerciseName);
        console.log('📊 ProgressChart - Exercise name length:', exerciseName.length);
        const logRef = collection(db, 'users', uid, 'workoutLogs');
        const snapshot = await getDocs(logRef);

        console.log('📊 ProgressChart - Total logs found:', snapshot.docs.length);

        const sortedLogs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as WorkoutLog & { id: string }))
          .sort((a, b) => {
            const aTime = a.completedAt && typeof a.completedAt.toDate === 'function' 
              ? a.completedAt.toDate().getTime() 
              : 0;
            const bTime = b.completedAt && typeof b.completedAt.toDate === 'function' 
              ? b.completedAt.toDate().getTime() 
              : 0;
            return aTime - bTime;
          });

        console.log('📊 ProgressChart - Sorted logs:', sortedLogs.length);

        const now = new Date();
        let filteredLogs = sortedLogs;

        if (dateRange === '7D') {
          filteredLogs = sortedLogs.filter(log => {
            if (!log.completedAt || typeof log.completedAt.toDate !== 'function') return false;
            const logDate = log.completedAt.toDate();
            const diff = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 7;
          });
        } else if (dateRange === '30D') {
          filteredLogs = sortedLogs.filter(log => {
            if (!log.completedAt || typeof log.completedAt.toDate !== 'function') return false;
            const logDate = log.completedAt.toDate();
            const diff = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 30;
          });
        }

        console.log('📊 ProgressChart - Filtered logs:', filteredLogs.length);

        const entries: number[] = [];
        const entryLabels: string[] = [];

        filteredLogs.forEach(log => {
          const exercise = log.exercises.find(ex => ex.name === exerciseName);
          if (exercise) {
            let value = 0;
            if (chartType === 'weight') {
              value = exercise.sets.reduce((acc, set) => acc + parseFloat(set.weight || '0'), 0);
            } else if (chartType === 'reps') {
              value = exercise.sets.reduce((acc, set) => acc + parseInt(set.reps || '0', 10), 0);
            } else if (chartType === 'volume') {
              value = exercise.sets.reduce(
                (acc, set) => acc + (parseInt(set.reps || '0', 10) * parseFloat(set.weight || '0')),
                0
              );
            }
            entries.push(value);
            
            // Format date label
            if (log.completedAt && typeof log.completedAt.toDate === 'function') {
              const date = log.completedAt.toDate();
              const label = `${date.getMonth() + 1}/${date.getDate()}`;
              entryLabels.push(label);
            }
          }
        });

        console.log('📊 ProgressChart - Data points:', entries);
        console.log('📊 ProgressChart - Labels:', entryLabels);

        setDataPoints(entries);
        setLabels(entryLabels);
      } catch (err) {
        console.error('❌ ProgressChart error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [chartType, dateRange, exerciseName]);

  console.log('📊 ProgressChart - Rendering. Loading:', loading, 'DataPoints:', dataPoints.length);

  if (loading) {
    console.log('📊 ProgressChart - Showing loading spinner');
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#d32f2f" />
            <Text style={{ color: '#fff', marginTop: 10 }}>Loading chart data...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  console.log('📊 ProgressChart - Rendering main content');
  console.log('📊 ProgressChart - Exercise name for title:', getReadableExerciseName());
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => {
          console.log('📊 Back button pressed');
          navigation.goBack();
        }}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>{getReadableExerciseName()} Progress</Text>
        
        {/* Debug text to confirm rendering */}
        <Text style={{ color: '#fff', fontSize: 12, marginBottom: 10 }}>
          Data points: {dataPoints.length} | Chart type: {chartType}
        </Text>

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
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No Progress Data</Text>
            <Text style={styles.emptyText}>
              Complete workouts with this exercise to see your progress here!
            </Text>
          </View>
        ) : dataPoints.length === 1 ? (
          <View style={styles.singleDataPoint}>
            <Ionicons name="bar-chart" size={48} color="#d32f2f" />
            <Text style={styles.singleDataTitle}>One Workout Logged!</Text>
            <Text style={styles.singleDataText}>
              {chartType === 'weight' && `Total Weight: ${dataPoints[0]} lbs`}
              {chartType === 'reps' && `Total Reps: ${dataPoints[0]}`}
              {chartType === 'volume' && `Total Volume: ${dataPoints[0]} lbs`}
            </Text>
            <Text style={styles.singleDataText}>Date: {labels[0]}</Text>
            <Text style={styles.singleDataSubtext}>
              Complete more workouts to see your progress trend!
            </Text>
          </View>
        ) : (
          <LineChart
            data={{ 
              labels, 
              datasets: [{ 
                data: dataPoints.map(d => d === 0 ? 0.1 : d) // Prevent zero values from breaking chart
              }] 
            }}
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
            bezier
          />
        )}
      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  singleDataPoint: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 30,
  },
  singleDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 16,
  },
  singleDataText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 8,
    fontWeight: '600',
  },
  singleDataSubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 16,
  },
  chart: {
    marginVertical: 16,
    borderRadius: 10,
  },
});

export default ProgressChartScreen;
