import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { describeMeal, MealMacroResult } from '../../utils/nutritionService';
import { auth, db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import FoodAdjustmentList, { ParsedFoodItem } from './TempFoodList';
import { MealContext } from './MealLoggingModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onMealLogged?: (meal: MealMacroResult) => void;
  pendingPhotoUri?: string | null;
  mealContext?: MealContext | null;
}

const DescribeMealModal: React.FC<Props> = ({
  visible,
  onClose,
  onMealLogged,
  pendingPhotoUri,
  mealContext,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggested queries for better UX
  const suggestions = [
    '2 eggs and toast',
    'Starbucks venti latte',
    'Big Mac from McDonald\'s',
    '6oz grilled chicken',
    '2 slices pizza',
    'turkey sandwich with cheese',
    'greek yogurt with berries',
    'oatmeal with banana',
  ];

  const handleSubmit = async () => {
    if (!query.trim()) {return;}

    setLoading(true);
    setError(null);
    setParsedFoods([]);
    setShowResults(false);

    try {
      // Get nutrition data from your smart API
      const result = await describeMeal(query);

      // Parse the result into individual food items
      // This is a simplified parsing - in reality, you might enhance this
      const foodItems: ParsedFoodItem[] = [];

      // Check if the API returned items (some APIs return item breakdowns)
      if (result.items && result.items.length > 0) {
        // Multiple items returned - create individual adjustable items
        result.items.forEach((item, index) => {
          // Estimate macros per item (distribute total macros)
          const itemCalories = Math.round(result.calories / result.items!.length);
          const itemProtein = Math.round(result.protein / result.items!.length);
          const itemCarbs = Math.round(result.carbs / result.items!.length);
          const itemFat = Math.round(result.fat / result.items!.length);

          foodItems.push({
            id: `item-${index}`,
            name: item,
            baseQuantity: 1,
            currentQuantity: 1,
            unit: 'serving',
            baseCalories: itemCalories,
            baseProtein: itemProtein,
            baseCarbs: itemCarbs,
            baseFat: itemFat,
            confidence: 'high',
            source: result.source,
          });
        });
      } else {
        // Single meal - create one adjustable item
        foodItems.push({
          id: 'meal-1',
          name: query,
          baseQuantity: 1,
          currentQuantity: 1,
          unit: 'serving',
          baseCalories: result.calories,
          baseProtein: result.protein,
          baseCarbs: result.carbs,
          baseFat: result.fat,
          confidence: result.source === 'NUTRITIONIX_PROFESSIONAL' ? 'high' : 'medium',
          source: result.source,
        });
      }

      setParsedFoods(foodItems);
      setShowResults(true);

    } catch (err) {
      setError('Could not find meal info. Try a different description.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (parsedFoods.length === 0) {return;}

    try {
      // Calculate total macros from adjusted foods
      const totals = parsedFoods.reduce((total, food) => {
        const multiplier = food.currentQuantity / food.baseQuantity;
        return {
          calories: total.calories + Math.round(food.baseCalories * multiplier),
          protein: total.protein + Math.round(food.baseProtein * multiplier),
          carbs: total.carbs + Math.round(food.baseCarbs * multiplier),
          fat: total.fat + Math.round(food.baseFat * multiplier),
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      // Create meal name from food items
      const mealName = parsedFoods.length === 1
        ? parsedFoods[0].name
        : `${parsedFoods.length} items: ${parsedFoods.map(f => f.name).join(', ')}`;

      // Log to Firestore
      const uid = auth.currentUser?.uid;
      if (uid) {
        const dateKey = format(new Date(), 'yyyy-MM-dd');
        const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);

        // ✅ Use mealContext in Firebase logging
await addDoc(mealLogRef, {
  name: mealName,
  calories: totals.calories,
  protein: totals.protein,
  carbs: totals.carbs,
  fat: totals.fat,
  source: 'DESCRIBE_ENHANCED',
  photoUri: pendingPhotoUri,
  foodItems: parsedFoods,
  // ✅ Add meal context data
  mealType: mealContext?.mealType?.id || 'unknown',
  mealEmoji: mealContext?.mealType?.emoji || '🍽️',
  plannedDate: mealContext?.date || format(new Date(), 'yyyy-MM-dd'),
  plannedTime: mealContext?.time || format(new Date(), 'HH:mm'),
  loggedAt: new Date(),
});
      }

      // Callback
      if (onMealLogged) {
        onMealLogged({
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          source: 'DESCRIBE_ENHANCED',
        });
      }

      // Show success and close
      Alert.alert(
        '✅ Meal Logged!',
        `Successfully logged ${mealName} with ${totals.calories} calories.`,
        [{ text: 'OK', onPress: handleClose }]
      );

    } catch (err) {
      setError('Failed to log meal. Please try again.');
    }
  };

  const handleClose = () => {
    setQuery('');
    setParsedFoods([]);
    setShowResults(false);
    setError(null);
    onClose();
  };

  const handleAddMoreFood = () => {
    // Allow user to add another food item to this meal
    setShowResults(false);
    setQuery('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>
                {showResults ? 'Review Your Meal' : 'Describe Your Meal'}
              </Text>
              <Pressable onPress={handleClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {!showResults ? (
              /* INPUT PHASE */
              <>
                {/* Input */}
                <TextInput
                  placeholder="e.g. 2 eggs, 1 toast, 1 tbsp butter"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={query}
                  onChangeText={setQuery}
                  multiline
                />

                {/* Suggestions */}
                {!loading && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Try these examples:</Text>
                    {suggestions.map((suggestion, index) => (
                      <Pressable
                        key={index}
                        style={styles.suggestionChip}
                        onPress={() => setQuery(suggestion)}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Action Button */}
                <Pressable
                  style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!query.trim() || loading}
                >
                  <Text style={styles.searchButtonText}>
                    {loading ? 'Analyzing...' : 'Analyze Meal'}
                  </Text>
                </Pressable>

                {/* Loading */}
                {loading && <ActivityIndicator color="#4FC3F7" style={styles.loadingIndicator} />}

                {/* Error */}
                {error && <Text style={styles.errorText}>{error}</Text>}
              </>
            ) : (
              /* RESULTS PHASE */
              <>
                <FoodAdjustmentList
                  foods={parsedFoods}
                  onFoodsChange={setParsedFoods}
                  photoUri={pendingPhotoUri}
                />

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <Pressable
                    style={styles.addMoreButton}
                    onPress={handleAddMoreFood}
                  >
                    <Ionicons name="add" size={16} color="#4FC3F7" />
                    <Text style={styles.addMoreText}>Add More Food</Text>
                  </Pressable>

                  <Pressable style={styles.logButton} onPress={handleLogMeal}>
                    <Ionicons name="checkmark" size={20} color="#000" />
                    <Text style={styles.logButtonText}>Log This Meal</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DescribeMealModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
    marginBottom: 16,
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    color: '#4FC3F7',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#444',
  },
  searchButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingIndicator: {
    marginTop: 16,
  },
  errorText: {
    color: '#F06292',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addMoreButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  logButton: {
    flex: 2,
    backgroundColor: '#81C784',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 6,
  },
});
