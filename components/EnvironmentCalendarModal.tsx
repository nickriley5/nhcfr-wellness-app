import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PageHelpButton from './Common/PageHelpButton';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EnvironmentCalendarModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [trainingDays, setTrainingDays] = useState<Set<string>>(new Set());
  const [requiredRestDays, setRequiredRestDays] = useState<number>(2);

  const maxTrainingDays = Math.max(0, days.length - requiredRestDays);
  const recoveryDays = days.length - trainingDays.size;

  useEffect(() => {
    const loadData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      const profileSnap = await getDoc(doc(db, 'users', uid));
      const profile = profileSnap.data();
      const environmentMap = profile?.schedule?.environmentMap;
      const savedTrainingDays = profile?.schedule?.trainingDays;

      if (Array.isArray(savedTrainingDays)) {
        setTrainingDays(
          new Set(savedTrainingDays.filter((day: string) => days.includes(day)))
        );
      } else if (environmentMap) {
        setTrainingDays(
          new Set(days.filter((day) => environmentMap[day] && environmentMap[day] !== 'off'))
        );
      } else {
        setTrainingDays(new Set(['Mon', 'Tue', 'Thu', 'Fri', 'Sat']));
      }

      if (profile?.programMeta?.restDaysRequired) {
        setRequiredRestDays(profile.programMeta.restDaysRequired);
      } else {
        setRequiredRestDays(2);
      }
    };

    if (visible) {loadData();}
  }, [visible]);

  const handleToggleTrainingDay = (day: string) => {
    setTrainingDays((prev) => {
      const next = new Set(prev);

      if (next.has(day)) {
        next.delete(day);
        return next;
      }

      if (next.size >= maxTrainingDays) {
        Alert.alert(
          'Recovery Built In',
          `This program needs at least ${requiredRestDays} recovery day(s). Remove a training day before adding another.`
        );
        return prev;
      }

      next.add(day);
      return next;
    });
  };

  const handleSave = async () => {
    const selectedTrainingDays = days.filter((day) => trainingDays.has(day));
    const restDayCount = days.length - selectedTrainingDays.length;

    if (restDayCount < requiredRestDays) {
      Alert.alert(
        'Not Enough Rest Days',
        `This program requires at least ${requiredRestDays} rest day(s). Please adjust your selections.`
      );
      return;
    }

    if (selectedTrainingDays.length === 0) {
      Alert.alert(
        'Choose Training Days',
        'Pick at least one day you usually want available for training.'
      );
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          schedule: {
            environmentMap: buildEnvironmentMap(trainingDays),
            trainingDays: selectedTrainingDays,
          },
        },
        { merge: true }
      );

      Alert.alert('Schedule Saved', 'Your weekly training rhythm is ready.');
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="calendar-week" size={24} color="#fff" />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Weekly setup</Text>
              <Text style={styles.title}>Training Rhythm</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{trainingDays.size}</Text>
                <Text style={styles.summaryLabel}>Training days</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{recoveryDays}</Text>
                <Text style={styles.summaryLabel}>Recovery days</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Days available</Text>
                <Text style={styles.sectionMeta}>Max {maxTrainingDays} training</Text>
              </View>
              <View style={styles.dayGrid}>
                {days.map((day) => {
                  const isSelected = trainingDays.has(day);
                  return (
                    <Pressable
                      key={day}
                      style={[
                        styles.dayChip,
                        isSelected && styles.selectedDayChip,
                      ]}
                      onPress={() => handleToggleTrainingDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          isSelected && styles.selectedDayChipText,
                        ]}
                      >
                        {day}
                      </Text>
                      <Text
                        style={[
                          styles.dayChipMeta,
                          isSelected && styles.selectedDayChipMeta,
                        ]}
                      >
                        {isSelected ? 'Train' : 'Recover'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.recoveryNote}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#22c55e" />
              <Text style={styles.recoveryNoteText}>
                Minimum recovery stays locked at {requiredRestDays} day(s). Daily check-ins can still pause today without rewriting this rhythm.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.btnText}>Save Schedule</Text>
            </Pressable>
          </View>
          <PageHelpButton
            pageKey="weekly-schedule"
            title="Weekly Schedule Tips"
            intro="Set the normal weekly rhythm. Daily readiness can still adjust today without changing this plan."
            top={16}
            tips={[
              {
                title: 'Red days are training days',
                body: 'Tap days you usually want available for workouts. Untapped days become recovery days.',
              },
              {
                title: 'Rest days are protected',
                body: 'The app keeps the required number of recovery days based on the program so the schedule does not get overloaded.',
              },
              {
                title: 'This is your normal week',
                body: 'Use this for the usual plan. If one day goes sideways, the readiness check can recommend rest without rewriting the whole week.',
              },
            ]}
          />
        </View>
      </View>
    </Modal>
  );
};

const buildEnvironmentMap = (trainingDays: Set<string>) => (
  days.reduce<{ [key: string]: string }>((acc, day) => {
    acc[day] = trainingDays.has(day) ? 'gym' : 'off';
    return acc;
  }, {})
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#d32f2f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#253044',
    paddingVertical: 14,
    marginBottom: 18,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#253044',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionMeta: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  dayChip: {
    width: '31.8%',
    minHeight: 74,
    margin: 4,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayChip: {
    backgroundColor: '#d32f2f',
    borderColor: '#ef4444',
  },
  dayChipText: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '800',
  },
  selectedDayChipText: {
    color: '#fff',
  },
  dayChipMeta: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  selectedDayChipMeta: {
    color: '#fee2e2',
  },
  recoveryNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#10231b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f5138',
    padding: 12,
  },
  recoveryNoteText: {
    flex: 1,
    color: '#bbf7d0',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#374151',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#d32f2f',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default EnvironmentCalendarModal;
