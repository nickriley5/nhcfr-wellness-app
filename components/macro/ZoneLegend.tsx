import React from 'react';
import { View, Text } from 'react-native';
// Fix the path below if necessary, or replace with actual inline styles
import styles from '../../styles/MacroPlanOverview.styles';

interface Props {
  colors: {
    protein: string;
    carbs: string;
    fat: string;
  };
}

const ZoneLegend: React.FC<Props> = ({ colors }) => (
  <View style={styles.zoneLegend}>
    {[
      { label: 'Protein', color: colors.protein },
      { label: 'Carbs', color: colors.carbs },
      { label: 'Fats', color: colors.fat },
    ].map((item, idx) => (
      <View key={idx} style={styles.legendRow}>
        <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
        <Text style={styles.legendText}>{item.label}</Text>
      </View>
    ))}
  </View>
);

export default ZoneLegend;
