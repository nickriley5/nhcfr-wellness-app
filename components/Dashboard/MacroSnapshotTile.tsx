// components/dashboard/MacroSnapshotTile.tsx
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type MacroRow = { eaten: number; goal?: number; remaining?: number };

type Props = {
  calories: MacroRow; // { eaten, goal, remaining }
  protein: MacroRow;
  carbs: MacroRow;
  fat: MacroRow;
  onLogFoodPress: () => void;
};

function Row({ label, row }: { label: string; row: MacroRow }) {
  const rem = row.remaining ?? (row.goal != null ? Math.max(0, row.goal - row.eaten) : undefined);
  return (
    <View style={styles.rowContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {row.eaten.toFixed(0)}
        {row.goal != null ? ` / ${row.goal.toFixed(0)}` : ''}{rem != null ? ` • Rem ${rem.toFixed(0)}` : ''}
      </Text>
    </View>
  );
}

export default memo(function MacroSnapshotTile({ calories, protein, carbs, fat, onLogFoodPress }: Props) {
  const remaining = calories.remaining ?? (calories.goal != null ? Math.max(0, calories.goal - calories.eaten) : undefined);

  return (
    <View style={styles.tileContainer}>
      <Text style={styles.header}>Macro Snapshot</Text>

      <View style={styles.remainingContainer}>
        <Text style={styles.remainingText}>
          Remaining: <Text style={styles.remainingValue}>
            {remaining != null ? remaining.toFixed(0) : '—'}
          </Text>
        </Text>
        <Text style={styles.infoText}>
          Eaten / Goal shown below (uses your per-item totals when available)
        </Text>
      </View>

      <Row label="Calories" row={calories} />
      <Row label="Protein"  row={protein} />
      <Row label="Carbs"    row={carbs} />
      <Row label="Fat"      row={fat} />

      <View style={styles.logFoodContainer}>
        <Pressable
          onPress={onLogFoodPress}
          style={styles.logFoodButton}>
          <Text style={styles.logFoodText}>Log Food</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  tileContainer: {
    backgroundColor: '#121822',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  logFoodContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  logFoodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#33d6a6',
  },
  logFoodText: {
    color: '#0b0f14',
    fontWeight: '700',
  },
  header: {
    color: '#e6edf3',
    fontWeight: '600',
    marginBottom: 6,
  },
  label: {
    color: '#c2cfdd',
  },
  value: {
    color: '#8ea0b6',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  remainingContainer: {
    marginBottom: 10,
  },
  remainingText: {
    color: '#c2cfdd',
  },
  remainingValue: {
    color: '#e6edf3',
    fontWeight: '700',
  },
  infoText: {
    color: '#8ea0b6',
    fontSize: 12,
  },
});
