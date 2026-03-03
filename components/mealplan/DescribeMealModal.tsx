import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { describeMeal, MealMacroResult } from '../../utils/nutritionService';
import { analyzeMeal } from '../../utils/ai/aiService';
import { auth, db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';

// NOTE: ParsedFoodItem here is the STORAGE-SHAPE item used by TempFoodList
// (i.e., it contains baseQuantity/currentQuantity/baseCalories/etc.)
import FoodAdjustmentList, { ParsedFoodItem } from './TempFoodList';
import { MealContext } from './MealLoggingModal';

/* -------------------------- Helpers -------------------------- */
const computeTotals = (foods: ParsedFoodItem[]) =>
  foods.reduce(
    (t, f) => {
      const mult = (f.currentQuantity || 0) / (f.baseQuantity || 1);
      return {
        calories: t.calories + Math.round((f.baseCalories || 0) * mult),
        protein: t.protein + Math.round((f.baseProtein || 0) * mult),
        carbs: t.carbs + Math.round((f.baseCarbs || 0) * mult),
        fat: t.fat + Math.round((f.baseFat || 0) * mult),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

/* -------------------------- Props -------------------------- */
interface Props {
  visible: boolean;
  onClose: () => void;

  // normal logging callback
  onMealParsed?: (parsedMeal: {
    name: string;
    emoji?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;

  onMealLogged?: (parsedMeal: {
    name: string;
    emoji?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence?: number;
    validationFlags?: string[];
    source?: string;
    portionInfo?: any;
  }) => void;

  pendingPhotoUri?: string | null;
  mealContext?: MealContext | null;

  /** Optional: prefill the description box when re-describing */
  initialQuery?: string;

  /** Re-describe mode (opened from MealEditModal) */
  reDescribeMode?: boolean;

  /** Existing items from the meal being re-described (STORAGE SHAPE) */
  existingItems?: ParsedFoodItem[];

  /** Callback when user applies Replace/Merge during re-describe */
  onApplyRedescribe?: (payload: {
    applyMode: 'replace' | 'merge';
    /** Items in STORAGE SHAPE (same as FoodAdjustmentList) */
    items: ParsedFoodItem[];
    totals: { calories: number; protein: number; carbs: number; fat: number };
    meta: {
      confidence?: number;
      source?: string;
      validationFlags?: string[];
      originalQuery: string;
    };
  }) => void;
}

/* -------------------------- Component -------------------------- */
const DescribeMealModal: React.FC<Props> = ({
  visible,
  onClose,
  onMealParsed,
  onMealLogged,
  pendingPhotoUri,
  mealContext,
  initialQuery,
  reDescribeMode,
  existingItems,
  onApplyRedescribe,
}) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [parsedFoods, setParsedFoods] = useState<ParsedFoodItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<MealMacroResult | null>(null);

  const isReDescribe = !!reDescribeMode && Array.isArray(existingItems) && existingItems.length > 0;
  const inFavoriteSaveMode = !!onMealParsed && !reDescribeMode;

  const handleSaveFavorite = async () => {
  if (!parsedFoods.length || !onMealParsed) {return;}
  const totals = computeTotals(parsedFoods);
  const mealName =
    parsedFoods.length === 1
      ? parsedFoods[0].name
      : `${parsedFoods.length} items: ${parsedFoods.map(f => f.name).slice(0,2).join(', ')}${parsedFoods.length > 2 ? '...' : ''}`;

  onMealParsed({
    name: mealName,
    emoji: '',
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
  });
};




  useEffect(() => {
    if (visible) {
      setQuery(initialQuery || '');
      setParsedFoods([]);
      setShowResults(false);
      setError(null);
      setLastResult(null);
    }
  }, [visible, initialQuery]);

  const existingTotals = useMemo(
    () => (reDescribeMode && existingItems?.length ? computeTotals(existingItems) : null),
    [reDescribeMode, existingItems]
  );
  const afterTotals = useMemo(
    () => (parsedFoods.length ? computeTotals(parsedFoods) : { calories: 0, protein: 0, carbs: 0, fat: 0 }),
    [parsedFoods]
  );

  const suggestions = [
    '2 eggs and toast',
    'Starbucks grande latte',
    "McDonald's Big Mac",
    '6oz grilled chicken',
    'turkey sandwich with cheese',
    'greek yogurt with berries',
    'oatmeal with banana',
    'protein shake with banana',
    '2 slices pizza',
    'caesar salad with chicken',
    'pasta with marinara sauce',
    'grilled salmon with rice',
  ];

  const handleSubmit = async () => {
    if (!query.trim() && !pendingPhotoUri) {
      Toast.show({
        type: 'error',
        text1: 'Please describe your meal or use a photo',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setParsedFoods([]);
    setShowResults(false);
    setLastResult(null);

    try {
      let result: MealMacroResult;

      // 🔥 NEW: If there's a photo, use Gemini Vision AI
      if (pendingPhotoUri) {
        console.log('Analyzing meal from photo with Gemini Vision...');
        
        // Convert image to base64
        const base64 = await FileSystem.readAsStringAsync(pendingPhotoUri, {
          encoding: 'base64',
        });

        // Call Gemini Vision API
        const geminiResult = await analyzeMeal({
          imageBase64: base64,
          imageMimeType: 'image/jpeg',
          text: query.trim() || undefined, // Optional text context
        });

        // Convert to MealMacroResult format
        result = {
          calories: geminiResult.totalMacros.calories,
          protein: geminiResult.totalMacros.protein,
          carbs: geminiResult.totalMacros.carbs,
          fat: geminiResult.totalMacros.fat,
          source: geminiResult.source.toUpperCase(),
          items: geminiResult.items.map(item => `${item.quantity} ${item.name}`),
          confidence: geminiResult.confidence,
          validationFlags: geminiResult.warnings,
          photoUri: pendingPhotoUri,
          itemMacros: geminiResult.items.map(item => ({
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          })),
        };

        console.log('✅ Photo analysis complete:', result);
      } else {
        // AI-first text analysis (same path family as photo analysis), with fallback to existing nutrition pipeline.
        try {
          console.log('🤖 Analyzing meal from text with Gemini AI...');
          const geminiResult = await analyzeMeal({
            text: query.trim(),
          });

          result = {
            calories: geminiResult.totalMacros.calories,
            protein: geminiResult.totalMacros.protein,
            carbs: geminiResult.totalMacros.carbs,
            fat: geminiResult.totalMacros.fat,
            source: geminiResult.source.toUpperCase(),
            items: geminiResult.items.map(item => `${item.quantity} ${item.name}`),
            confidence: geminiResult.confidence,
            validationFlags: geminiResult.warnings,
            itemMacros: geminiResult.items.map(item => ({
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
            })),
          };

          console.log('✅ Text analysis complete (Gemini):', result);
        } catch (aiError) {
          console.warn('⚠️ Gemini text analysis failed, falling back to nutrition service:', aiError);
          result = await describeMeal(query);
        }
      }

      setLastResult(result);

      // Normalize into STORAGE SHAPE for FoodAdjustmentList
      const items: string[] = Array.isArray(result.items) ? result.items : [];
      const hasPerItemMacros =
        Array.isArray((result as any).itemMacros) &&
        (result as any).itemMacros.length === items.length;

      const foodItems: ParsedFoodItem[] = [];

      if (items.length > 0) {
        items.forEach((rawItem, index) => {
          const itemName = String(rawItem || '').toLowerCase();
          let itemCalories: number;
          let itemProtein: number;
          let itemCarbs: number;
          let itemFat: number;

          if (hasPerItemMacros) {
            const m = (result as any).itemMacros[index];
            itemCalories = m.calories;
            itemProtein = m.protein;
            itemCarbs = m.carbs;
            itemFat = m.fat;
          } else {
            // Heuristic split (fallback)
            if (itemName.includes('burger') || itemName.includes('sandwich')) {
              itemCalories = Math.round(result.calories * 0.8);
              itemProtein = Math.round(result.protein * 0.85);
              itemCarbs = Math.round(result.carbs * 0.7);
              itemFat = Math.round(result.fat * 0.8);
            } else if (
              itemName.includes('ketchup') ||
              itemName.includes('sauce') ||
              itemName.includes('dressing')
            ) {
              itemCalories = Math.round(result.calories * 0.05);
              itemProtein = Math.round(result.protein * 0.02);
              itemCarbs = Math.round(result.carbs * 0.15);
              itemFat = Math.round(result.fat * 0.05);
            } else if (itemName.includes('fries') || itemName.includes('side')) {
              itemCalories = Math.round(result.calories * 0.3);
              itemProtein = Math.round(result.protein * 0.1);
              itemCarbs = Math.round(result.carbs * 0.4);
              itemFat = Math.round(result.fat * 0.3);
            } else {
              // Weighted fallback per item
              const n = items.length || 1;
              const carbWeight = 0.5;
              const proteinWeight = 0.3;
              const fatWeight = 0.2;

              itemCalories = Math.round(result.calories / n);
              itemProtein = Math.round((result.protein * proteinWeight) / n);
              itemCarbs = Math.round((result.carbs * carbWeight) / n);
              itemFat = Math.round((result.fat * fatWeight) / n);
            }
          }

          foodItems.push({
            id: `item-${index}`,
            name: rawItem,
            baseQuantity: 1,
            currentQuantity: 1,
            unit: 'serving',
            baseCalories: Math.max(itemCalories, 1),
            baseProtein: Math.max(itemProtein, 0),
            baseCarbs: Math.max(itemCarbs, 0),
            baseFat: Math.max(itemFat, 0),
            confidence:
              result.confidence >= 80
                ? 'high'
                : result.confidence >= 60
                ? 'medium'
                : 'low',
            source: result.source,
          });
        });
      } else {
        // Single-meal fallback
        foodItems.push({
          id: 'meal-1',
          name: query,
          baseQuantity: 1,
          currentQuantity: 1,
          unit: result.portionInfo?.unit || 'serving',
          baseCalories: result.calories,
          baseProtein: result.protein,
          baseCarbs: result.carbs,
          baseFat: result.fat,
          confidence:
            result.confidence >= 80
              ? 'high'
              : result.confidence >= 60
              ? 'medium'
              : 'low',
          source: result.source,
        });
      }

      setParsedFoods(foodItems);
      setShowResults(true);

      // Enhanced confidence feedback with validation alerts
      if (result.confidence >= 85) {
        Toast.show({
          type: 'success',
          text1: 'High Accuracy',
          text2: `${result.confidence}% confidence - excellent match!`,
          position: 'bottom',
        });
      } else if (result.confidence >= 75) {
        Toast.show({
          type: 'info',
          text1: 'Good Match',
          text2: `${result.confidence}% confidence - please review portions`,
          position: 'bottom',
        });
      } else if (result.confidence >= 50) {
        Toast.show({
          type: 'warning',
          text1: 'Please Review',
          text2: `${result.confidence}% confidence - double-check the details`,
          position: 'bottom',
        });
      } else {
        // Very low confidence - show validation issues if any
        const validationMessage = result.validationFlags?.length
          ? `Issues detected: ${result.validationFlags[0]}`
          : 'Very low confidence result';

        Toast.show({
          type: 'error',
          text1: 'Accuracy Warning',
          text2: validationMessage,
          position: 'bottom',
          visibilityTime: 6000,
        });
      }
    } catch (err) {
      console.error('❌ Meal analysis failed:', err);
      setError(err instanceof Error ? err.message : String(err ?? 'Could not find meal info'));
      Toast.show({
        type: 'error',
        text1: 'Analysis Failed',
        text2: 'Try a different description or be more specific',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (parsedFoods.length === 0) {return;}

    try {
      setLoading(true);

      const totals = computeTotals(parsedFoods);

      const mealName =
        parsedFoods.length === 1
          ? parsedFoods[0].name
          : `${parsedFoods.length} items: ${parsedFoods
              .map((f) => f.name)
              .slice(0, 2)
              .join(', ')}${parsedFoods.length > 2 ? '...' : ''}`;

      const uid = auth.currentUser?.uid;
      if (uid) {
        const dateKey = mealContext?.date || format(new Date(), 'yyyy-MM-dd');
        const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
        const sanitizedPortionInfo = lastResult?.portionInfo
          ? Object.fromEntries(
              Object.entries(lastResult.portionInfo).filter(([, value]) => value !== undefined)
            )
          : undefined;

        const mealData = {
          name: mealName,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          source: 'ENHANCED_ANALYSIS',
          photoUri: pendingPhotoUri,
          foodItems: parsedFoods, // storage-shape items
          originalDescription: query,
          confidence: lastResult?.confidence || 75,
          validationFlags: lastResult?.validationFlags || [],
          analysisSource: lastResult?.source || 'UNKNOWN',
          mealType: mealContext?.mealType?.id || 'unknown',
          mealEmoji: mealContext?.mealType?.emoji || '',
          plannedDate: mealContext?.date || format(new Date(), 'yyyy-MM-dd'),
          plannedTime: mealContext?.time || format(new Date(), 'HH:mm'),
          loggedAt: new Date(),
          ...(sanitizedPortionInfo ? { portionInfo: sanitizedPortionInfo } : {}),
        };

        await addDoc(mealLogRef, mealData);
      }

      if (onMealLogged && lastResult) {
        const totalsNow = computeTotals(parsedFoods);
        onMealLogged({
          name: mealName,
          ...lastResult,
          calories: totalsNow.calories,
          protein: totalsNow.protein,
          carbs: totalsNow.carbs,
          fat: totalsNow.fat,
        });
      }

      const confidenceText = lastResult?.confidence ? ` (${lastResult.confidence}% confidence)` : '';
      Toast.show({
        type: 'success',
        text1: '✅ Meal Logged!',
        text2: `${mealName} - ${computeTotals(parsedFoods).calories} cal${confidenceText}`,
        position: 'bottom',
        visibilityTime: 4000,
      });

      handleClose();
    } catch (err) {
      console.error('❌ Failed to log meal:', err);
      setError('Failed to log meal. Please try again.');
      Toast.show({
        type: 'error',
        text1: 'Log Failed',
        text2: 'Please check your connection and try again',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReplace = () => {
    if (!onApplyRedescribe) {return;}
    const totals = computeTotals(parsedFoods);
    onApplyRedescribe({
      applyMode: 'replace',
      items: parsedFoods, // STORAGE SHAPE
      totals,
      meta: {
        confidence: lastResult?.confidence,
        source: lastResult?.source,
        validationFlags: lastResult?.validationFlags,
        originalQuery: query,
      },
    });
    Toast.show({ type: 'success', text1: 'Applied (Replace)', position: 'bottom' });
    onClose();
  };

  const handleApplyMerge = () => {
    if (!onApplyRedescribe) {return;}
    const merged = [...(existingItems || []), ...parsedFoods]; // both STORAGE SHAPE
    const totals = computeTotals(merged);
    onApplyRedescribe({
      applyMode: 'merge',
      items: merged, // STORAGE SHAPE
      totals,
      meta: {
        confidence: lastResult?.confidence,
        source: lastResult?.source,
        validationFlags: lastResult?.validationFlags,
        originalQuery: query,
      },
    });
    Toast.show({ type: 'success', text1: 'Applied (Merge)', position: 'bottom' });
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    setParsedFoods([]);
    setShowResults(false);
    setError(null);
    setLastResult(null);
    onClose();
  };

  const handleAddMoreFood = () => {
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
                {isReDescribe
                  ? showResults
                    ? 'Re-describe • Review'
                    : 'Re-describe Meal'
                  : showResults
                  ? 'Review Your Meal'
                  : 'Describe Your Meal'}
              </Text>
              <Pressable onPress={handleClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Context */}
            {mealContext?.mealType && (
              <View style={styles.contextCard}>
                <Text style={styles.contextText}>{mealContext.mealType.label}</Text>
                <Text style={styles.contextSubtext}>Using professional nutrition analysis</Text>
              </View>
            )}

            {!showResults ? (
              <>
                {/* Photo Preview */}
                {pendingPhotoUri && (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: pendingPhotoUri }} style={styles.photoImage} />
                    <View style={styles.photoOverlay}>
                      <Ionicons name="camera" size={24} color="#fff" />
                      <Text style={styles.photoText}>Photo will be analyzed with AI</Text>
                    </View>
                  </View>
                )}

                <TextInput
                  placeholder={
                    pendingPhotoUri
                      ? "Optional: Add context (e.g., 'post-workout meal', 'double portion')"
                      : "e.g. 2 eggs and toast, McDonald's Big Mac, 6oz chicken with rice"
                  }
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={query}
                  onChangeText={setQuery}
                  multiline
                />

                {!loading && !pendingPhotoUri && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Quick suggestions:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                      {suggestions.map((s, i) => (
                        <Pressable key={i} style={styles.suggestionChip} onPress={() => setQuery(s)}>
                          <Text style={styles.suggestionText}>{s}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Pressable
                  style={[styles.searchButton, !query.trim() && !pendingPhotoUri && styles.searchButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={(!query.trim() && !pendingPhotoUri) || loading}
                >
                  <Ionicons
                    name={loading ? 'hourglass' : pendingPhotoUri ? 'camera' : 'search'}
                    size={18}
                    color={loading || (!query.trim() && !pendingPhotoUri) ? '#666' : '#000'}
                  />
                  <Text
                    style={[
                      styles.searchButtonText,
                      ((!query.trim() && !pendingPhotoUri) || loading) && styles.searchButtonTextDisabled,
                    ]}
                  >
                    {loading
                      ? pendingPhotoUri
                        ? 'Analyzing photo with Gemini Vision AI...'
                        : 'Analyzing with Gemini AI...'
                      : pendingPhotoUri
                      ? 'Analyze Photo'
                      : 'Analyze Meal'}
                  </Text>
                </Pressable>

                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#4FC3F7" size="large" />
                    <Text style={styles.loadingText}>
                      {pendingPhotoUri
                        ? 'Gemini Vision AI analyzing your photo...'
                        : 'Gemini AI analyzing nutrition data...'}
                    </Text>
                    <Text style={styles.loadingHint}>
                      This usually takes 10-30 seconds depending on complexity.
                    </Text>
                  </View>
                )}

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={20} color="#F06292" />
                    <Text style={styles.errorText}>{String(error)}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Confidence */}
                {lastResult && (
                  <View
                    style={[
                      styles.confidenceCard,
                      lastResult.confidence >= 85  // Raised from 80
                        ? styles.highConfidence
                        : lastResult.confidence >= 75  // Raised from 60
                        ? styles.mediumConfidence
                        : styles.lowConfidence,
                    ]}
                  >
                    <View style={styles.confidenceHeader}>
                      <Text style={styles.confidenceTitle}>
                        {lastResult.confidence >= 85  // Raised from 80
                          ? 'High Accuracy'
                          : lastResult.confidence >= 75  // Raised from 60
                          ? 'Good Match'
                          : 'Please Review'}
                      </Text>
                      <Text style={styles.confidenceScore}>{lastResult.confidence}%</Text>
                    </View>
                    <Text style={styles.confidenceSource}>Source: {String(lastResult.source)}</Text>
                    {!!lastResult.validationFlags?.length && (
                      <Text style={styles.validationFlags}>{String(lastResult.validationFlags[0])}</Text>
                    )}
                  </View>
                )}

                {/* Compare (re-describe only) */}
                {isReDescribe && existingItems?.length ? (
                  <View style={styles.compareCard}>
                    <Text style={styles.compareTitle}>Before vs After</Text>
                    <Text style={styles.compareRow}>
                      Before: {existingTotals?.calories ?? 0} kcal • P {existingTotals?.protein ?? 0}g • C{' '}
                      {existingTotals?.carbs ?? 0}g • F {existingTotals?.fat ?? 0}g
                    </Text>
                    <Text style={styles.compareRow}>
                      After: {afterTotals.calories} kcal • P {afterTotals.protein}g • C {afterTotals.carbs}g • F{' '}
                      {afterTotals.fat}g
                    </Text>
                  </View>
                ) : null}

                {/* Items editor (STORAGE SHAPE) */}
                <FoodAdjustmentList foods={parsedFoods} onFoodsChange={setParsedFoods} photoUri={pendingPhotoUri} />

                {/* Current Totals Summary */}
                <View style={styles.totalsSummary}>
                  <Text style={styles.totalsSummaryTitle}>Current Totals</Text>
                  <View style={styles.totalsRow}>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{afterTotals.calories}</Text>
                      <Text style={styles.totalLabel}>Calories</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{afterTotals.protein}g</Text>
                      <Text style={styles.totalLabel}>Protein</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{afterTotals.carbs}g</Text>
                      <Text style={styles.totalLabel}>Carbs</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{afterTotals.fat}g</Text>
                      <Text style={styles.totalLabel}>Fat</Text>
                    </View>
                  </View>
                  <Text style={styles.totalsNote}>Updates as you adjust quantities above</Text>
                </View>

                {/* Actions */}
                {isReDescribe ? (
  <View style={styles.applyBar}>
    <Pressable style={[styles.applyBtn, styles.replaceBtn]} onPress={handleApplyReplace}>
      <Text style={styles.applyBtnText}>Replace items</Text>
    </Pressable>
    <Pressable style={[styles.applyBtn, styles.mergeBtn]} onPress={handleApplyMerge}>
      <Text style={styles.applyBtnText}>Merge items</Text>
    </Pressable>
  </View>
) : (
  <View style={styles.actionButtons}>
    <Pressable style={styles.addMoreButton} onPress={handleAddMoreFood}>
      <Ionicons name="add" size={16} color="#4FC3F7" />
      <Text style={styles.addMoreText}>Add More Food</Text>
    </Pressable>

    {inFavoriteSaveMode ? (
      <Pressable style={styles.logButton} onPress={handleSaveFavorite}>
        <Ionicons name="star" size={18} color="#000" />
        <Text style={styles.logButtonText}>Save as Favorite</Text>
      </Pressable>
    ) : (
      <Pressable style={styles.logButton} onPress={handleLogMeal}>
        <Ionicons name="checkmark" size={18} color="#000" />
        <Text style={styles.logButtonText}>Log Meal</Text>
      </Pressable>
    )}
  </View>
)}

              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DescribeMealModal;

/* -------------------------- Styles -------------------------- */
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '95%', maxHeight: '90%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },

  contextCard: { backgroundColor: '#232323', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#333', marginBottom: 12 },
  contextText: { color: '#fff', fontWeight: '600' },
  contextSubtext: { color: '#aaa', marginTop: 2, fontSize: 12 },

  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  input: { backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 8, padding: 12, minHeight: 70 },

  suggestionsContainer: { marginTop: 10 },
  suggestionsTitle: { color: '#aaa', marginBottom: 6 },
  suggestionsScroll: {},
  suggestionChip: { backgroundColor: '#2a2a2a', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, borderWidth: 1, borderColor: '#333' },
  suggestionText: { color: '#ddd', fontSize: 12 },

  searchButton: { marginTop: 12, backgroundColor: '#4FC3F7', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  searchButtonDisabled: { backgroundColor: '#2a2a2a' },
  searchButtonText: { color: '#000', fontWeight: '700' },
  searchButtonTextDisabled: { color: '#666' },

  loadingContainer: { alignItems: 'center', marginTop: 16 },
  loadingText: { color: '#aaa', marginTop: 8 },
  loadingHint: { color: '#888', marginTop: 6, fontSize: 12, textAlign: 'center' },

  errorContainer: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 12 },
  errorText: { color: '#F06292' },

  confidenceCard: { borderRadius: 12, padding: 12, marginBottom: 12 },
  highConfidence: { backgroundColor: '#1f2a1f', borderWidth: 1, borderColor: '#2d5d2d' },
  mediumConfidence: { backgroundColor: '#2a281f', borderWidth: 1, borderColor: '#5d5a2d' },
  lowConfidence: { backgroundColor: '#2a1f1f', borderWidth: 1, borderColor: '#5d2d2d' },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  confidenceTitle: { color: '#fff', fontWeight: '700' },
  confidenceScore: { color: '#fff', fontWeight: '700' },
  confidenceSource: { color: '#aaa', fontSize: 12 },
  validationFlags: { color: '#ddd', marginTop: 4, fontSize: 12 },

  /* Compare block for re-describe */
  compareCard: { backgroundColor: '#232323', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#333', marginBottom: 10 },
  compareTitle: { color: '#fff', fontWeight: '700', marginBottom: 6 },
  compareRow: { color: '#ddd', fontSize: 12 },

  /* Totals Summary */
  totalsSummary: {
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4FC3F7',
  },
  totalsSummaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    color: '#4FC3F7',
    fontSize: 20,
    fontWeight: '700',
  },
  totalLabel: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 2,
  },
  totalsNote: {
    color: '#999',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },

  /* Normal log actions */
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  addMoreButton: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#333' },
  addMoreText: { color: '#4FC3F7', fontWeight: '700' },
  logButton: { flex: 1, backgroundColor: '#4FC3F7', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  logButtonText: { color: '#000', fontWeight: '700' },

  /* Apply bar for re-describe */
  applyBar: { flexDirection: 'row', gap: 10, marginTop: 12 },
  applyBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  replaceBtn: { backgroundColor: '#4FC3F7' },
  mergeBtn: { backgroundColor: '#4FC3F7', borderWidth: 1, borderColor: '#333' }, // same bold look
  applyBtnText: { color: '#000', fontWeight: '700' },
});
