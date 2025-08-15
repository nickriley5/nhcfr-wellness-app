// components/Dashboard/DashboardHeader.tsx
import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';

interface DashboardHeaderProps {
  onCalendarPress: () => void;
}

export default function DashboardHeader({ onCalendarPress }: DashboardHeaderProps) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerContent}>
        <Text style={styles.header}>Your Dashboard</Text>
        <Text style={styles.subheader}>Train for duty. Fuel for life. 🔥</Text>
      </View>
      <Pressable
        style={styles.calendarButton}
        onPress={onCalendarPress}
      >
        <Text style={styles.calendarIcon}>📅</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  headerContent: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 16,
    fontWeight: '500',
  },
  calendarButton: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  calendarIcon: {
    fontSize: 20,
  },
});
