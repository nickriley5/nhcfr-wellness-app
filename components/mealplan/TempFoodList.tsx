import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface ParsedFoodItem {
  id: string;
  name: string;
  baseQuantity: number;
  currentQuantity: number;
  unit: string;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

interface Props {
  foods: ParsedFoodItem[];
  onFoodsChange: (updatedFoods: ParsedFoodItem[]) => void;
  photoUri?: string | null;
}

const FoodAdjustmentList: React.FC<Props> = ({ foods, onFoodsChange, photoUri }) => {
  const [showPhoto, setShowPhoto] = useState(false);

  const adjustQuantity = (foodId: string, change: number) => {
    const updatedFoods = foods.map(food => {
      if (food.id === foodId) {
        const newQuantity = Math.max(0.1, food.currentQuantity + change);
        return { ...food, currentQuantity: newQuantity };
      }
      return food;
    });
    onFoodsChange(updatedFoods);
  };

  const removeFood = (foodId: string) => {
    const updatedFoods = foods.filter(food => food.id !== foodId);
    onFoodsChange(updatedFoods);
  };

  const calculateCurrentMacros = (food: ParsedFoodItem) => {
    const multiplier = food.currentQuantity / food.baseQuantity;
    return {
      calories: Math.round(food.baseCalories * multiplier),
      protein: Math.round(food.baseProtein * multiplier),
      carbs: Math.round(food.baseCarbs * multiplier),
      fat: Math.round(food.baseFat * multiplier),
    };
  };

  const getTotalMacros = () => {
    return foods.reduce((total, food) => {
      const macros = calculateCurrentMacros(food);
      return {
        calories: total.calories + macros.calories,
        protein: total.protein + macros.protein,
        carbs: total.carbs + macros.carbs,
        fat: total.fat + macros.fat,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#666';
    }
  };

  const getConfidenceEmoji = (confidence: string) => {
    switch (confidence) {
      case 'high': return '🎯';
      case 'medium': return '👍';
      case 'low': return '🤔';
      default: return '❓';
    }
  };

  const totals = getTotalMacros();

  return (
    <View style={styles.container}>
      {/* Photo Reference */}
      {photoUri && (
        <View style={styles.photoContainer}>
          <Pressable
            style={styles.photoButton}
            onPress={() => setShowPhoto(!showPhoto)}
          >
            <Ionicons name="camera" size={16} color="#4FC3F7" />
            <Text style={styles.photoButtonText}>
              {showPhoto ? 'Hide' : 'Show'} Reference Photo
            </Text>
          </Pressable>
        </View>
      )}

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Review & Adjust</Text>
        <Text style={styles.headerSubtitle}>
          Tap + or - to adjust portion sizes for accuracy
        </Text>
      </View>

      {/* ✅ FIXED: Better ScrollView configuration for proper scrolling */}
      <ScrollView
        style={styles.foodList}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.foodListContent}
        bounces={true}
      >
        {foods.map((food) => {
          const currentMacros = calculateCurrentMacros(food);

          return (
            <View key={food.id} style={styles.foodItem}>
              {/* Food Header */}
              <View style={styles.foodHeader}>
                <View style={styles.foodTitleRow}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceEmoji}>
                      {getConfidenceEmoji(food.confidence)}
                    </Text>
                    <View style={[
                      styles.confidenceDot,
                      { backgroundColor: getConfidenceColor(food.confidence) },
                    ]} />
                  </View>
                </View>

                <Pressable
                  style={styles.removeButton}
                  onPress={() => removeFood(food.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#F44336" />
                </Pressable>
              </View>

              {/* Current Macros */}
              <View style={styles.macrosRow}>
                <Text style={styles.macroText}>
                  <Text style={styles.calorieText}>{currentMacros.calories} cal</Text> •
                  <Text style={styles.proteinText}> {currentMacros.protein}g P</Text> •
                  <Text style={styles.carbText}> {currentMacros.carbs}g C</Text> •
                  <Text style={styles.fatText}> {currentMacros.fat}g F</Text>
                </Text>
              </View>

              {/* Quantity Adjustment */}
              <View style={styles.quantityContainer}>
                <View style={styles.quantityInfo}>
                  <Text style={styles.quantityLabel}>Portion:</Text>
                  <Text style={styles.quantityValue}>
                    {food.currentQuantity} {food.unit}
                  </Text>
                </View>

                <View style={styles.quantityControls}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => adjustQuantity(food.id, -0.25)}
                  >
                    <Ionicons name="remove" size={16} color="#fff" />
                  </Pressable>

                  <View style={styles.quantityDisplay}>
                    <Text style={styles.quantityText}>
                      {food.currentQuantity.toFixed(food.currentQuantity % 1 === 0 ? 0 : 2)}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => adjustQuantity(food.id, 0.25)}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>

              {/* Source Info */}
              <Text style={styles.sourceText}>Source: {food.source}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Totals Summary */}
      <View style={styles.totalsContainer}>
        <Text style={styles.totalsTitle}>Meal Totals</Text>
        <Text style={styles.totalsText}>
          <Text style={styles.calorieText}>{totals.calories} calories</Text> •
          <Text style={styles.proteinText}> {totals.protein}g protein</Text> •
          <Text style={styles.carbText}> {totals.carbs}g carbs</Text> •
          <Text style={styles.fatText}> {totals.fat}g fat</Text>
        </Text>
      </View>
    </View>
  );
};

export default FoodAdjustmentList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  photoButtonText: {
    color: '#4FC3F7',
    fontSize: 14,
    marginLeft: 6,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  // ✅ FIXED: Better scrolling configuration
  foodList: {
    maxHeight: 350, // Increased height
    marginBottom: 16,
  },
  foodListContent: {
    paddingBottom: 10, // Add padding for better scrolling experience
  },
  foodItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  foodTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  foodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  confidenceEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  removeButton: {
    padding: 4,
  },
  macrosRow: {
    marginBottom: 12,
  },
  macroText: {
    fontSize: 14,
  },
  calorieText: {
    color: '#FFD54F',
    fontWeight: '500',
  },
  proteinText: {
    color: '#4FC3F7',
    fontWeight: '500',
  },
  carbText: {
    color: '#81C784',
    fontWeight: '500',
  },
  fatText: {
    color: '#F06292',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityInfo: {
    flex: 1,
  },
  quantityLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  quantityValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#444',
    borderRadius: 6,
    padding: 8,
  },
  quantityDisplay: {
    minWidth: 50,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sourceText: {
    color: '#666',
    fontSize: 11,
  },
  totalsContainer: {
    backgroundColor: '#1e3a4a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4FC3F7',
  },
  totalsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalsText: {
    fontSize: 14,
  },
});
