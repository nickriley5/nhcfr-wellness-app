import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ContextualMealMode,
  ContextualMealSuggestion,
  getContextualMealSuggestions,
} from '../utils/ai/aiService';
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

const parseListInput = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const AIMealPlanner: React.FC<Props> = ({ visible, onClose, mealType, date = new Date() }) => {
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [mode, setMode] = useState<ContextualMealMode | null>(null);
  const [macroStrictness, setMacroStrictness] = useState<'strict' | 'balanced'>('balanced');
  const [prepTimeLimit, setPrepTimeLimit] = useState('25');
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [equipmentInput, setEquipmentInput] = useState('');
  const [restaurantsInput, setRestaurantsInput] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [suggestions, setSuggestions] = useState<ContextualMealSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ContextualMealSuggestion | null>(null);

  useEffect(() => {
    if (visible) {
      loadMealPlan();
    } else {
      resetPlanner();
    }
  }, [visible]);

  const resetPlanner = () => {
    setLoading(false);
    setMode(null);
    setMacroStrictness('balanced');
    setPrepTimeLimit('25');
    setIngredientsInput('');
    setEquipmentInput('');
    setRestaurantsInput('');
    setLocationHint('');
    setSuggestions([]);
    setSelectedSuggestion(null);
  };

  const loadMealPlan = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    try {
      const mealPlanDoc = await getDoc(doc(db, 'users', uid, 'mealPlan', 'active'));
      if (mealPlanDoc.exists()) {
        setMealPlan(mealPlanDoc.data());
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    }
  };

  const macroTargets = useMemo(() => {
    if (!mealPlan) {
      return null;
    }

    const mealFraction = mealType === 'snack' ? 0.15 : 0.3;
    return {
      calories: Math.round(mealPlan.calorieTarget * mealFraction),
      protein: Math.round(mealPlan.proteinGrams * mealFraction),
      carbs: Math.round(mealPlan.carbGrams * mealFraction),
      fat: Math.round(mealPlan.fatGrams * mealFraction),
    };
  }, [mealPlan, mealType]);

  const handleGenerate = async () => {
    if (!mealPlan || !macroTargets || !mode) {
      Toast.show({
        type: 'error',
        text1: 'Missing setup',
        text2: 'Create a meal plan and select a planning mode first',
      });
      return;
    }

    const parsedIngredients = parseListInput(ingredientsInput);
    const parsedEquipment = parseListInput(equipmentInput);
    const parsedRestaurants = parseListInput(restaurantsInput);
    const numericPrep = Number(prepTimeLimit);

    if (mode === 'pantry' && parsedIngredients.length < 2) {
      Toast.show({
        type: 'error',
        text1: 'Add ingredients',
        text2: 'Enter at least two ingredients you currently have',
      });
      return;
    }

    if (mode === 'eat_out' && parsedRestaurants.length < 1) {
      Toast.show({
        type: 'error',
        text1: 'Add restaurants',
        text2: 'Enter at least one nearby restaurant',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await getContextualMealSuggestions({
        mode,
        targetCalories: macroTargets.calories,
        targetProtein: macroTargets.protein,
        targetCarbs: macroTargets.carbs,
        targetFat: macroTargets.fat,
        dietaryPreference: mealPlan.dietaryPreference,
        restrictions: mealPlan.dietaryRestrictions || [],
        mealType,
        prepTimeLimit: Number.isFinite(numericPrep) ? numericPrep : 25,
        pantryIngredients: parsedIngredients,
        equipment: parsedEquipment,
        restaurants: parsedRestaurants,
        locationHint: locationHint.trim() || undefined,
        macroStrictness,
      });
      console.log('🍽️ Contextual meal suggestions (full):', JSON.stringify(result, null, 2));
      setSuggestions(result);
    } catch (error) {
      console.error('Error generating contextual meal suggestions:', error);
      Toast.show({
        type: 'error',
        text1: 'Generation failed',
        text2: 'Try refining your inputs and try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async (meal: ContextualMealSuggestion) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);

      await addDoc(mealLogRef, {
        name: meal.name,
        calories: meal.estimatedMacros.calories,
        protein: meal.estimatedMacros.protein,
        carbs: meal.estimatedMacros.carbs,
        fat: meal.estimatedMacros.fat,
        source: mode === 'eat_out' ? 'AI_EAT_OUT' : 'AI_PANTRY',
        mealType,
        plannedDate: dateKey,
        plannedTime: format(new Date(), 'HH:mm'),
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        orderDetails: meal.orderDetails,
        optionalAddOns: meal.optionalAddOns,
        whyItFits: meal.whyItFits,
        fallback: meal.fallback,
        generatedFromMode: mode,
        generatedSource: meal.source,
        prepMinutes: meal.prepMinutes,
        loggedAt: new Date(),
      });

      Toast.show({
        type: 'success',
        text1: 'Meal logged',
        text2: `${meal.name} has been added to your log`,
      });
      onClose();
    } catch (error) {
      console.error('Error logging AI meal suggestion:', error);
      Toast.show({
        type: 'error',
        text1: 'Log failed',
        text2: 'Please try again',
      });
    }
  };

  const handleSaveFavorite = async (meal: ContextualMealSuggestion) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    try {
      await addDoc(collection(db, `users/${uid}/favorites`), {
        favoriteType: 'ai_contextual_meal',
        mode,
        mealType,
        name: meal.name,
        sourceName: meal.source,
        calories: meal.estimatedMacros.calories,
        protein: meal.estimatedMacros.protein,
        carbs: meal.estimatedMacros.carbs,
        fat: meal.estimatedMacros.fat,
        prepMinutes: meal.prepMinutes,
        estimatedMacros: meal.estimatedMacros,
        macroFit: meal.macroFit,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        orderDetails: meal.orderDetails,
        optionalAddOns: meal.optionalAddOns,
        whyItFits: meal.whyItFits,
        fallback: meal.fallback,
        createdAt: new Date(),
      });

      Toast.show({
        type: 'success',
        text1: 'Saved to Favorites',
        text2: `${meal.name} saved with full details`,
      });
    } catch (error) {
      console.error('Error saving AI meal favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Save failed',
        text2: 'Could not save this meal to favorites',
      });
    }
  };

  const renderMacroTargets = () => {
    if (!macroTargets) {return null;}
    return (
      <View style={styles.targetCard}>
        <Text style={styles.targetTitle}>Target macros for {mealType}</Text>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{macroTargets.calories}</Text>
            <Text style={styles.macroLabel}>Cal</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{macroTargets.protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{macroTargets.carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{macroTargets.fat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderModeSelector = () => (
    <View style={styles.modeContainer}>
      <Text style={styles.sectionTitle}>Choose planning mode</Text>
      <Pressable
        style={[styles.modeCard, mode === 'pantry' && styles.modeCardActive]}
        onPress={() => {
          setMode('pantry');
          setSuggestions([]);
        }}
      >
        <Text style={styles.modeTitle}>Use Ingredients On Hand</Text>
        <Text style={styles.modeSubtitle}>Generate meals from what you already have available.</Text>
      </Pressable>
      <Pressable
        style={[styles.modeCard, mode === 'eat_out' && styles.modeCardActive]}
        onPress={() => {
          setMode('eat_out');
          setSuggestions([]);
        }}
      >
        <Text style={styles.modeTitle}>Eat Out Now</Text>
        <Text style={styles.modeSubtitle}>Get macro-fit orders from nearby restaurants.</Text>
      </Pressable>
    </View>
  );

  const renderSharedControls = () => (
    <View style={styles.formSection}>
      <Text style={styles.inputLabel}>Macro strictness</Text>
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, macroStrictness === 'balanced' && styles.toggleButtonActive]}
          onPress={() => setMacroStrictness('balanced')}
        >
          <Text style={styles.toggleText}>Balanced</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, macroStrictness === 'strict' && styles.toggleButtonActive]}
          onPress={() => setMacroStrictness('strict')}
        >
          <Text style={styles.toggleText}>Strict</Text>
        </Pressable>
      </View>

      <Text style={styles.inputLabel}>Max prep time (minutes)</Text>
      <TextInput
        style={styles.textInput}
        value={prepTimeLimit}
        onChangeText={setPrepTimeLimit}
        keyboardType="numeric"
        placeholder="25"
        placeholderTextColor="#777"
      />
    </View>
  );

  const renderModeInputs = () => {
    if (!mode) {return null;}

    if (mode === 'pantry') {
      return (
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Ingredients on hand</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={ingredientsInput}
            onChangeText={setIngredientsInput}
            placeholder="chicken breast, rice, olive oil, spinach"
            placeholderTextColor="#777"
            multiline
          />

          <Text style={styles.inputLabel}>Available equipment (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={equipmentInput}
            onChangeText={setEquipmentInput}
            placeholder="stove, microwave, air fryer"
            placeholderTextColor="#777"
          />
          {renderSharedControls()}
        </View>
      );
    }

    return (
      <View style={styles.formSection}>
        <Text style={styles.inputLabel}>Nearby restaurants</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={restaurantsInput}
          onChangeText={setRestaurantsInput}
          placeholder="Chipotle, Subway, Chick-fil-A"
          placeholderTextColor="#777"
          multiline
        />

        <Text style={styles.inputLabel}>Location hint (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={locationHint}
          onChangeText={setLocationHint}
          placeholder="Near Station 4 / downtown"
          placeholderTextColor="#777"
        />
        {renderSharedControls()}
      </View>
    );
  };

  const renderSuggestionCard = (suggestion: ContextualMealSuggestion, index: number) => (
    <Pressable
      key={`${suggestion.name}-${index}`}
      style={styles.suggestionCard}
      onPress={() => setSelectedSuggestion(suggestion)}
    >
      <View style={styles.suggestionHeader}>
        <Text style={styles.suggestionName}>{suggestion.name}</Text>
        <Text style={styles.suggestionSource}>{suggestion.source}</Text>
      </View>
      <Text style={styles.suggestionMeta}>Prep {suggestion.prepMinutes} min</Text>
      <View style={styles.macroSummaryRow}>
        <Text style={styles.macroSummaryText}>{suggestion.estimatedMacros.calories} cal</Text>
        <Text style={styles.macroSummaryText}>P {suggestion.estimatedMacros.protein}g</Text>
        <Text style={styles.macroSummaryText}>C {suggestion.estimatedMacros.carbs}g</Text>
        <Text style={styles.macroSummaryText}>F {suggestion.estimatedMacros.fat}g</Text>
      </View>
      <Text style={styles.fitText}>
        Macro fit: {suggestion.macroFit.withinTolerance ? 'Within target' : 'Closest available'}
      </Text>
      <Text style={styles.whyText} numberOfLines={2}>
        {suggestion.whyItFits}
      </Text>
      <View style={styles.cardActions}>
        <Pressable style={styles.secondaryButton} onPress={() => setSelectedSuggestion(suggestion)}>
          <Text style={styles.secondaryButtonText}>View Details</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => handleSaveFavorite(suggestion)}>
          <Text style={styles.secondaryButtonText}>Save</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => handleLogMeal(suggestion)}>
          <Text style={styles.primaryButtonText}>Log Meal</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Meal Planner</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {renderMacroTargets()}
            {renderModeSelector()}
            {renderModeInputs()}

            <Pressable style={styles.generateButton} onPress={handleGenerate} disabled={loading || !mode}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Functional Options</Text>
              )}
            </Pressable>
            {loading ? (
              <Text style={styles.loadingNote}>
                AI is building practical options. This can take up to 20-40 seconds.
              </Text>
            ) : null}

            {suggestions.map((suggestion, index) => renderSuggestionCard(suggestion, index))}
          </ScrollView>
        </View>
      </View>

      <Modal visible={!!selectedSuggestion} transparent animationType="fade" onRequestClose={() => setSelectedSuggestion(null)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailContent}>
            <Pressable style={styles.detailCloseButton} onPress={() => setSelectedSuggestion(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>

            {selectedSuggestion ? (
              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.detailTitle}>{selectedSuggestion.name}</Text>
                <Text style={styles.detailSource}>{selectedSuggestion.source}</Text>

                <View style={styles.detailMacros}>
                  <Text style={styles.detailMacroText}>Calories: {selectedSuggestion.estimatedMacros.calories}</Text>
                  <Text style={styles.detailMacroText}>Protein: {selectedSuggestion.estimatedMacros.protein}g</Text>
                  <Text style={styles.detailMacroText}>Carbs: {selectedSuggestion.estimatedMacros.carbs}g</Text>
                  <Text style={styles.detailMacroText}>Fat: {selectedSuggestion.estimatedMacros.fat}g</Text>
                </View>

                {selectedSuggestion.ingredients.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ingredients</Text>
                    {selectedSuggestion.ingredients.map((item, idx) => (
                      <Text key={`ingredient-${idx}`} style={styles.detailItemText}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                )}

                {selectedSuggestion.orderDetails.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Order Details</Text>
                    {selectedSuggestion.orderDetails.map((item, idx) => (
                      <Text key={`order-${idx}`} style={styles.detailItemText}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                )}

                {selectedSuggestion.instructions.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Instructions</Text>
                    {selectedSuggestion.instructions.map((item, idx) => (
                      <Text key={`instruction-${idx}`} style={styles.detailItemText}>
                        {idx + 1}. {item}
                      </Text>
                    ))}
                  </View>
                )}

                {selectedSuggestion.optionalAddOns.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Optional Add-ons</Text>
                    {selectedSuggestion.optionalAddOns.map((item, idx) => (
                      <Text key={`addon-${idx}`} style={styles.detailItemText}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Why This Fits</Text>
                  <Text style={styles.detailBodyText}>{selectedSuggestion.whyItFits}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Fallback</Text>
                  <Text style={styles.detailBodyText}>{selectedSuggestion.fallback}</Text>
                </View>

                <View style={styles.detailActionRow}>
                  <Pressable style={styles.detailSaveButton} onPress={() => handleSaveFavorite(selectedSuggestion)}>
                    <Text style={styles.detailSaveButtonText}>Save to Favorites</Text>
                  </Pressable>
                  <Pressable style={styles.logButton} onPress={() => handleLogMeal(selectedSuggestion)}>
                    <Text style={styles.logButtonText}>Log This Meal</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  targetCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 12,
  },
  targetTitle: {
    color: '#ddd',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    color: '#FF3C38',
    fontSize: 18,
    fontWeight: '700',
  },
  macroLabel: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 4,
  },
  modeContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  modeCard: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
  },
  modeCardActive: {
    borderColor: '#FF3C38',
    backgroundColor: '#232323',
  },
  modeTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeSubtitle: {
    color: '#aaa',
    fontSize: 13,
  },
  formSection: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#ddd',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#1f1f1f',
  },
  toggleButtonActive: {
    borderColor: '#FF3C38',
    backgroundColor: '#2a1b1b',
  },
  toggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#FF3C38',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginVertical: 10,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingNote: {
    color: '#bdbdbd',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2f2f2f',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  suggestionName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  suggestionSource: {
    color: '#FF9C9A',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionMeta: {
    color: '#bdbdbd',
    fontSize: 12,
    marginBottom: 6,
  },
  macroSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroSummaryText: {
    color: '#d6d6d6',
    fontSize: 12,
    fontWeight: '600',
  },
  fitText: {
    color: '#7ed67e',
    fontSize: 12,
    marginBottom: 4,
  },
  whyText: {
    color: '#bbb',
    fontSize: 12,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
  },
  primaryButton: {
    flex: 1.2,
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 0.9,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 4,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    padding: 20,
  },
  detailContent: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 16,
    maxHeight: '88%',
    width: '100%',
  },
  detailScroll: {
    flexShrink: 1,
  },
  detailScrollContent: {
    paddingBottom: 24,
  },
  detailCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailSource: {
    color: '#d28b8b',
    fontSize: 13,
    marginBottom: 12,
  },
  detailMacros: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  detailMacroText: {
    color: '#ddd',
    fontSize: 13,
    marginBottom: 3,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailItemText: {
    color: '#c6c6c6',
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 19,
  },
  detailBodyText: {
    color: '#c6c6c6',
    fontSize: 13,
    lineHeight: 19,
  },
  logButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
    marginLeft: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  detailActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailSaveButton: {
    flex: 1,
    backgroundColor: '#2f2f2f',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  detailSaveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AIMealPlanner;
