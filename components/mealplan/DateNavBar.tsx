import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { format, addDays } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';

interface Props {
  selectedDate: Date;
  onChange: (newDate: Date) => void;
}

const DateNavBar: React.FC<Props> = ({ selectedDate, onChange }) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const goPrevDay = () => onChange(addDays(selectedDate, -1));
  const goNextDay = () => onChange(addDays(selectedDate, 1));

  const formatted = format(selectedDate, 'EEE, MMM d');

  return (
    <>
      <View style={styles.container}>
        {/* Left arrow */}
        <Pressable onPress={goPrevDay} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>

        {/* Date label (tap to open calendar) */}
        <Pressable onPress={() => setShowCalendar(true)}>
          <Text style={styles.dateText}>{formatted}</Text>
        </Pressable>

        {/* Right arrow */}
        <Pressable onPress={goNextDay} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Calendar modal */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Calendar
              onDayPress={(day) => {
                const newDate = new Date(day.year, day.month - 1, day.day);
                onChange(newDate);
                setShowCalendar(false);
              }}
              markedDates={{
                [format(selectedDate, 'yyyy-MM-dd')]: { selected: true, selectedColor: '#4FC3F7' },
              }}
            />
            <Pressable onPress={() => setShowCalendar(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default DateNavBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 10,
    width: '90%',
  },
  closeBtn: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  closeText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
});
