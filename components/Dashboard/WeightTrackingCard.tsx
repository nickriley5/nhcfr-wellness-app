import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { auth, db } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  where,
  Timestamp,
} from 'firebase/firestore';

interface WeightEntry {
  id: string;
  weight: number;
  date: Date;
  notes?: string;
}

interface WeightGoal {
  currentWeight: number;
  targetWeight: number;
  weeklyGoal: number; // pounds per week (positive for gain, negative for loss)
  startDate: Date;
  targetDate?: Date;
}

interface WeightTrackingCardProps {
  onWeightUpdated?: () => void;
}

export interface WeightTrackingCardRef {
  openWeightModal: () => void;
}

type TimeRange = 'week' | 'month' | 'year';

const WeightTrackingCard = forwardRef<WeightTrackingCardRef, WeightTrackingCardProps>(({ onWeightUpdated }, ref) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const loadWeightData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      setLoading(true);

      // Load weight goal
      const goalDoc = await getDoc(doc(db, 'users', uid, 'goals', 'weight'));
      if (goalDoc.exists()) {
        const goalData = goalDoc.data();
        setWeightGoal({
          ...goalData,
          startDate: goalData.startDate?.toDate() || new Date(),
          targetDate: goalData.targetDate?.toDate(),
        } as WeightGoal);
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Load weight entries
      const weightsQuery = query(
        collection(db, 'users', uid, 'weightEntries'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'asc'),
        limit(100)
      );

      const querySnapshot = await getDocs(weightsQuery);
      const entries: WeightEntry[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        entries.push({
          id: docSnapshot.id,
          weight: data.weight,
          date: data.date.toDate(),
          notes: data.notes,
        });
      });

      setWeightEntries(entries);
    } catch (error) {
      console.error('Error loading weight data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadWeightData();
  }, [loadWeightData]);

  useImperativeHandle(ref, () => ({
    openWeightModal: () => setShowInputModal(true),
  }));

  const handleAddWeight = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !inputWeight) {
      return;
    }

    const weight = parseFloat(inputWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }

    try {
      // Add weight entry
      await addDoc(collection(db, 'users', uid, 'weightEntries'), {
        weight,
        date: Timestamp.fromDate(new Date()),
        notes: inputNotes.trim() || null,
      });

      // Update current weight in profile
      await setDoc(
        doc(db, 'users', uid),
        { currentWeight: weight },
        { merge: true }
      );

      // Update weight goal if it exists
      if (weightGoal) {
        await setDoc(
          doc(db, 'users', uid, 'goals', 'weight'),
          { currentWeight: weight },
          { merge: true }
        );
      }

      setInputWeight('');
      setInputNotes('');
      setShowInputModal(false);
      loadWeightData();
      onWeightUpdated?.();

      // Check progress and provide feedback
      if (weightGoal) {
        checkProgressAndAlert(weight);
      }
    } catch (error) {
      console.error('Error adding weight:', error);
      Alert.alert('Error', 'Failed to save weight entry.');
    }
  };

  const checkProgressAndAlert = (currentWeight: number) => {
    if (!weightGoal) {
      return;
    }

    const weeksPassed = Math.max(1, (Date.now() - weightGoal.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const expectedChange = weightGoal.weeklyGoal * weeksPassed;
    const actualChange = currentWeight - weightGoal.currentWeight;

    let message = '';
    let title = '';

    if (weightGoal.weeklyGoal < 0) { // Weight loss goal
      if (actualChange < expectedChange - 1) { // Losing too fast
        title = '⚠️ Losing Too Fast';
        message = 'You\'re losing weight faster than planned. Consider increasing calories slightly to maintain healthy progress.';
      } else if (actualChange > expectedChange + 1) { // Losing too slow
        title = '📊 Adjust Needed';
        message = 'Progress is slower than planned. Consider reducing calories by 100-200 to get back on track.';
      } else {
        title = '🎯 Great Progress!';
        message = 'You\'re right on track with your weight loss goal!';
      }
    } else if (weightGoal.weeklyGoal > 0) { // Weight gain goal
      if (actualChange > expectedChange + 1) { // Gaining too fast
        title = '⚠️ Gaining Too Fast';
        message = 'You\'re gaining weight faster than planned. Consider reducing calories slightly.';
      } else if (actualChange < expectedChange - 1) { // Gaining too slow
        title = '📊 Adjust Needed';
        message = 'Progress is slower than planned. Consider increasing calories by 200-300.';
      } else {
        title = '🎯 Great Progress!';
        message = 'You\'re right on track with your weight gain goal!';
      }
    }

    if (message) {
      Alert.alert(title, message);
    }
  };

  const getProjectedGoalDate = (): string => {
    if (!weightGoal || !weightEntries.length) {
      return 'Set a goal to see projection';
    }

    const recentEntries = weightEntries.slice(-4); // Last 4 weeks
    if (recentEntries.length < 2) {
      return 'Need more data for projection';
    }

    // Calculate average weekly change
    const timeSpan = (recentEntries[recentEntries.length - 1].date.getTime() - recentEntries[0].date.getTime()) / (7 * 24 * 60 * 60 * 1000);
    const weightChange = recentEntries[recentEntries.length - 1].weight - recentEntries[0].weight;
    const weeklyRate = weightChange / timeSpan;

    const remainingWeight = weightGoal.targetWeight - (weightEntries[weightEntries.length - 1]?.weight || weightGoal.currentWeight);
    const weeksToGoal = Math.abs(remainingWeight / weeklyRate);

    if (!isFinite(weeksToGoal)) {
      return 'Adjust your plan';
    }

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + weeksToGoal * 7);

    if (weeksToGoal > 104) { // More than 2 years
      return 'Goal may need adjustment';
    }

    return projectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getChartData = () => {
    if (weightEntries.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    // Sample data points based on time range
    let sampleSize = 7;
    if (timeRange === 'month') {
      sampleSize = 30;
    }
    if (timeRange === 'year') {
      sampleSize = 52;
    }

    const step = Math.max(1, Math.floor(weightEntries.length / sampleSize));
    const sampledEntries = weightEntries.filter((_, index) => index % step === 0);

    return {
      labels: sampledEntries.map(entry => {
        if (timeRange === 'week') {
          return entry.date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (timeRange === 'month') {
          return entry.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        } else {
          return entry.date.toLocaleDateString('en-US', { month: 'short' });
        }
      }),
      datasets: [{
        data: sampledEntries.map(entry => entry.weight),
        strokeWidth: 2,
      }],
    };
  };


  const currentWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : weightGoal?.currentWeight;
  const weightChange = weightEntries.length >= 2 ?
    weightEntries[weightEntries.length - 1].weight - weightEntries[weightEntries.length - 2].weight : 0;
      const changeColorStyle =
  weightChange > 0 ? styles.weightUp :
  weightChange < 0 ? styles.weightDown :
  styles.weightNeutral;

  if (loading) {
    return (
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Weight Tracking</Text>
        <Text style={styles.mutedText}>Loading...</Text>
      </View>
    );
  }

  const hasData = weightEntries.length > 0;
  const len = weightEntries.length;
  const useBezier = hasData && len >= 2;

  return (
    <>
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Weight Tracking</Text>

        {/* Current Weight Display */}
        <View style={styles.currentWeightRow}>
          <View>
            <Text style={styles.currentWeight}>
              {currentWeight ? `${currentWeight.toFixed(1)} lbs` : '-- lbs'}
            </Text>
            {weightChange !== 0 && (
              <Text style={[styles.weightChange, changeColorStyle]}>
  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lbs recent
</Text>
            )}
          </View>
          {weightGoal && (
            <View style={styles.goalInfo}>
              <Text style={styles.goalText}>
                Goal: {weightGoal.targetWeight} lbs
              </Text>
              <Text style={styles.projectionText}>
                ETA: {getProjectedGoalDate()}
              </Text>
            </View>
          )}
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
            <Pressable
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === 'week' ? '1W' : range === 'month' ? '1M' : '1Y'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Chart */}
        {weightEntries.length > 0 ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={getChartData()}
              width={Dimensions.get('window').width - 80}
              height={200}
              chartConfig={{
                backgroundColor: '#1f1f1f',
                backgroundGradientFrom: '#1f1f1f',
                backgroundGradientTo: '#1f1f1f',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(79, 195, 247, ${opacity})`, // #4FC3F7 blue
                labelColor: (opacity = 1) => `rgba(170, 170, 170, ${opacity})`, // #aaa
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#4FC3F7',
                },
              }}
              bezier={useBezier}
              style={styles.chart}
            />
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No weight data yet</Text>
            <Text style={styles.helperText}>Tap + to log your first weight entry</Text>
          </View>
        )}
      </View>

      {/* Weight Input Modal */}
      <Modal
        visible={showInputModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log Weight</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <TextInput
                style={styles.weightInput}
                value={inputWeight}
                onChangeText={setInputWeight}
                keyboardType="decimal-pad"
                placeholder="Enter weight"
                placeholderTextColor="#aaa"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={inputNotes}
                onChangeText={setInputNotes}
                placeholder="How are you feeling?"
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowInputModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddWeight}
              >
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
});

WeightTrackingCard.displayName = 'WeightTrackingCard';

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  tileHeader: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 20,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#33d6a6',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentWeight: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  weightChange: {
    fontSize: 14,
    marginTop: 2,
  },
  goalInfo: {
    alignItems: 'flex-end',
  },
  goalText: {
    fontSize: 14,
    color: '#aaa',
  },
  projectionText: {
    fontSize: 14,
    color: '#4FC3F7',
    marginTop: 2,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#33d6a6',
  },
  timeRangeText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#0b0f14',
  },
  chartContainer: {
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 16,
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 4,
  },
  helperText: {
    color: '#aaa',
    fontSize: 14,
  },
  mutedText: {
    color: '#aaa',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  weightInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a3a52',
  },
  notesInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#33d6a6',
  },
  modalButtonPrimaryText: {
    color: '#0b0f14',
    fontWeight: '700',
    fontSize: 16,
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a3a52',
  },
  modalButtonSecondaryText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 16,
  },
  weightUp: { color: '#ff6b47' },      // gained
  weightDown: { color: '#4FC3F7' },    // lost (matching our blue theme)
  weightNeutral: { color: '#aaa' }, // no change (optional)
});

export default WeightTrackingCard;
