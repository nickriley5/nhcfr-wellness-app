import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
// ✅ Import the image picker with correct types
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
import MealEditModal from '../components/mealplan/MealEditModal'; // ✅ NEW IMPORT

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

interface MealCardProps {
  id: string; // ✅ Add ID for editing
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string | null;
}

/* -------------------------- MAIN -------------------------- */
const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, _setSelectedDate] = useState(new Date());
  const [loggedMeals, setLoggedMeals] = useState<MealCardProps[]>([]);

  // ✅ MODAL STATES
  const [showMealLoggingModal, setShowMealLoggingModal] = useState(false);
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [showQuickFavoritesModal, setShowQuickFavoritesModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // ✅ NEW: Edit modal

  // ✅ CAMERA & PHOTO STATES
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  // ✅ MEAL CONTEXT STATE
  const [currentMealContext, setCurrentMealContext] = useState<MealContext | null>(null);
  const [editingMeal, setEditingMeal] = useState<any>(null);// ✅ NEW: Meal being edited

  const uid = auth.currentUser?.uid;

  // ✅ REQUEST ANDROID CAMERA PERMISSION
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true; // iOS handles permissions automatically
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos of meals for nutrition tracking.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Camera permission granted');
        return true;
      } else {
        console.log('❌ Camera permission denied');
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take photos of your meals. Please enable it in app settings.',
        );
        return false;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  // Fetch meal plan targets
  useEffect(() => {
    const fetchMealPlan = async () => {
      if (!uid) {
        return;
      }
      try {
        const ref = doc(db, `users/${uid}/mealPlan/active`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setMealPlan(snap.data() as MealPlanData);
        }
      } catch (err) {
        console.error('Failed to fetch meal plan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMealPlan();
  }, [uid]);

  // Fetch logged meals for selected day
  useEffect(() => {
    if (!uid) {
      return;
    }
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
    const unsub = onSnapshot(mealLogRef, (snapshot) => {
      const meals: MealCardProps[] = snapshot.docs.map((mealDoc) => {
        const data = mealDoc.data();
        return {
          id: mealDoc.id, // ✅ Include document ID for editing
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          photoUri: data.photoUri || null,
        };
      });
      setLoggedMeals(meals);
    });
    return () => unsub();
  }, [uid, selectedDate]);

  // Quick add dummy meal (TEMP - remove later)
  const quickAddMeal = async () => {
    if (!uid) {
      return;
    }
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
    await addDoc(mealLogRef, {
      name: 'Test Meal',
      calories: 300,
      protein: 25,
      carbs: 30,
      fat: 10,
      loggedAt: new Date(),
    });
  };

  // ✅ REAL CAMERA FUNCTIONALITY WITH PERMISSION HANDLING
  const handleOpenCamera = (mealContext: MealContext) => {
    console.log('📸 Opening camera with context:', mealContext);
    setCurrentMealContext(mealContext);

    // Show option to take photo or choose from library
    Alert.alert(
      'Add Photo',
      'How would you like to add a photo of your meal?',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => openImageLibrary(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  // ✅ Open device camera with permission check
  const openCamera = async () => {
    // Check permissions first
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return;
    }

    const options: CameraOptions = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      // ✅ Removed storageOptions - not supported in current version
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      console.log('📸 Camera response:', response);

      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (response.errorMessage) {
        console.error('Camera error:', response.errorMessage);
        Alert.alert('Camera Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const imageUri = asset.uri;

        if (imageUri) {
          console.log('✅ Photo taken:', imageUri);
          setSelectedImageUri(imageUri);
          setShowCameraModal(true);
        }
      }
    });
  };

  // ✅ Open photo library (no permission needed)
  const openImageLibrary = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      console.log('📱 Library response:', response);

      if (response.didCancel) {
        console.log('User cancelled library');
        return;
      }

      if (response.errorMessage) {
        console.error('Library error:', response.errorMessage);
        Alert.alert('Library Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const imageUri = asset.uri;

        if (imageUri) {
          console.log('✅ Photo selected:', imageUri);
          setSelectedImageUri(imageUri);
          setShowCameraModal(true);
        }
      }
    });
  };

  // ✅ MODAL HANDLERS
  const handleOpenDescribeModal = (mealContext: MealContext) => {
    console.log('📝 Opening describe modal with context:', mealContext);
    setCurrentMealContext(mealContext);
    setShowDescribeModal(true);
  };

  const handleOpenQuickAdd = (mealContext: MealContext) => {
    console.log('⚡ Opening quick add with context:', mealContext);
    setCurrentMealContext(mealContext);
    setShowQuickFavoritesModal(true);
  };

  // ✅ Handle camera modal completion
  const handleCameraModalComplete = (meal: any) => {
    console.log('📸 Camera modal completed:', meal);

    if (meal.source === 'OPEN_DESCRIBE_MODAL') {
      // User took a photo and wants to describe it
      setPendingPhotoUri(meal.photoUri);
      setShowCameraModal(false);
      setSelectedImageUri(null);

      // Open describe modal with the photo
      setTimeout(() => {
        setShowDescribeModal(true);
      }, 300);
    }
  };

  // ✅ Handle successful food logging
  const handleFoodLogged = () => {
    console.log('✅ Food logged successfully');
    // Could show a success toast here
  };

  // ✅ Handle meal logging completion
  const handleMealLogged = (meal: any) => {
    console.log('✅ Meal logged successfully:', meal);
    // Could show a success toast here
  };

  // ✅ NEW: Handle meal editing
  const handleEditMeal = (meal: any) => {
    console.log('✏️ Editing meal:', meal.name);
    setEditingMeal(meal);
    setShowEditModal(true);
  };

  // ✅ NEW: Save edited meal to Firebase
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

      console.log('✅ Meal updated successfully');
      setShowEditModal(false);
      setEditingMeal(null);
    } catch (error) {
      console.error('❌ Failed to update meal:', error);
      Alert.alert('Error', 'Failed to update meal. Please try again.');
    }
  };

  // ✅ NEW: Delete meal from Firebase
  const handleDeleteMeal = async (mealId: string) => {
    if (!uid) {return;}

    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const mealDocRef = doc(db, `users/${uid}/mealLogs/${dateKey}/meals`, mealId);

      await deleteDoc(mealDocRef);

      console.log('✅ Meal deleted successfully');
      setShowEditModal(false);
      setEditingMeal(null);
    } catch (error) {
      console.error('❌ Failed to delete meal:', error);
      Alert.alert('Error', 'Failed to delete meal. Please try again.');
    }
  };

  // Calculate totals
  const totals = loggedMeals.reduce(
    (acc, m) => {
      acc.calories += m.calories;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goToMacroOverview = () => {
    if (mealPlan) {
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
    }
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Today's Nutrition</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading your plan...</Text>
        ) : !mealPlan ? (
          <Text style={styles.infoText}>No meal plan found. Generate one first!</Text>
        ) : (
          <>
            {/* Macro Cards showing Logged / Target */}
            <View style={styles.macroRowTop}>
              <MacroCard
                label="Calories"
                logged={totals.calories}
                target={mealPlan.calorieTarget}
                unit="kcal"
                variant="calories"
              />
              <MacroCard
                label="Protein"
                logged={totals.protein}
                target={mealPlan.proteinGrams}
                unit="g"
                variant="protein"
              />
              <MacroCard
                label="Carbs"
                logged={totals.carbs}
                target={mealPlan.carbGrams}
                unit="g"
                variant="carb"
              />
              <MacroCard
                label="Fat"
                logged={totals.fat}
                target={mealPlan.fatGrams}
                unit="g"
                variant="fat"
              />
            </View>

            <DashboardButton
              text="📊 View Full Plan"
              variant="blue"
              onPress={goToMacroOverview}
            />

            <Text style={styles.subheading}>Today's Meals</Text>

            {loggedMeals.length === 0 ? (
              <Text style={styles.infoText}>No meals logged yet.</Text>
            ) : (
              loggedMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  {...meal}
                  onEdit={handleEditMeal} // ✅ Add edit handler
                />
              ))
            )}

            {/* TEMP TEST BUTTON - REMOVE LATER */}
            <DashboardButton
              text="➕ Quick Add Test Meal"
              variant="green"
              onPress={quickAddMeal}
            />
          </>
        )}
      </ScrollView>

      {/* ✅ Log Food Button */}
      <LogFoodButton onPress={() => setShowMealLoggingModal(true)} />

      {/* ✅ MAIN MEAL LOGGING MODAL */}
      <MealLoggingModal
        visible={showMealLoggingModal}
        onClose={() => setShowMealLoggingModal(false)}
        onOpenDescribeModal={handleOpenDescribeModal}
        onOpenQuickAdd={handleOpenQuickAdd}
        onOpenCamera={handleOpenCamera}
      />

      {/* ✅ DESCRIBE MEAL MODAL */}
      <DescribeMealModal
        visible={showDescribeModal}
        onClose={() => {
          setShowDescribeModal(false);
          setPendingPhotoUri(null);
          setCurrentMealContext(null);
        }}
        onMealLogged={handleMealLogged}
        pendingPhotoUri={pendingPhotoUri}
        mealContext={currentMealContext}
      />

      {/* ✅ QUICK FAVORITES MODAL */}
      <QuickFavoritesModal
        visible={showQuickFavoritesModal}
        onClose={() => {
          setShowQuickFavoritesModal(false);
          setCurrentMealContext(null);
        }}
        onFoodLogged={handleFoodLogged}
        mealContext={currentMealContext}
      />

      {/* ✅ CAMERA MODAL */}
      <CameraModal
        visible={showCameraModal}
        onClose={() => {
          setShowCameraModal(false);
          setSelectedImageUri(null);
          setCurrentMealContext(null);
        }}
        imageUri={selectedImageUri}
        onMealLogged={handleCameraModalComplete}
      />

      {/* ✅ NEW: MEAL EDIT MODAL */}
      <MealEditModal
        visible={showEditModal}
        meal={editingMeal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMeal(null);
        }}
        onSave={handleSaveEditedMeal}
        onDelete={handleDeleteMeal}
      />
    </LinearGradient>
  );
};

export default MealPlanScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  loadingText: { color: '#aaa', textAlign: 'center', marginVertical: 20 },
  infoText: { color: '#aaa', textAlign: 'center', marginVertical: 20, fontSize: 15 },
  macroRowTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 12,
  },
});
