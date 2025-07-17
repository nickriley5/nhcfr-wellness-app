// components/macro/ZonePieChart.tsx
import React from 'react';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { View, Text } from 'react-native';
import styles from '../../styles/MacroPlanOverview.styles';

interface Props {
  protein: number;
  carbs: number;
  fats: number;
}

const ZonePieChart: React.FC<Props> = ({ protein, carbs, fats }) => {
  const total = protein + carbs + fats;
  const radius = 90;
  const cx = 100;
  const cy = 100;

  const segments = [
    { key: 'Protein', value: protein, color: '#3BA7F0' },
    { key: 'Carbs', value: carbs, color: '#6FCB82' },
    { key: 'Fats', value: fats, color: '#F25580' },
  ];

  // If all values are zero, don't attempt to draw a pie
  if (total === 0) {
    return (
      <View style={styles.zonePieContainer}>
        <Text style={styles.noDataText}>No blocks to display</Text>
      </View>
    );
  }

  let start = 0;

  return (
    <View style={styles.zonePieContainer}>
      {/* Pie chart */}
      <Svg height={200} width={200} style={styles.svg}>
        {segments.map((s, i) => {
          const angle = (s.value / total) * 2 * Math.PI;
          const x1 = cx + radius * Math.cos(start);
          const y1 = cy + radius * Math.sin(start);
          const x2 = cx + radius * Math.cos(start + angle);
          const y2 = cy + radius * Math.sin(start + angle);
          const largeArcFlag = angle > Math.PI ? 1 : 0;

          const d = `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;

          // mid angle for label placement
          const midAngle = start + angle / 2;
          const labelRadius = radius * 0.6;
          const labelX = cx + labelRadius * Math.cos(midAngle);
          const labelY = cy + labelRadius * Math.sin(midAngle);

          // calculate % of total & label text
          const percentage = Math.round((s.value / total) * 100);
          const labelText1 = `${percentage}%`;
          const labelText2 = `(${s.value} blocks)`;


          // increment for next slice
          start += angle;

          return (
            <React.Fragment key={i}>
              <Path d={d} fill={s.color} />
              {/* Slice text */}
              <SvgText
                x={labelX}
                y={labelY - 5}
                fill="#fff"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
              >
                {labelText1}
              </SvgText>
              <SvgText
                x={labelX}
                y={labelY + 8}
                fill="#fff"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {labelText2}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Total blocks */}
      <Text style={styles.totalBlocksGlow}>Total: {total} Blocks</Text>
    </View>
  );
};

export default ZonePieChart;
