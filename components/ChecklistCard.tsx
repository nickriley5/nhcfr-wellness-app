import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ChecklistCardProps {
  checkedIn: boolean;
  isWeighInDay: boolean;
  goalMessage: string;
  onPress?: () => void;
}

const ChecklistCard: React.FC<ChecklistCardProps> = ({
  checkedIn,
  isWeighInDay,
  goalMessage,
  onPress,
}) => {
  let message = goalMessage;
  if (!checkedIn) {
    message = 'Tap to complete your daily check-in';
  } else if (isWeighInDay) {
    message = 'Time for your weekly weigh-in';
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>Daily Checklist</Text>
      <Text style={styles.message}>{message}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    color: '#bbb',
    fontSize: 14,
  },
});

export default ChecklistCard;
