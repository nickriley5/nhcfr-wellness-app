// components/macro/MacroBarChart.tsx
import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface Props {
  weeklyData: { protein: number; carbs: number; fat: number }[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
}

const barWidth = 28;
const barSpacing = 10;
const chartHeight = 180;

const colors = {
  protein: '#4FC3F7',
  carbs: '#81C784',
  fat: '#F06292',
};

const screenWidth = Dimensions.get('window').width;

const calorieFrom = (p: number, c: number, f: number) =>
  p * 4 + c * 4 + f * 9;

const MacroBarChart: React.FC<Props> = ({ weeklyData, onSelectDay }) => {
  return (
    <Svg width={screenWidth} height={chartHeight + 5}>
      {weeklyData.map((day, i) => {
        const total = calorieFrom(day.protein, day.carbs, day.fat);
        const proteinHeight = (day.protein * 4 / total) * chartHeight;
        const carbsHeight = (day.carbs * 4 / total) * chartHeight;
        const fatHeight = (day.fat * 9 / total) * chartHeight;
        const xOffset = 24;
        const x = xOffset + i * (barWidth + barSpacing);
        const y = chartHeight;

        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y - proteinHeight} width={barWidth} height={proteinHeight} fill={colors.protein} onPress={() => onSelectDay(i)} />
            <Rect x={x} y={y - proteinHeight - carbsHeight} width={barWidth} height={carbsHeight} fill={colors.carbs} onPress={() => onSelectDay(i)} />
            <Rect x={x} y={y - proteinHeight - carbsHeight - fatHeight} width={barWidth} height={fatHeight} fill={colors.fat} onPress={() => onSelectDay(i)} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

export default MacroBarChart;
