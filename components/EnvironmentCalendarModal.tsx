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
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const options = [
  { label: 'Gym', value: 'gym', icon: 'dumbbell' },
  { label: 'Station', value: 'station', icon: 'fire-truck' },
  { label: 'Home', value: 'home', icon: 'home' },
  { label: 'Off / Recovery', value: 'off', icon: 'bed' },
];

const EnvironmentCalendarModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [selections, setSelections] = useState<{ [key: string]: string }>({});
  const [requiredRestDays, setRequiredRestDays] = useState<number>(2);

  useEffect(() => {
    const loadData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      const profileSnap = await getDoc(doc(db, 'users', uid));
      const profile = profileSnap.data();

      if (profile?.schedule?.environmentMap) {
        setSelections(profile.schedule.environmentMap);
      } else {
        setSelections({
          Mon: 'gym',
          Tue: 'station',
          Wed: 'station',
          Thu: 'home',
          Fri: 'gym',
          Sat: 'home',
          Sun: 'off',
        });
      }

      // Load rest days required from program
      if (profile?.programMeta?.restDaysRequired) {
        setRequiredRestDays(profile.programMeta.restDaysRequired);
      } else {
        setRequiredRestDays(2); // fallback if not defined
      }
    };

    if (visible) {loadData();}
  }, [visible]);

  const handleSelect = (day: string, value: string) => {
    setSelections((prev: { [key: string]: string }) => ({ ...prev, [day]: value }));
  };

  const handleSave = async () => {
    const restDayCount = Object.values(selections).filter((v) => v === 'off').length;

    if (restDayCount < requiredRestDays) {
      Alert.alert(
        'Not Enough Rest Days',
        `This program requires at least ${requiredRestDays} rest day(s). Please adjust your selections.`
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
            environmentMap: selections,
          },
        },
        { merge: true }
      );

      Alert.alert('Success', 'Weekly schedule saved!');
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
          <Text style={styles.title}>Set Weekly Training Environment</Text>
          <ScrollView>
            {days.map((day) => (
              <View key={day} style={styles.row}>
                <Text style={styles.dayLabel}>{day}</Text>
                <View style={styles.iconRow}>
                  {options.map((opt) => {
                    const isSelected = selections[day] === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[
                          styles.option,
                          isSelected && styles.selectedOption,
                        ]}
                        onPress={() => handleSelect(day, opt.value)}
                      >
                        <MaterialCommunityIcons
                          name={opt.icon}
                          size={26}
                          color={isSelected ? '#fff' : '#aaa'}
                        />
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.selectedText,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.requirementNote}>
            Required Rest Days: {requiredRestDays} (Off / Recovery)
          </Text>
          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.btnText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  requirementNote: {
    color: '#ccc',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  row: { marginBottom: 16 },
  dayLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    alignItems: 'center',
    padding: 10,
    width: '23%',
  },
  selectedOption: {
    backgroundColor: '#d32f2f',
  },
  optionText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#555',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default EnvironmentCalendarModal;
