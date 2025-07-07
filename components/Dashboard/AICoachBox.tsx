import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AICoachBox = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💡 AI Coach</Text>
      <Text style={styles.sectionText}>
        Personalized fitness & recovery tips coming soon.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default AICoachBox;
