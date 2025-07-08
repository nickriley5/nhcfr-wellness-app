// components/macro/ZonePieChart.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { StyleSheet, View, Text } from 'react-native';

interface Props {
  protein: number;
  carbs: number;
  fats: number;
}

const ZonePieChart: React.FC<Props> = ({ protein, carbs, fats }) => {
  const total = protein + carbs + fats;
  const r = 90;
  const cx = 100;
  const cy = 100;

  const segments = [
    { key: 'Protein', value: protein, color: '#4FC3F7' },
    { key: 'Carbs', value: carbs, color: '#81C784' },
    { key: 'Fats', value: fats, color: '#F06292' },
  ];

  // If all values are zero, don't attempt to draw a pie
  if (total === 0) {
    return (
      <View style={styles.svg}>
        <Text style={styles.noDataText}>No data to display</Text>
      </View>
    );
  }

  let start = 0;

  return (
    <Svg height={200} width={200} style={styles.svg}>
      {segments.map((s, i) => {
        const angle = (s.value / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(start + angle);
        const y2 = cy + r * Math.sin(start + angle);
        const large = angle > Math.PI ? 1 : 0;
        const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
        start += angle;
        return <Path key={i} d={d} fill={s.color} />;
      })}
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  noDataText: {
    color: '#ccc',
    textAlign: 'center',
  },
});

export default ZonePieChart;
