import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

type TimeRange = '7days' | '30days' | '60days';

const WeightTrackingCard = forwardRef<WeightTrackingCardRef, WeightTrackingCardProps>(({ onWeightUpdated }, ref) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<{weight: number, date: Date, notes?: string} | null>(null);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    openWeightModal: () => setShowInputModal(true),
  }));

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

      // Calculate date range for rolling windows
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '60days':
          startDate.setDate(now.getDate() - 60);
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
        processedEntries: [],
      };
    }

    let processedEntries: WeightEntry[] = [];
    let labels: string[] = [];

    if (timeRange === '7days') {
      // Last 7 days: One entry per day (most recent if multiple)
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(now);
        dayDate.setDate(now.getDate() - i);
        dayDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(dayDate);
        nextDay.setDate(dayDate.getDate() + 1);

        // Find the most recent entry for this day
        const dayEntries = weightEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= dayDate && entryDate < nextDay;
        });

        if (dayEntries.length > 0) {
          // Get the most recent entry of the day
          const latestEntry = dayEntries.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
          processedEntries.push(latestEntry);

          // Label format: Mon, Tue, Wed, etc.
          labels.push(dayDate.toLocaleDateString('en-US', { weekday: 'short' }));
        }
      }
    } else if (timeRange === '30days') {
      // Last 30 days: Show every 2-3 days to avoid clutter, or weekly averages
      const now = new Date();
      const daysToShow = [];

      // Show every 3rd day for last 30 days (about 10 points)
      for (let i = 30; i >= 0; i -= 3) {
        const dayDate = new Date(now);
        dayDate.setDate(now.getDate() - i);
        daysToShow.push(dayDate);
      }

      daysToShow.forEach(dayDate => {
        const nextDay = new Date(dayDate);
        nextDay.setDate(dayDate.getDate() + 3); // 3-day window

        const windowEntries = weightEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= dayDate && entryDate < nextDay;
        });

        if (windowEntries.length > 0) {
          // Use the most recent entry in the 3-day window
          const latestEntry = windowEntries.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
          processedEntries.push(latestEntry);

          // Label format: 8/15, 8/18, etc.
          labels.push(dayDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }));
        }
      });
    } else { // 60days
      // Last 60 days: Weekly averages (about 8-9 points)
      const now = new Date();

      for (let week = 8; week >= 0; week--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (week * 7) - 6);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekEntries = weightEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });

        if (weekEntries.length > 0) {
          const avgWeight = weekEntries.reduce((sum, entry) => sum + entry.weight, 0) / weekEntries.length;
          const mostRecentEntry = weekEntries.sort((a, b) => b.date.getTime() - a.date.getTime())[0];

          processedEntries.push({
            ...mostRecentEntry,
            weight: avgWeight,
          });

          // Label format: Week of 8/1, 8/8, etc.
          labels.push(weekStart.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }));
        }
      }
    }

    // If no processed entries, show message
    if (processedEntries.length === 0) {
      return {
        labels: ['No recent data'],
        datasets: [{ data: [0] }],
        processedEntries: [],
      };
    }

    return {
      labels,
      datasets: [{
        data: processedEntries.map(entry => entry.weight),
        strokeWidth: 2,
      }],
      processedEntries,
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
        <View style={styles.tileHeaderRow}>
          <Text style={styles.tileHeader}>Weight Tracking</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowInputModal(true)}
          >
            <Ionicons name="add" size={20} color="#0b0f14" />
          </Pressable>
        </View>

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
          {(['7days', '30days', '60days'] as TimeRange[]).map((range) => (
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
                {range === '7days' ? '7D' : range === '30days' ? '30D' : '60D'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Chart */}
        {weightEntries.length > 0 ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={getChartData()}
              width={260}
              height={180}
              chartConfig={{
                backgroundColor: '#1f1f1f',
                backgroundGradientFrom: '#1f1f1f',
                backgroundGradientTo: '#1f1f1f',
                decimalPlaces: 1, // Show one decimal for precise weights
                color: (opacity = 1) => `rgba(79, 195, 247, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(170, 170, 170, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#4FC3F7',
                  fill: '#4FC3F7',
                },
                formatYLabel: (value) => {
                  const num = parseFloat(value);
                  return num.toFixed(1);
                },
                propsForVerticalLabels: {
                  fontSize: 10,
                  fill: '#aaa',
                },
                propsForHorizontalLabels: {
                  fontSize: 9,
                  fill: '#aaa',
                },
              }}
              bezier={useBezier}
              style={styles.chart}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withInnerLines={false}
              withOuterLines={false}
              yAxisLabel=""
              yAxisSuffix=""
              segments={3}
              fromZero={false}
              yLabelsOffset={8}
              xLabelsOffset={5}
              onDataPointClick={(data) => {
                const chartData = getChartData();
                if (chartData.processedEntries && chartData.processedEntries[data.index]) {
                  setSelectedPoint(chartData.processedEntries[data.index]);
                }
              }}
            />

            {/* Point Tooltip */}
            {selectedPoint && (
              <View style={styles.tooltip}>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipWeight}>{selectedPoint.weight.toFixed(1)} lbs</Text>
                  <Text style={styles.tooltipDate}>
                    {selectedPoint.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: timeRange === '60days' ? 'numeric' : undefined,
                    })}
                  </Text>
                  {selectedPoint.notes && (
                    <Text style={styles.tooltipNotes}>"{selectedPoint.notes}"</Text>
                  )}
                  <Pressable
                    style={styles.tooltipClose}
                    onPress={() => setSelectedPoint(null)}
                  >
                    <Text style={styles.tooltipCloseText}>×</Text>
                  </Pressable>
                </View>
              </View>
            )}
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
    paddingHorizontal: 5, // Reduced padding for tighter fit
    paddingTop: 5, // Reduced top padding
    paddingBottom: 10, // Reduced bottom padding
    marginHorizontal: -5, // Compensate for horizontal padding
    overflow: 'visible', // Allow labels to be fully visible
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

  // Tooltip styles
  tooltip: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  tooltipContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4FC3F7',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipWeight: {
    color: '#4FC3F7',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  tooltipDate: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  tooltipNotes: {
    color: '#aaa',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  tooltipClose: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipCloseText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WeightTrackingCard;
