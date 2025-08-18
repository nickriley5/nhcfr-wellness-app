import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';
import MacroCard from '../mealplan/MacroCard';

interface MacroData {
  eaten: number;
  goal?: number;
}

interface MacrosToday {
  calories: MacroData;
  protein: MacroData;
  carbs: MacroData;
  fat: MacroData;
}

interface HydrationToday {
  currentOz: number;
  goalOz: number;
  containerOz: number;
}

interface TodaysNutritionCardProps {
  macrosToday: MacrosToday;
  hydrationToday: HydrationToday;
  setShowMealLoggingModal: (show: boolean) => void;
  setShowHydrationGoalModal: (show: boolean) => void;
  addHydration: (oz: number) => void;
}

export const TodaysNutritionCard: React.FC<TodaysNutritionCardProps> = ({
  macrosToday,
  hydrationToday,
  setShowMealLoggingModal,
  setShowHydrationGoalModal,
  addHydration,
}) => {
  return (
    <View style={dashboardStyles.horizontalCard}>
      <Text style={dashboardStyles.tileHeader}>Today's Nutrition</Text>

      {/* Macro Cards Grid - 2x2 Layout */}
      <View style={styles.macroGrid2x2}>
        {/* Top Row */}
        <View style={styles.macroRow}>
          <MacroCard
            label="Calories"
            logged={macrosToday.calories.eaten}
            target={macrosToday.calories.goal || 2000}
            unit="kcal"
            variant="calories"
          />
          <MacroCard
            label="Protein"
            logged={macrosToday.protein.eaten}
            target={macrosToday.protein.goal || 150}
            unit="g"
            variant="protein"
          />
        </View>

        {/* Bottom Row */}
        <View style={styles.macroRow}>
          <MacroCard
            label="Carbs"
            logged={macrosToday.carbs.eaten}
            target={macrosToday.carbs.goal || 200}
            unit="g"
            variant="carb"
          />
          <MacroCard
            label="Fat"
            logged={macrosToday.fat.eaten}
            target={macrosToday.fat.goal || 80}
            unit="g"
            variant="fat"
          />
        </View>
      </View>

      {/* Elegant Log Food Separator */}
      <View style={dashboardStyles.logFoodSeparator}>
        <View style={dashboardStyles.separatorLine} />
        <Pressable
          style={dashboardStyles.logFoodButtonCentered}
          onPress={() => setShowMealLoggingModal(true)}
        >
          <Text style={dashboardStyles.logFoodButtonCenteredText}>+ Log Food</Text>
        </Pressable>
        <View style={dashboardStyles.separatorLine} />
      </View>

      {/* Hydration Tracker */}
      <View style={[dashboardStyles.hydrationSection, styles.hydrationSpacing]}>
        <View style={dashboardStyles.hydrationHeader}>
          <View style={dashboardStyles.headerWithIcon}>
            <Ionicons name="water-outline" size={18} color="#4fc3f7" />
            <Text style={dashboardStyles.hydrationTitle}>Hydration</Text>
          </View>
          <Pressable
            style={dashboardStyles.changeGoalButton}
            onPress={() => setShowHydrationGoalModal(true)}
          >
            <Text style={dashboardStyles.changeGoalText}>
              {hydrationToday.currentOz}/{hydrationToday.goalOz} oz
            </Text>
          </Pressable>
        </View>

        <View style={dashboardStyles.dropletsContainer}>
          {(() => {
            // Calculate droplets based on container size
            const dropletCount = Math.ceil(hydrationToday.goalOz / hydrationToday.containerOz);
            const filledDroplets = Math.floor(hydrationToday.currentOz / hydrationToday.containerOz);
            const ozPerDroplet = hydrationToday.containerOz;

            return Array.from({ length: Math.min(dropletCount, 16) }, (_, i) => { // Cap at 16 droplets for UI
              const filled = i < filledDroplets;
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    if (filled) {
                      // If this droplet is filled, subtract hydration to "unfill" it
                      addHydration(-ozPerDroplet);
                    } else {
                      // If this droplet is empty, add hydration to fill it
                      addHydration(ozPerDroplet);
                    }
                  }}
                  style={dashboardStyles.waterDroplet}
                >
                  <Text style={[dashboardStyles.dropletIcon, filled && dashboardStyles.dropletFilled]}>💧</Text>
                </Pressable>
              );
            });
          })()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  macroGrid2x2: {
    marginBottom: 10, // Increased to match hydrationSection marginTop
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 6,
  },
  hydrationSpacing: {
    marginTop: 16, // Override to match logFoodSeparator marginVertical
  },
});
