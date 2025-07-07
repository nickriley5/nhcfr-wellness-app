import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MoodEnergyChart from '../MoodEnergyChart';

interface Props {
  view: 'week' | 'month' | 'all';
  moodData: number[];
  energyData: number[];
  onViewChange: (v: 'week' | 'month' | 'all') => void;
}

const MoodEnergySection = ({ view, moodData, energyData, onViewChange }: Props) => {
  const views: ('week' | 'month' | 'all')[] = ['week', 'month', 'all'];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mood & Energy Trends</Text>

      <View style={styles.toggleGroup}>
        {views.map((k) => (
          <Pressable
            key={k}
            style={[styles.toggleButton, view === k && styles.toggleActive]}
            onPress={() => onViewChange(k)}
          >
            <Text style={styles.toggleText}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chartContainer}>
        <MoodEnergyChart moodData={moodData} energyData={energyData} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { width: '100%', marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  toggleActive: { backgroundColor: '#d32f2f' },
  toggleText: { color: '#fff', fontSize: 14 },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
  },
});

export default MoodEnergySection;
