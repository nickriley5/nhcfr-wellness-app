import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface Props {
  weeklyData: { day?: string; protein: number; carbs: number; fat: number }[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
}

const barWidth = 28;
const chartHeight = 140;

const colors = {
  protein: '#4FC3F7',
  carbs: '#81C784',
  fat: '#F06292',
};

const calorieFrom = (p: number, c: number, f: number) =>
  p * 4 + c * 4 + f * 9;

const MacroBarChart: React.FC<Props> = ({ weeklyData, selectedDayIndex, onSelectDay }) => {
  return (
    <View style={styles.container}>
      {weeklyData.map((day, i) => {
        const total = calorieFrom(day.protein, day.carbs, day.fat) || 1;
        const proteinHeight = (day.protein * 4 / total) * chartHeight;
        const carbsHeight = (day.carbs * 4 / total) * chartHeight;
        const fatHeight = (day.fat * 9 / total) * chartHeight;
        const isSelected = selectedDayIndex === i;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelectDay(i)}
            style={[
              styles.barWrapper,
              isSelected && styles.barSelected            ]}
            activeOpacity={0.7}
          >
            <Svg width={barWidth} height={chartHeight}>
              {/* Fat segment (drawn bottom first) */}
              <Rect
                x={0}
                y={chartHeight - fatHeight}
                width={barWidth}
                height={fatHeight}
                fill={colors.fat}
              />
              {/* Carbs segment */}
              <Rect
                x={0}
                y={chartHeight - fatHeight - carbsHeight}
                width={barWidth}
                height={carbsHeight}
                fill={colors.carbs}
              />
              {/* Protein segment */}
              <Rect
                x={0}
                y={chartHeight - fatHeight - carbsHeight - proteinHeight}
                width={barWidth}
                height={proteinHeight}
                fill={colors.protein}
              />
            </Svg>
            {/* Day label under bar */}
            <Text style={[styles.dayLabel, isSelected && styles.daySelected]}>
              {day.day?.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    alignItems: 'flex-end',
    },
  barWrapper: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  barSelected: {
    backgroundColor: '#FFD54F',
    borderRadius: 6,
  },
  dayLabel: {
    marginTop: 4,
    color: '#ccc',
    fontSize: 12,
  },
  daySelected: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MacroBarChart;
