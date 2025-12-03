/**
 * AI Meal Planner
 * Smart meal suggestions based on nutrition goals
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getMealSuggestions, MealSuggestion } from '../utils/ai/aiService';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';

interface Props {
  visible: boolean;
  onClose: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date?: Date;
}

const AIMealPlanner: React.FC<Props> = ({ visible, onClose, mealType, date = new Date() }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealSuggestion | null>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadMealPlan();
    }
  }, [visible]);

  const loadMealPlan = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const mealPlanDoc = await getDoc(doc(db, 'users', uid, 'mealPlan', 'active'));
      if (mealPlanDoc.exists()) {
        setMealPlan(mealPlanDoc.data());
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    }
  };

  const handleGetSuggestions = async () => {
    if (!mealPlan) {
      Toast.show({
        type: 'error',
        text1: 'No meal plan',
        text2: 'Please create a meal plan first',
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate target macros for this meal (roughly 1/3 of daily for main meals, 1/6 for snacks)
      const mealFraction = mealType === 'snack' ? 0.15 : 0.3;
      
      const nutritionContext = {
        targetCalories: Math.round(mealPlan.calorieTarget * mealFraction),
        targetProtein: Math.round(mealPlan.proteinGrams * mealFraction),
        targetCarbs: Math.round(mealPlan.carbGrams * mealFraction),
        targetFat: Math.round(mealPlan.fatGrams * mealFraction),
        dietaryPreference: mealPlan.dietaryPreference,
        restrictions: mealPlan.dietaryRestriction ? [mealPlan.dietaryRestriction] : [],
        mealType,
        prepTimeLimit: 30,
      };

      const meals = await getMealSuggestions(nutritionContext);
      setSuggestions(meals);
    } catch (error) {
      console.error('Error getting meal suggestions:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to get suggestions',
        text2: 'Please check your API configuration',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMeal = async (meal: MealSuggestion) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);

      await addDoc(mealLogRef, {
        name: meal.name,
        calories: meal.macros.calories,
        protein: meal.macros.protein,
        carbs: meal.macros.carbs,
        fat: meal.macros.fat,
        source: 'AI_SUGGESTION',
        mealType: mealType,
        ingredients: meal.ingredients,
        prepTime: meal.prepTime,
        difficulty: meal.difficulty,
        dietaryTags: meal.dietaryTags,
        loggedAt: new Date(),
      });

      Toast.show({
        type: 'success',
        text1: 'Meal Added',
        text2: `${meal.name} has been logged`,
      });

      onClose();
    } catch (error) {
      console.error('Error logging meal:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to log meal',
        text2: 'Please try again',
      });
    }
  };

  const getMealIcon = () => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#999';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {getMealIcon()} AI {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Planner
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            {suggestions.length === 0 && (
              <View style={styles.introSection}>
                <Text style={styles.introIcon}>🤖🍽️</Text>
                <Text style={styles.introTitle}>AI Meal Suggestions</Text>
                <Text style={styles.introText}>
                  Get personalized meal ideas that perfectly match your
                  nutrition goals and dietary preferences.
                </Text>

                {mealPlan && (
                  <View style={styles.targetCard}>
                    <Text style={styles.targetTitle}>Target Macros for {mealType}:</Text>
                    <View style={styles.macroRow}>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {Math.round(mealPlan.calorieTarget * (mealType === 'snack' ? 0.15 : 0.3))}
                        </Text>
                        <Text style={styles.macroLabel}>Cal</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {Math.round(mealPlan.proteinGrams * (mealType === 'snack' ? 0.15 : 0.3))}g
                        </Text>
                        <Text style={styles.macroLabel}>Protein</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {Math.round(mealPlan.carbGrams * (mealType === 'snack' ? 0.15 : 0.3))}g
                        </Text>
                        <Text style={styles.macroLabel}>Carbs</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {Math.round(mealPlan.fatGrams * (mealType === 'snack' ? 0.15 : 0.3))}g
                        </Text>
                        <Text style={styles.macroLabel}>Fat</Text>
                      </View>
                    </View>
                  </View>
                )}

                <Pressable
                  style={styles.generateButton}
                  onPress={handleGetSuggestions}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.generateButtonText}>✨ Get Meal Ideas</Text>
                  )}
                </Pressable>
              </View>
            )}

            {suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsTitle}>Choose a Meal:</Text>

                {suggestions.map((meal, index) => (
                  <Pressable
                    key={index}
                    style={styles.mealCard}
                    onPress={() => setSelectedMeal(meal)}
                  >
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <View style={styles.mealMeta}>
                        <View style={[styles.difficultyBadge, {
                          backgroundColor: getDifficultyColor(meal.difficulty),
                        }]}>
                          <Text style={styles.difficultyText}>{meal.difficulty}</Text>
                        </View>
                        <View style={styles.timeBadge}>
                          <Ionicons name="time-outline" size={14} color="#FF3C38" />
                          <Text style={styles.timeText}>{meal.prepTime}m</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.macrosRow}>
                      <Text style={styles.macroText}>{meal.macros.calories} cal</Text>
                      <Text style={styles.macroText}>P: {meal.macros.protein}g</Text>
                      <Text style={styles.macroText}>C: {meal.macros.carbs}g</Text>
                      <Text style={styles.macroText}>F: {meal.macros.fat}g</Text>
                    </View>

                    <View style={styles.tagsRow}>
                      {meal.dietaryTags.slice(0, 3).map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      style={styles.selectButton}
                      onPress={() => handleSelectMeal(meal)}
                    >
                      <Text style={styles.selectButtonText}>Log This Meal</Text>
                    </Pressable>
                  </Pressable>
                ))}

                <Pressable
                  style={styles.regenerateButton}
                  onPress={handleGetSuggestions}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={20} color="#fff" />
                      <Text style={styles.regenerateButtonText}>Get More Options</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* Meal Detail Modal */}
            {selectedMeal && (
              <Modal
                visible={!!selectedMeal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedMeal(null)}
              >
                <View style={styles.detailOverlay}>
                  <View style={styles.detailContent}>
                    <Pressable
                      style={styles.detailCloseButton}
                      onPress={() => setSelectedMeal(null)}
                    >
                      <Ionicons name="close" size={24} color="#fff" />
                    </Pressable>

                    <Text style={styles.detailTitle}>{selectedMeal.name}</Text>

                    <View style={styles.detailMacros}>
                      <View style={styles.detailMacroItem}>
                        <Text style={styles.detailMacroValue}>{selectedMeal.macros.calories}</Text>
                        <Text style={styles.detailMacroLabel}>Calories</Text>
                      </View>
                      <View style={styles.detailMacroItem}>
                        <Text style={styles.detailMacroValue}>{selectedMeal.macros.protein}g</Text>
                        <Text style={styles.detailMacroLabel}>Protein</Text>
                      </View>
                      <View style={styles.detailMacroItem}>
                        <Text style={styles.detailMacroValue}>{selectedMeal.macros.carbs}g</Text>
                        <Text style={styles.detailMacroLabel}>Carbs</Text>
                      </View>
                      <View style={styles.detailMacroItem}>
                        <Text style={styles.detailMacroValue}>{selectedMeal.macros.fat}g</Text>
                        <Text style={styles.detailMacroLabel}>Fat</Text>
                      </View>
                    </View>

                    <View style={styles.ingredientsSection}>
                      <Text style={styles.ingredientsTitle}>Ingredients:</Text>
                      {selectedMeal.ingredients.map((ingredient, index) => (
                        <View key={index} style={styles.ingredientItem}>
                          <Text style={styles.ingredientBullet}>•</Text>
                          <Text style={styles.ingredientText}>{ingredient}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      style={styles.logButton}
                      onPress={() => {
                        handleSelectMeal(selectedMeal);
                        setSelectedMeal(null);
                      }}
                    >
                      <Text style={styles.logButtonText}>Log This Meal</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
  },
  introIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  targetCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  targetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3C38',
  },
  macroLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  generateButton: {
    backgroundColor: '#FF3C38',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsSection: {
    paddingBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  mealMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  macroText: {
    color: '#aaa',
    fontSize: 13,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#FF3C38',
    fontSize: 11,
  },
  selectButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  detailContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
  },
  detailCloseButton: {
    alignSelf: 'flex-end',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  detailMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  detailMacroItem: {
    alignItems: 'center',
  },
  detailMacroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF3C38',
  },
  detailMacroLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ingredientBullet: {
    color: '#FF3C38',
    fontSize: 16,
    marginRight: 8,
  },
  ingredientText: {
    flex: 1,
    color: '#aaa',
    fontSize: 14,
  },
  logButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AIMealPlanner;
