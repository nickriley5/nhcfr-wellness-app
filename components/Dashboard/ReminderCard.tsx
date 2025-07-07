import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReminderCard = ({ text }: { text: string }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  text: {
    color: '#ffd54f',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ReminderCard;
