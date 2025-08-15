import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { getNutritionGuidance } from '../utils/adaptiveNutrition';

interface WeightGoal {
  currentWeight: number;
  targetWeight: number;
  weeklyGoal: number;
  startDate: Date;
}

const WeighInScreen = () => {
  const navigation = useNavigation();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [guidance, setGuidance] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      // Load weight goal
      const goalDoc = await getDoc(doc(db, 'users', uid, 'goals', 'weight'));
      if (goalDoc.exists()) {
        const goalData = goalDoc.data();
        setWeightGoal({
          ...goalData,
          startDate: goalData.startDate?.toDate() || new Date(),
        } as WeightGoal);
      }

      // Load last weight entry
      const lastWeightQuery = query(
        collection(db, 'users', uid, 'weightEntries'),
        orderBy('date', 'desc'),
        limit(1)
      );
      const lastWeightSnap = await getDocs(lastWeightQuery);
      if (!lastWeightSnap.empty) {
        const lastEntry = lastWeightSnap.docs[0].data();
        setLastWeight(lastEntry.weight);
      }

      // Load nutrition guidance
      const nutritionGuidance = await getNutritionGuidance(uid);
      setGuidance(nutritionGuidance);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSaveWeight = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !weight) {
      return;
    }

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }

    try {
      setLoading(true);

      // Add weight entry
      await addDoc(collection(db, 'users', uid, 'weightEntries'), {
        weight: weightValue,
        date: Timestamp.fromDate(new Date()),
        notes: notes.trim() || null,
      });

      // Update current weight in profile
      await setDoc(
        doc(db, 'users', uid),
        { currentWeight: weightValue },
        { merge: true }
      );

      // Update weight goal if it exists
      if (weightGoal) {
        await setDoc(
          doc(db, 'users', uid, 'goals', 'weight'),
          { currentWeight: weightValue },
          { merge: true }
        );
      }

      // Show success and provide feedback
      let message = 'Weight logged successfully!';
      if (lastWeight && weightGoal) {
        const change = weightValue - lastWeight;
        const isLoss = weightGoal.weeklyGoal < 0;

        if (Math.abs(change) > 0.1) {
          if ((isLoss && change < 0) || (!isLoss && change > 0)) {
            message += ` Great progress - ${Math.abs(change).toFixed(1)} lbs in the right direction!`;
          } else {
            message += ` ${Math.abs(change).toFixed(1)} lbs change noted.`;
          }
        }
      }

      Alert.alert('Weight Logged! 📊', message, [
        {
          text: 'View Dashboard',
          onPress: () => navigation.goBack(),
        },
      ]);

      setWeight('');
      setNotes('');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error saving weight:', error);
      Alert.alert('Error', 'Failed to save weight entry.');
    } finally {
      setLoading(false);
    }
  };

  const getWeightChangeDisplay = () => {
    if (!lastWeight || !weight) {
      return null;
    }

    const currentWeight = parseFloat(weight);
    if (isNaN(currentWeight)) {
      return null;
    }

    const change = currentWeight - lastWeight;
    if (Math.abs(change) < 0.1) {
      return null;
    }

    const color = change > 0 ? '#ff6b47' : '#33d6a6';
    return (
      <Text style={[styles.weightChange, { color }]}>
        {change > 0 ? '+' : ''}{change.toFixed(1)} lbs from last weigh-in
      </Text>
    );
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#e6edf3" />
            </Pressable>
            <Text style={styles.title}>Weekly Weigh-In</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Current Goal Display */}
          {weightGoal && (
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>Your Goal</Text>
              <View style={styles.goalRow}>
                <View style={styles.goalItem}>
                  <Text style={styles.goalValue}>{weightGoal.targetWeight} lbs</Text>
                  <Text style={styles.goalLabel}>Target</Text>
                </View>
                <View style={styles.goalItem}>
                  <Text style={styles.goalValue}>
                    {weightGoal.weeklyGoal > 0 ? '+' : ''}{weightGoal.weeklyGoal} lbs/wk
                  </Text>
                  <Text style={styles.goalLabel}>Rate</Text>
                </View>
              </View>
            </View>
          )}

          {/* Weight Input */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Today's Weight</Text>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={styles.weightInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="Enter weight"
                placeholderTextColor="#8ea0b6"
                autoFocus
              />
              <Text style={styles.unitLabel}>lbs</Text>
            </View>
            {getWeightChangeDisplay()}
          </View>

          {/* Notes Input */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How are you feeling? Any observations?"
              placeholderTextColor="#8ea0b6"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Nutrition Guidance */}
          {guidance && (
            <View style={styles.guidanceCard}>
              <View style={styles.guidanceHeader}>
                <Ionicons name="bulb" size={20} color="#33d6a6" />
                <Text style={styles.guidanceTitle}>Nutrition Insights</Text>
              </View>
              <Text style={styles.guidanceText}>{guidance}</Text>
            </View>
          )}

          {/* Save Button */}
          <Pressable
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveWeight}
            disabled={loading || !weight}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Log Weight'}
            </Text>
          </Pressable>

          {/* Help Text */}
          <Text style={styles.helpText}>
            💡 Weigh yourself at the same time each week, preferably in the morning before eating,
            for the most consistent tracking.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#152436',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e6edf3',
  },
  placeholder: {
    width: 40,
  },
  goalCard: {
    backgroundColor: '#0c151f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#152436',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6edf3',
    marginBottom: 12,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalItem: {
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#33d6a6',
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 12,
    color: '#8ea0b6',
  },
  inputCard: {
    backgroundColor: '#0c151f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#152436',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6edf3',
    marginBottom: 12,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#152436',
    borderRadius: 8,
    padding: 16,
    color: '#e6edf3',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#2a3a52',
  },
  unitLabel: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#8ea0b6',
  },
  weightChange: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#152436',
    borderRadius: 8,
    padding: 12,
    color: '#e6edf3',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a3a52',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  guidanceCard: {
    backgroundColor: '#0c151f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#152436',
    borderLeftWidth: 4,
    borderLeftColor: '#33d6a6',
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6edf3',
    marginLeft: 8,
  },
  guidanceText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#c2cfdd',
  },
  saveButton: {
    backgroundColor: '#33d6a6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#2a4a3d',
  },
  saveButtonText: {
    color: '#0b0f14',
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 12,
    color: '#8ea0b6',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default WeighInScreen;
