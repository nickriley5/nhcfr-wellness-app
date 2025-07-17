import React from 'react';
import { View, Text } from 'react-native';
import styles from '../../styles/ZoneLegend.styles';

interface Props {
  colors: {
    protein: string;
    carbs: string;
    fat: string;
  };
}

const ZoneLegend: React.FC<Props> = ({ colors }) => {
  const legendItems = [
    { label: 'Protein', color: colors.protein },
    { label: 'Carbs', color: colors.carbs },
    { label: 'Fats', color: colors.fat },
  ];

  return (
    <View style={styles.legendContainer}>
      {legendItems.map((item, idx) => (
        <View key={idx} style={styles.legendRow}>
          {/* Colored dot with subtle glow */}
          <View style={[styles.colorDot, { backgroundColor: item.color, shadowColor: item.color }]} />
          <Text style={styles.legendLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

export default ZoneLegend;
