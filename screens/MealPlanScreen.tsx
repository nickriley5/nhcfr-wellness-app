import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';

import DashboardButton from '../components/Common/DashboardButton';
import { RootStackParamList } from '../App';
import MacroCard from '../components/mealplan/MacroCard';
import MealCard from '../components/mealplan/MealCard';
import LogFoodButton from '../components/mealplan/LogFoodButton';
import MealLoggingModal, { MealContext } from '../components/mealplan/MealLoggingModal';
import DescribeMealModal from '../components/mealplan/DescribeMealModal';
import CameraModal from '../components/mealplan/CameraModal';
import QuickFavoritesModal from '../components/mealplan/QuickFavorites';
import MealEditModal from '../components/mealplan/MealEditModal';
import { calculateItemMacros, sumMacros, validateMealAccuracy } from '../utils/precisionMath';

/* -------------------------- TYPES -------------------------- */
interface MealPlanData {
  calorieTarget: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  zoneBlocks?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  dietMethod: 'standard' | 'zone';
  goalType: 'maintain' | 'fatloss' | 'muscle';
  name: string;
}

interface FoodItem {
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseQuantity: number;
  currentQuantity: number;
}

interface MealCardProps {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string | null;
  foodItems?: FoodItem[];
  originalDescription?: string;
  mealType?: string;       // e.g., 'breakfast' | 'snack' | 'lunch' | 'dinner' | ...
  mealEmoji?: string;      // e.g., '🍳'
  plannedTime?: string;    // 'HH:mm'
}

/* -------------------------- MAIN -------------------------- */
const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // Track if this is the first load
  const [initialDescribeQuery, setInitialDescribeQuery] = useState<string>('');

  const [selectedDate, _setSelectedDate] = useState(new Date());
  const [loggedMeals, setLoggedMeals] = useState<MealCardProps[]>([]);

  // ✅ MODAL STATES
  const [showMealLoggingModal, setShowMealLoggingModal] = useState(false);
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [showQuickFavoritesModal, setShowQuickFavoritesModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // ✅ CAMERA & PHOTO STATES
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  // ✅ MEAL CONTEXT STATE
  const [currentMealContext, setCurrentMealContext] = useState<MealContext | null>(null);
  const [editingMeal, setEditingMeal] = useState<any>(null);
  const [reDescribeTargetMeal, setReDescribeTargetMeal] = useState<any | null>(null);

  const uid = auth.currentUser?.uid;

  // ✅ Force reload data when screen comes into focus
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔥 MealPlanScreen focused - triggering data reload');
      setRefreshTrigger((prev: number) => prev + 1);
      
      // Only reset modal states - don't set them to false which can cause flickering
      return () => {
        console.log('🔥 MealPlanScreen unfocused - cleanup');
      };
    }, [])
  );

  // ✅ DEEP DEBUG: camera permission
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {return true;}
    try {
      const cameraPermission = PermissionsAndroid.PERMISSIONS.CAMERA;
      const statusCheck1 = await PermissionsAndroid.check(cameraPermission);
      const statusCheck2 = await PermissionsAndroid.check('android.permission.CAMERA');
      if (statusCheck1 || statusCheck2) {
        Toast.show({ type: 'success', text1: 'Permission Already Granted', position: 'bottom' });
        return true;
      }
      const result = await PermissionsAndroid.request(cameraPermission, {
        title: 'Camera Access',
        message: 'Allow camera access to take meal photos?',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'No',
        buttonPositive: 'Yes',
      });
      const afterRequestStatus = await PermissionsAndroid.check(cameraPermission);
      if (result === PermissionsAndroid.RESULTS.GRANTED || afterRequestStatus) {
        Toast.show({ type: 'success', text1: 'Camera Permission Granted!', position: 'bottom' });
        return true;
      }
      Toast.show({
        type: 'error',
        text1: 'Permission Issue',
        text2: `Result: ${result}`,
        position: 'bottom',
        visibilityTime: 4000,
      });
      return false;
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Permission Request Failed',
        text2: `${err}`,
        position: 'bottom',
        visibilityTime: 4000,
      });
      return false;
    }
  };

  // ✅ Fetch meal plan (refreshes when screen focuses via refreshTrigger)
  useEffect(() => {
    const fetchMealPlan = async () => {
      console.log('🔥 MealPlanScreen - Fetching meal plan... (trigger:', refreshTrigger, ', initialLoad:', initialLoad, ')');
      console.log('🔥 UID:', uid);
      
      if (!uid) {
        console.error('❌ No UID - user not authenticated!');
        setLoading(false);
        setInitialLoad(false);
        return;
      }
      
      // Only show loading spinner on initial load, not on refetches
      if (initialLoad) {
        setLoading(true);
      }
      
      try {
        const ref = doc(db, `users/${uid}/mealPlan/active`);
        console.log('🔥 Firestore path:', `users/${uid}/mealPlan/active`);
        console.log('🔥 Attempting to read from Firestore...');
        
        const snap = await getDoc(ref);
        console.log('🔥 Firestore read complete. Exists:', snap.exists());
        
        if (snap.exists()) {
          const data = snap.data() as MealPlanData;
          console.log('✅ Meal plan data retrieved:', data);
          setMealPlan(data);
        } else {
          console.log('⚠️ No meal plan document found at path');
          setMealPlan(null);
        }
      } catch (err) {
        console.error('❌ Failed to fetch meal plan:', err);
      } finally {
        console.log('🔥 Setting loading to false');
        if (initialLoad) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };
    fetchMealPlan();
  }, [uid, refreshTrigger, initialLoad]);

  // ✅ Live meals for selected date
  useEffect(() => {
    // Early return if no uid - clear meals and don't set up listener
    if (!uid) {
      setLoggedMeals([]);
      return;
    }
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
    const unsub = onSnapshot(
      mealLogRef,
      (snapshot: any) => {
        const meals: MealCardProps[] = snapshot.docs.map((mealDoc: any) => {
          const data = mealDoc.data();
          return {
            id: mealDoc.id,
            name: data.name,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat,
            photoUri: data.photoUri || null,
            foodItems: data.foodItems || [],
            originalDescription: data.originalDescription || '',
            mealType: data.mealType || 'unknown',
            mealEmoji: data.mealEmoji || '🍽️',
            plannedTime: data.plannedTime || null,
          };
        });
        setLoggedMeals(meals);
      },
      (error) => {
        // Silently handle permission errors (e.g., after logout)
        if (error.code === 'permission-denied') {
          console.log('🔒 Meal plan listener: Permission denied (user likely logged out)');
          setLoggedMeals([]);
        } else {
          console.error('Meal plan listener error:', error);
        }
      }
    );
    return () => {
      unsub();
    };
  }, [uid, selectedDate]);


  // ✅ Camera + gallery
  const handleOpenCamera = (mealContext: MealContext) => {
    setCurrentMealContext(mealContext);
    Alert.alert('Add Meal Photo', 'How would you like to add a photo?', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const hasPermission = await requestCameraPermission();
          if (hasPermission) {openCamera();}
        },
      },
      { text: 'Choose from Gallery', onPress: () => openImageLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    const options: CameraOptions = { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024 };
    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {return;}
      if (response.errorMessage) {
        Toast.show({ type: 'error', text1: 'Camera Error', text2: response.errorMessage, position: 'bottom' });
        return;
      }
      if (response.assets && response.assets[0]?.uri) {
        setSelectedImageUri(response.assets[0].uri);
        setShowCameraModal(true);
      }
    });
  };

  const openImageLibrary = () => {
    const options: ImageLibraryOptions = { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024 };
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {return;}
      if (response.errorMessage) {
        Toast.show({ type: 'error', text1: 'Gallery Error', text2: response.errorMessage, position: 'bottom' });
        return;
      }
      if (response.assets && response.assets[0]?.uri) {
        setSelectedImageUri(response.assets[0].uri);
        setShowCameraModal(true);
      }
    });
  };

  // ✅ MODAL HANDLERS
  const handleOpenDescribeModal = (mealContext: MealContext) => {
  // 🔒 ensure we're NOT in re-describe mode
  setReDescribeTargetMeal(null);
  setInitialDescribeQuery('');        // clear any previous query
  setPendingPhotoUri(null);           // reset photo (optional but tidy)

  setCurrentMealContext(mealContext);
  setShowDescribeModal(true);
};


  const handleOpenQuickAdd = (mealContext: MealContext) => {
    setCurrentMealContext(mealContext);
    setShowQuickFavoritesModal(true);
  };

  const handleCameraModalComplete = (meal: any) => {
    if (meal.source === 'OPEN_DESCRIBE_MODAL') {
      setPendingPhotoUri(meal.photoUri);
      setShowCameraModal(false);
      setSelectedImageUri(null);
      setTimeout(() => setShowDescribeModal(true), 300);
    }
  };

  const handleFoodLogged = () => {};
  const handleMealLogged = (_meal: any) => {};


  const handleEditMeal = (meal: any) => {
    setEditingMeal(meal);
    setShowEditModal(true);
  };

  /* ----------------- MERGE / DEDUPE HELPERS + ADAPTERS ----------------- */

  const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  snack: 'Snack',
  lunch: 'Lunch',
  dinner: 'Dinner',
  preworkout: 'Pre-Workout',
  postworkout: 'Post-Workout',
  unknown: 'Meal',
};

const prettyMealLabel = (id?: string) => MEAL_LABELS[id || 'unknown'] || 'Meal';

const prettyTime = (time?: string | null) => {
  if (!time) {return '';}
  try {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h ?? 0, m ?? 0, 0, 0);
    return format(d, 'h:mm a');
  } catch {
    return time;
  }
};


  // Treat your existing FoodItem as the storage shape
  type StorageFoodItem = FoodItem;

  type ParsedFoodItem = {
    id?: string;
    name: string;
    quantity?: number;
    unit?: string;
    servingSize?: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  // storage -> parsed (compute totals from base*multiplier)
  function storageToParsed(it: StorageFoodItem): ParsedFoodItem {
    const baseQ = Number((it as any).baseQuantity ?? 1) || 1;
    const currQ = Number((it as any).currentQuantity ?? 1) || 1;
    const multiplier = currQ / baseQ;
    return {
      name: (it as any).name ?? (it as any).label ?? 'item',
      unit: (it as any).unit ?? 'serving',
      quantity: currQ,
      calories: Math.round((it as any).baseCalories * multiplier) || 0,
      protein: Math.round((it as any).baseProtein * multiplier) || 0,
      carbs: Math.round((it as any).baseCarbs * multiplier) || 0,
      fat: Math.round((it as any).baseFat * multiplier) || 0,
    };
  }

  // parsed -> storage (store as 1x base to keep math simple)
  function parsedToStorage(it: ParsedFoodItem): StorageFoodItem {
    return {
      // optional name/unit retained for future UI
      ...(it.name ? { name: it.name } : {}),
      ...(it.unit ? { unit: it.unit } : {}),
      baseQuantity: 1,
      currentQuantity: 1,
      baseCalories: Number(it.calories ?? 0),
      baseProtein: Number(it.protein ?? 0),
      baseCarbs: Number(it.carbs ?? 0),
      baseFat: Number(it.fat ?? 0),
    } as unknown as StorageFoodItem;
  }

  const normalizeName = (name: string) =>
    (name || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 %./-]/g, '').trim();

  function effectiveTotalsForItem(item: ParsedFoodItem) {
    return {
      calories: item.calories ?? 0,
      protein: item.protein ?? 0,
      carbs: item.carbs ?? 0,
      fat: item.fat ?? 0,
    };
  }

  function mergeItemsWithDedupe(existing: ParsedFoodItem[], incoming: ParsedFoodItem[]) {
    const map = new Map<string, ParsedFoodItem[]>();
    const addToMap = (it: ParsedFoodItem) => {
      const key = `${normalizeName(it.name)}|${(it.unit || '').toLowerCase()}`;
      if (!map.has(key)) {map.set(key, []);}
      map.get(key)!.push(it);
    };
    existing.forEach(addToMap);
    incoming.forEach(addToMap);

    const merged: ParsedFoodItem[] = [];
    for (const [, group] of map.entries()) {
      if (group.length === 1) {
        merged.push(group[0]);
        continue;
      }
      const base = { ...group[0] };
      let c = 0, p = 0, cb = 0, f = 0;
      for (const gi of group) {
        const t = effectiveTotalsForItem(gi);
        c += t.calories; p += t.protein; cb += t.carbs; f += t.fat;
      }
      base.calories = Number(c.toFixed(2));
      base.protein = Number(p.toFixed(2));
      base.carbs = Number(cb.toFixed(2));
      base.fat = Number(f.toFixed(2));

      const qtySum = group.reduce((s, gi) => s + (gi.quantity ?? 0), 0);
      if (qtySum > 0) {base.quantity = qtySum;}

      merged.push(base);
    }
    return merged;
  }

  function sumTotals(items: ParsedFoodItem[]) {
    return items.reduce(
      (acc, it) => {
        const t = effectiveTotalsForItem(it);
        acc.calories += t.calories || 0;
        acc.protein += t.protein || 0;
        acc.carbs += t.carbs || 0;
        acc.fat += t.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  // ✅ Apply re-describe (Replace/Merge)
  const handleApplyRedescribe = async (payload: {
    applyMode: 'replace' | 'merge';
    items: ParsedFoodItem[];
    totals: { calories: number; protein: number; carbs: number; fat: number };
    meta: { confidence?: number; source?: string; validationFlags?: string[]; originalQuery: string };
  }) => {
    if (!uid || !reDescribeTargetMeal?.id) {return;}
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const mealDocRef = doc(db, `users/${uid}/mealLogs/${dateKey}/meals`, reDescribeTargetMeal.id);

      // 1) existing storage -> parsed
      const existingParsed: ParsedFoodItem[] = Array.isArray(reDescribeTargetMeal.foodItems)
        ? (reDescribeTargetMeal.foodItems as StorageFoodItem[]).map(storageToParsed)
        : [];

      // 2) build next parsed list
      const nextParsed: ParsedFoodItem[] =
        payload.applyMode === 'replace'
          ? payload.items
          : mergeItemsWithDedupe(existingParsed, payload.items);

      // 3) recompute totals
      const nextTotals = sumTotals(nextParsed);

      // 4) parsed -> storage for saving
      const nextStorage: StorageFoodItem[] = nextParsed.map(parsedToStorage);

      // 5) persist
      await updateDoc(mealDocRef, {
        foodItems: nextStorage,
        calories: Number(nextTotals.calories.toFixed(2)),
        protein: Number(nextTotals.protein.toFixed(2)),
        carbs: Number(nextTotals.carbs.toFixed(2)),
        fat: Number(nextTotals.fat.toFixed(2)),
        originalDescription: payload.meta.originalQuery,
        manualOverride: false,
        lastAnalysisMeta: {
          source: payload.meta.source || null,
          confidence: payload.meta.confidence || null,
          validationFlags: payload.meta.validationFlags || [],
          appliedAt: new Date().toISOString(),
          applyMode: payload.applyMode,
        },
      });

      // 6) optimistic local update
      const updatedMeal = {
        ...reDescribeTargetMeal,
        foodItems: nextStorage,
        calories: Number(nextTotals.calories.toFixed(2)),
        protein: Number(nextTotals.protein.toFixed(2)),
        carbs: Number(nextTotals.carbs.toFixed(2)),
        fat: Number(nextTotals.fat.toFixed(2)),
        originalDescription: payload.meta.originalQuery,
        manualOverride: false,
        lastAnalysisMeta: {
          source: payload.meta.source || null,
          confidence: payload.meta.confidence || null,
          validationFlags: payload.meta.validationFlags || [],
          appliedAt: new Date().toISOString(),
          applyMode: payload.applyMode,
        },
      };
      setLoggedMeals((prev: any[]) => prev.map((m: any) => (m.id === updatedMeal.id ? updatedMeal : m)));

      setShowDescribeModal(false);
      setTimeout(() => {
        setEditingMeal(updatedMeal);
        setShowEditModal(true);
      }, 250);

      Toast.show({
        type: 'success',
        text1: `Applied (${payload.applyMode === 'replace' ? 'Replace' : 'Merge'})`,
        position: 'bottom',
      });
    } catch (error) {
      console.error('Re-describe apply failed:', error);
      Toast.show({ type: 'error', text1: 'Update failed', text2: 'Please try again', position: 'bottom' });
    } finally {
      setReDescribeTargetMeal(null);
    }
  };

  // ✅ Save edited meal
  const handleSaveEditedMeal = async (updatedMeal: any) => {
    if (!uid || !updatedMeal.id) {return;}
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const mealDocRef = doc(db, `users/${uid}/mealLogs/${dateKey}/meals`, updatedMeal.id);
      await updateDoc(mealDocRef, {
        name: updatedMeal.name,
        calories: updatedMeal.calories,
        protein: updatedMeal.protein,
        carbs: updatedMeal.carbs,
        fat: updatedMeal.fat,
        updatedAt: new Date(),
      });
      setShowEditModal(false);
      setEditingMeal(null);
    } catch (error) {
      console.error('❌ Failed to update meal:', error);
      Toast.show({ type: 'error', text1: 'Update failed', text2: 'Please try again', position: 'bottom' });
    }
  };

  // ✅ Delete meal
  const handleDeleteMeal = async (mealId: string) => {
    if (!uid) {return;}
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const mealDocRef = doc(db, `users/${uid}/mealLogs/${dateKey}/meals`, mealId);
      await deleteDoc(mealDocRef);
      setLoggedMeals((prev: MealCardProps[]) => prev.filter((m) => m.id !== mealId));
      setShowEditModal(false);
      setEditingMeal(null);
    } catch (error) {
      console.error('❌ Failed to delete meal:', error);
      Toast.show({ type: 'error', text1: 'Delete failed', text2: 'Please try again', position: 'bottom' });
    }
  };

  /* -------------------------- TOTALS -------------------------- */

  // ✅ Enhanced totals calculation with accuracy validation
  const calculateMealTotals = () => {
    const allMealMacros = loggedMeals.map((meal: any) => {
      if (meal.foodItems?.length) {
        // Calculate from food items using precise math
        const itemMacros = meal.foodItems.map((item: any) => calculateItemMacros(item));
        const calculatedTotals = sumMacros(itemMacros);

        // Validate against meal-level macros if they exist
        if (meal.calories || meal.protein || meal.carbs || meal.fat) {
          const mealLevelTotals = {
            calories: meal.calories || 0,
            protein: meal.protein || 0,
            carbs: meal.carbs || 0,
            fat: meal.fat || 0,
          };

          const validation = validateMealAccuracy(mealLevelTotals, calculatedTotals);

          if (!validation.isAccurate && validation.shouldFlag) {
            console.warn(`⚠️ Meal "${meal.name}" has macro discrepancy:`, {
              variance: validation.variance,
              mealLevel: mealLevelTotals,
              calculated: calculatedTotals,
            });
          }
        }

        return calculatedTotals;
      } else {
        // Use meal-level macros as fallback
        return {
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0,
        };
      }
    });

    return sumMacros(allMealMacros);
  };

  const totals = calculateMealTotals();

  console.log('📊 MealPlanScreen render state:', {
    loading,
    hasMealPlan: !!mealPlan,
    mealPlan,
    loggedMealsCount: loggedMeals.length,
    totals,
  });
  
  console.log('🎭 Modal states:', {
    showMealLoggingModal,
    showDescribeModal,
    showQuickFavoritesModal,
    showCameraModal,
    showEditModal,
  });

  const goToMacroOverview = () => {
    if (!mealPlan) {return;}
    navigation.navigate('MacroPlanOverview', {
      calorieTarget: mealPlan.calorieTarget,
      proteinGrams: mealPlan.proteinGrams,
      carbGrams: mealPlan.carbGrams,
      fatGrams: mealPlan.fatGrams,
      zoneBlocks: mealPlan.zoneBlocks || { protein: 0, carbs: 0, fats: 0 },
      dietMethod: mealPlan.dietMethod,
      goalType: mealPlan.goalType,
      name: mealPlan.name,
    });
  };

  // ✅ Loading
  if (loading) {
    console.log('⏳ Rendering LOADING state');
    return (
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4FC3F7" />
          <Text style={styles.loadingText}>Loading your meal plan...</Text>
        </View>
      </LinearGradient>
    );
  }

  // ✅ No Meal Plan - Show Empty State
  if (!mealPlan) {
    console.log('📭 Rendering EMPTY state (no meal plan)');
    return (
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>🍽️</Text>
          <Text style={styles.emptyStateTitle}>No Meal Plan Yet</Text>
          <Text style={styles.emptyStateText}>
            Create your personalized meal plan to start tracking your nutrition and reach your goals
          </Text>
          <Pressable
            style={styles.createPlanButton}
            onPress={() => navigation.navigate('GoalSettings')}
          >
            <Text style={styles.createPlanButtonText}>Create Meal Plan</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  console.log('🔥 MealPlanScreen RENDERING MAIN CONTENT');

  return (
    <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Today's Nutrition</Text>

        {/* Compact Date Navigation */}
        <View style={styles.dateNavContainer}>
          <Pressable
            onPress={() => {
              _setSelectedDate((prev: Date) => {
                const newDate = new Date(prev);
                newDate.setDate(newDate.getDate() - 1);
                return newDate;
              })
            }}
            style={({ pressed }: { pressed: boolean }) => [styles.arrowButton, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.arrowText}>←</Text>
          </Pressable>

          <Text style={styles.currentDate}>{format(selectedDate, 'EEEE, MMM d')}</Text>

          <Pressable
            onPress={() =>
              _setSelectedDate((prev: Date) => {
                const newDate = new Date(prev);
                newDate.setDate(newDate.getDate() + 1);
                return newDate;
              })
            }
            disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
            style={({ pressed }: { pressed: boolean }) => [
              styles.arrowButton,
              format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && { opacity: 0.3 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.arrowText}>→</Text>
          </Pressable>
        </View>

        {/* Macro Cards */}
        <View style={styles.macroRowTop} key="macro-cards-container">
          <MacroCard key="macro-calories" label="Calories" logged={totals.calories} target={mealPlan.calorieTarget} unit="kcal" variant="calories" />
          <MacroCard key="macro-protein" label="Protein" logged={totals.protein} target={mealPlan.proteinGrams} unit="g" variant="protein" />
          <MacroCard key="macro-carbs" label="Carbs" logged={totals.carbs} target={mealPlan.carbGrams} unit="g" variant="carb" />
          <MacroCard key="macro-fat" label="Fat" logged={totals.fat} target={mealPlan.fatGrams} unit="g" variant="fat" />
        </View>

        <DashboardButton text="📊 View Full Plan" variant="blue" onPress={goToMacroOverview} />

        <Text style={styles.subheading}>Today's Meals</Text>

        {loggedMeals.length === 0 ? (
          <View style={styles.emptyMealsContainer}>
            <Text style={styles.emptyMealsEmoji}>🍽️</Text>
            <Text style={styles.emptyMealsText}>No meals logged yet.</Text>
            <Text style={styles.emptyMealsSubtext}>Start tracking your nutrition to reach your goals</Text>
            <DashboardButton text="Log Your First Meal" variant="green" onPress={() => setShowMealLoggingModal(true)} />
          </View>
        ) : (
          loggedMeals.map((meal: MealCardProps) => (
            <View key={meal.id} style={styles.mealBlock}>
              <Text style={styles.mealMeta}>
                {meal.mealEmoji || '�🍽️'} {prettyMealLabel(meal.mealType)}
                {meal.plannedTime ? ` • ${prettyTime(meal.plannedTime)}` : ''}
              </Text>

              <MealCard {...meal} onEdit={handleEditMeal} />
            </View>
          ))
        )}
      </ScrollView>

      {/* ✅ Log Food Button */}
      <LogFoodButton onPress={() => {
        console.log('🍽️ Log Food button pressed');
        console.log('🍽️ Current modal states:', {
          showMealLoggingModal,
          showDescribeModal,
          showQuickFavoritesModal,
          showCameraModal,
          showEditModal
        });
        setShowMealLoggingModal(true);
        console.log('🍽️ Set showMealLoggingModal to true');
      }} />

      {/* ✅ MODALS - Only render one at a time to prevent crashes */}
      {(() => {
        const shouldShow = showMealLoggingModal && !showDescribeModal && !showQuickFavoritesModal && !showCameraModal && !showEditModal;
        console.log('🍽️ MealLoggingModal render check:', {
          showMealLoggingModal,
          showDescribeModal,
          showQuickFavoritesModal,
          showCameraModal,
          showEditModal,
          shouldShow
        });
        return shouldShow ? (
          <MealLoggingModal
            visible={true}
            onClose={() => {
              console.log('🍽️ Closing MealLoggingModal');
              setShowMealLoggingModal(false);
            }}
            onOpenDescribeModal={handleOpenDescribeModal}
            onOpenQuickAdd={handleOpenQuickAdd}
            onOpenCamera={handleOpenCamera}
          />
        ) : null;
      })()}

      {showDescribeModal && (
      <DescribeMealModal
  visible={true}
  onClose={() => {
  setShowDescribeModal(false);
  setPendingPhotoUri(null);
  setCurrentMealContext(null);
  setInitialDescribeQuery('');   // ✅ clears the text next time it opens
  setReDescribeTargetMeal(null); // ✅ ensures normal Log flow next time
}}

  onMealLogged={handleMealLogged}
  pendingPhotoUri={pendingPhotoUri}
  mealContext={currentMealContext}
  initialQuery={initialDescribeQuery}
  reDescribeMode={!!reDescribeTargetMeal}
  existingItems={Array.isArray(reDescribeTargetMeal?.foodItems) ? reDescribeTargetMeal.foodItems.map(storageToParsed) : []}  // ✅ pass parsed shape
  onApplyRedescribe={handleApplyRedescribe}
/>
      )}

      {showQuickFavoritesModal && (
      <QuickFavoritesModal
        visible={true}
        onClose={() => {
          setShowQuickFavoritesModal(false);
          setCurrentMealContext(null);
        }}
        onFoodLogged={handleFoodLogged}
        mealContext={currentMealContext}
      />
      )}

      {showCameraModal && (
      <CameraModal
        visible={true}
        onClose={() => {
          setShowCameraModal(false);
          setSelectedImageUri(null);
          setCurrentMealContext(null);
        }}
        imageUri={selectedImageUri}
        onMealLogged={handleCameraModalComplete}
      />
      )}

      {showEditModal && (
      <MealEditModal
        visible={true}
        meal={editingMeal}
        dateKey={format(selectedDate, 'yyyy-MM-dd')}
        onClose={() => {
          setShowEditModal(false);
          setEditingMeal(null);
        }}
        onSave={handleSaveEditedMeal}
        onDelete={handleDeleteMeal}
        onReDescribe={(meal: any) => {
          setReDescribeTargetMeal(meal);
          setShowEditModal(false);
          setInitialDescribeQuery(meal.originalDescription || '');
          setTimeout(() => {
            setCurrentMealContext({
              mealType: meal.mealType || null,
              date: format(selectedDate, 'yyyy-MM-dd'),
              time: meal.plannedTime || '12:00',
            });
            setPendingPhotoUri(meal.photoUri || null);
            setShowDescribeModal(true);
          }, 250);
        }}
      />
      )}
    </LinearGradient>
  );
};

export default MealPlanScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },

  // ✅ Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },

  // ✅ Empty State (No Meal Plan)
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createPlanButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  createPlanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // ✅ Empty Meals State
  emptyMealsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyMealsEmoji: { fontSize: 48, marginBottom: 12 },
  emptyMealsText: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  emptyMealsSubtext: { color: '#aaa', fontSize: 14, marginBottom: 20, textAlign: 'center', lineHeight: 20 },

  macroRowTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subheading: { fontSize: 20, fontWeight: '600', color: '#fff', marginVertical: 12 },

  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  arrowText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  currentDate: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dateText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  navButton: { flex: 1, marginHorizontal: 4 },
  mealBlock: { marginBottom: 12 },
mealMeta: {
  color: '#aaa',
  fontSize: 12,
  marginLeft: 4,
  marginBottom: 6,
},

});
