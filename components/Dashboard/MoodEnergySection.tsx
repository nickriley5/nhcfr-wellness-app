import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type Range = 'week' | 'month' | 'all';

interface Props {
  view: Range;
  moodData: number[];    // 1–5 scale
  energyData: number[];  // 1–5 scale
  onViewChange: (v: Range) => void;
}

export default function MoodEnergySection({
  view,
  moodData,
  energyData,
  onViewChange,
}: Props) {
  const [chartWidth, setChartWidth] = React.useState(0);
  const ranges: Range[] = ['week', 'month', 'all'];

  // Debug: Log when view or data changes
  React.useEffect(() => {
    console.log(`🔄 MoodEnergySection - view: ${view}, moodData: [${moodData.join(', ')}], energyData: [${energyData.join(', ')}]`);
  }, [view, moodData, energyData]);

  // Keep both series the same length so lines align
  const len = Math.min(moodData.length, energyData.length);
  const hasData = len > 0;

  // Labels are minimal to keep the card clean (you can swap in dates if desired)
  const labels = hasData ? Array.from({ length: len }).map(() => '') : [''];

  const data = hasData
    ? {
        labels,
        datasets: [
          { data: moodData.slice(-len), color: () => '#4FC3F7', strokeWidth: 3 }, // blue
          { data: energyData.slice(-len), color: () => '#81C784', strokeWidth: 3 }, // green
        ],
        legend: ['Mood', 'Energy'],
      }
    : { labels: [''], datasets: [{ data: [0] }] };

  const useBezier = hasData && len >= 2;

  return (
    <View style={styles.tile}>
      <View style={styles.headerRow}>
        <Text style={styles.tileHeader}>Mood & Energy Trends</Text>
        <Text style={styles.entryCount}>
          {moodData.length} entries
        </Text>
      </View>

      <View style={styles.rangeRow}>
        {ranges.map((r) => (
          <Pressable
            key={r}
            onPress={() => onViewChange(r)}
            style={[styles.rangeBtn, view === r && styles.rangeBtnActive]}
          >
            <Text style={[styles.rangeText, view === r && styles.rangeTextActive]}>
              {r === 'week' ? '1W' : r === 'month' ? '1M' : 'All'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View
        style={styles.chartContainer}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
      >
        {hasData ? (
          <LineChart
            data={data}
            width={chartWidth || 1}
            height={180}
            bezier={useBezier}
            segments={4}
            transparent={true}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              color: (o = 1) => `rgba(255,255,255,${o})`,
              labelColor: (o = 1) => `rgba(170,170,170,${o})`,
              propsForDots: { r: '5', strokeWidth: '2', stroke: '#ffffff' },
            }}
            style={styles.chart}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No check-in data yet. Log mood & energy to see trends.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileHeader: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  entryCount: {
    color: '#aaa',
    fontSize: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 8,
  },
  rangeBtnActive: {
    backgroundColor: '#33d6a6',
  },
  rangeText: {
    color: '#9aa4ad',
    fontWeight: '700',
  },
  rangeTextActive: {
    color: '#0b0b0b',
  },
  chartContainer: {
    width: '100%',
  },
  chart: {
    borderRadius: 12,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
