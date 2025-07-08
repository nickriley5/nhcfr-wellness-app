import React from 'react';
import { View } from 'react-native';
import AppButton from '../Common/AppButton';

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
        <AppButton
          title="🍽 Generate Meal Plan"
          onPress={onGenerateMeal}
          variant="green"
        />)}

      {!programExists && (
        <>
          <AppButton
            title="🏋️‍♂️ View Workout Programs"
            onPress={onViewPrograms}
            variant="blue"/>

          <AppButton
            title="🏋️‍♀️ Generate Workout Program"
            onPress={onGenerateProgram}
            variant="green"
          />
        </>
      )}

      <AppButton
        title="📅 Set Workout Schedule"
        onPress={onSetSchedule}
        variant="redSolid"
      />

      <AppButton
        title="📜 View Workout History"
        onPress={onViewHistory}
        variant="redSolid"
      />
    </View>
  );
};

export default GenerateButtons;
