import React from 'react';
import { View } from 'react-native';
import DashboardButton from '../Common/DashboardButton';

interface Props {
  completionPercent: number;
  programExists: boolean;
  mealPlanExists: boolean;
  onGenerateMeal: () => void;
  onGenerateProgram: () => void;
  onViewPrograms: () => void;
  onSetSchedule: () => void;
  onViewHistory: () => void;
}

const GenerateButtons = ({
  completionPercent,
  programExists,
  mealPlanExists,
  onGenerateMeal,
  onGenerateProgram,
  onViewPrograms,
  onSetSchedule,
  onViewHistory,
}: Props) => {
  if (completionPercent < 80) {return null;}

  return (
    <View>
      {!mealPlanExists && (
        <DashboardButton
          text="🍽 Generate Meal Plan"
          onPress={onGenerateMeal}
          variant="green"
        />)}

      {!programExists && (
        <>
          <DashboardButton
            text="🏋️‍♂️ View Workout Programs"
            onPress={onViewPrograms}
            variant="blue"/>

          <DashboardButton
            text="🏋️‍♀️ Generate Workout Program"
            onPress={onGenerateProgram}
            variant="green"
          />
        </>
      )}

      <DashboardButton
        text="📅 Set Workout Schedule"
        onPress={onSetSchedule}
        variant="blue"
      />

      <DashboardButton
        text="📜 View Workout History"
        onPress={onViewHistory}
        variant="blue"
      />
    </View>
  );
};

export default GenerateButtons;
