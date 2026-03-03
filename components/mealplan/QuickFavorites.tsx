import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { MealContext } from './MealLoggingModal';
import DescribeMealModal from './DescribeMealModal';

interface QuickFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'recent' | 'favorites';
  favoriteType?: 'quick_food' | 'ai_contextual_meal';
  mode?: 'pantry' | 'eat_out';
  sourceName?: string;
  ingredients?: string[];
  instructions?: string[];
  orderDetails?: string[];
  optionalAddOns?: string[];
  whyItFits?: string;
  fallback?: string;
  prepMinutes?: number;
  estimatedMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  macroFit?: {
    withinTolerance: boolean;
    deltaCalories: number;
    deltaProtein: number;
    deltaCarbs: number;
    deltaFat: number;
  };
  lastUsed?: Date;
  timesLogged?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onFoodLogged?: () => void;
  mealContext?: MealContext | null;
}

const QuickFavoritesModal: React.FC<Props> = ({ visible, onClose, onFoodLogged, mealContext }) => {
  const [selectedCategory, setSelectedCategory] = useState<'recent' | 'favorites'>('recent');
  const [loggingFood, setLoggingFood] = useState<string | null>(null);
  const [recentMeals, setRecentMeals] = useState<QuickFood[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [favoriteMeals, setFavoriteMeals] = useState<QuickFood[]>([]);
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [selectedAIFavorite, setSelectedAIFavorite] = useState<QuickFood | null>(null);

  const categories = [
    { id: 'recent', name: 'Recent', description: 'Your last 10 logged meals' },
    { id: 'favorites', name: 'Saved Meals', description: 'Meals you have saved to reuse' },
  ] as const;

  // Load recent meals when modal opens and recent tab is selected
  useEffect(() => {
    if (visible && selectedCategory === 'recent') {
      loadRecentMeals();
    }
  }, [visible, selectedCategory]);

  // Load favorites when modal opens and favorites tab is selected
  useEffect(() => {
    if (visible && selectedCategory === 'favorites') {
      loadFavoriteMeals();
    }
  }, [visible, selectedCategory]);

  const loadRecentMeals = async () => {
    setLoadingRecent(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) { return; }

      // Get recent meals from the last 7 days
      const recent: QuickFood[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = format(date, 'yyyy-MM-dd');

        const mealsRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
        const q = query(mealsRef, orderBy('loggedAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((doc, index) => {
          const data = doc.data() as any;
          recent.push({
            id: `recent-${dateKey}-${index}`,
            name: data.name || 'Unnamed Meal',
            calories: data.calories || 0,
            protein: data.protein || 0,
            carbs: data.carbs || 0,
            fat: data.fat || 0,
            category: 'recent',
            lastUsed: data.loggedAt?.toDate?.() ?? undefined,
          });
        });

        if (recent.length >= 10) { break; }
      }

      setRecentMeals(recent.slice(0, 10));
    } catch (error) {
      console.error('Failed to load recent meals:', error);
      Toast.show({
        type: 'error',
        text1: 'Load Failed',
        text2: 'Could not load recent meals',
        position: 'bottom',
      });
    } finally {
      setLoadingRecent(false);
    }
  };

  const loadFavoriteMeals = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) { return; }

      const favRef = collection(db, `users/${uid}/favorites`);
      const snapshot = await getDocs(favRef);
      const favorites: QuickFood[] = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.name || 'Unnamed Meal',
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          category: 'favorites',
          favoriteType: data.favoriteType || 'quick_food',
          mode: data.mode,
          sourceName: data.sourceName || '',
          ingredients: Array.isArray(data.ingredients) ? data.ingredients.map(String) : [],
          instructions: Array.isArray(data.instructions) ? data.instructions.map(String) : [],
          orderDetails: Array.isArray(data.orderDetails) ? data.orderDetails.map(String) : [],
          optionalAddOns: Array.isArray(data.optionalAddOns) ? data.optionalAddOns.map(String) : [],
          whyItFits: data.whyItFits || '',
          fallback: data.fallback || '',
          prepMinutes: Number(data.prepMinutes) || 0,
          estimatedMacros: data.estimatedMacros || undefined,
          macroFit: data.macroFit || undefined,
        };
      });

      setFavoriteMeals(favorites);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      Toast.show({
        type: 'error',
        text1: 'Load Failed',
        text2: 'Could not load favorite meals',
        position: 'bottom',
      });
    }
  };

  // Uses mealContext for proper date/time and meal categorization
  const logQuickFood = async (food: QuickFood) => {
    setLoggingFood(food.id);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) { return; }

      const targetDate = mealContext?.date || format(new Date(), 'yyyy-MM-dd');
      const mealLogRef = collection(db, `users/${uid}/mealLogs/${targetDate}/meals`);

      await addDoc(mealLogRef, {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        source:
          food.category === 'recent'
            ? 'QUICK_RECENT'
            : food.favoriteType === 'ai_contextual_meal'
            ? 'AI_CONTEXTUAL_FAVORITE'
            : 'QUICK_FAVORITE',
        favoriteType: food.favoriteType || undefined,
        generatedFromMode: food.mode || undefined,
        generatedSource: food.sourceName || undefined,
        ingredients: food.ingredients || [],
        instructions: food.instructions || [],
        orderDetails: food.orderDetails || [],
        optionalAddOns: food.optionalAddOns || [],
        whyItFits: food.whyItFits || undefined,
        fallback: food.fallback || undefined,
        prepMinutes: food.prepMinutes || undefined,
        estimatedMacros: food.estimatedMacros || undefined,
        macroFit: food.macroFit || undefined,
        mealType: mealContext?.mealType?.id || 'unknown',
        mealEmoji: mealContext?.mealType?.emoji || '',
        plannedDate: mealContext?.date || format(new Date(), 'yyyy-MM-dd'),
        plannedTime: mealContext?.time || format(new Date(), 'HH:mm'),
        loggedAt: new Date(),
      });

      onFoodLogged?.();

      Toast.show({
        type: 'success',
        text1: 'Meal Added!',
        text2: `${food.name} logged successfully`,
        position: 'bottom',
      });

      console.log(`✅ Logged: ${food.name} for ${mealContext?.mealType?.label || 'meal'}`);
    } catch (error) {
      console.error('Failed to log food:', error);
      Toast.show({
        type: 'error',
        text1: 'Log Failed',
        text2: 'Please try again',
        position: 'bottom',
      });
    } finally {
      setLoggingFood(null);
    }
  };

  const handleFoodPress = (food: QuickFood) => {
    if (food.category === 'favorites' && food.favoriteType === 'ai_contextual_meal') {
      setSelectedAIFavorite(food);
      return;
    }
    logQuickFood(food);
  };

  const renderFoodItem = ({ item }: { item: QuickFood }) => (
    <Pressable
      style={[styles.foodItem, loggingFood === item.id && styles.loggingFood]}
      onPress={() => handleFoodPress(item)}
      disabled={loggingFood === item.id}
    >
      <View style={styles.foodContent}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodMacros}>
            {item.calories} cal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
          </Text>
          {item.favoriteType === 'ai_contextual_meal' ? (
            <Text style={styles.favoriteDetail}>
              Saved AI plan
              {item.mode ? ` • ${item.mode === 'eat_out' ? 'Eat Out' : 'Pantry'}` : ''}
              {item.sourceName ? ` • ${item.sourceName}` : ''}
            </Text>
          ) : null}
          {item.lastUsed && (
            <Text style={styles.lastUsed}>
              Last logged: {format(item.lastUsed, 'MMM d')}
            </Text>
          )}
        </View>
        {loggingFood === item.id ? (
          <ActivityIndicator size="small" color="#4FC3F7" />
        ) : null}
      </View>
    </Pressable>
  );

  const renderEmptyState = () => {
    if (selectedCategory === 'recent' && loadingRecent) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#4FC3F7" />
          <Text style={styles.emptyText}>Loading recent meals...</Text>
        </View>
      );
    }

    const emptyMessages = {
      recent: 'No recent meals found.\nStart logging to see your history here!',
      favorites: 'No saved meals yet.\nTap "Add a Custom Food" to create one!',
    };

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          {emptyMessages[selectedCategory]}
        </Text>
      </View>
    );
  };

  const getCurrentFoods = (): QuickFood[] =>
    selectedCategory === 'recent' ? recentMeals : favoriteMeals;

  const currentFoods = getCurrentFoods();

  // Dynamic footer text based on meal context
  const getFooterText = () => {
    if (mealContext?.mealType) {
      const mealLabel = mealContext.mealType.label;
      const dateText =
        mealContext.date === format(new Date(), 'yyyy-MM-dd')
          ? "today's"
          : format(new Date(mealContext.date), 'MMM d');
      return `Tap any food to add it to ${dateText} ${mealLabel.toLowerCase()}`;
    }
    return 'Tap any food to instantly add it to your log';
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Add a Meal</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Meal context */}
          {mealContext?.mealType && (
            <View style={styles.mealContextCard}>
              <Text style={styles.mealContextText}>
                Adding to {mealContext.mealType.label}
              </Text>
              <Text style={styles.mealContextTime}>
                {mealContext.date === format(new Date(), 'yyyy-MM-dd')
                  ? 'Today'
                  : format(new Date(mealContext.date), 'MMM d')} at {mealContext.time}
              </Text>
            </View>
          )}

          {/* Category Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.id && styles.activeCategoryTab,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.activeCategoryText,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Category Description */}
          <Text style={styles.categoryDescription}>
            {categories.find(c => c.id === selectedCategory)?.description}
          </Text>

          {/* Favorites: Add custom food */}
          {selectedCategory === 'favorites' && (
            <Pressable
              style={styles.addFoodButton}
              onPress={() => setShowDescribeModal(true)}
            >
              <Text style={styles.addFoodText}>Add a Custom Food</Text>
            </Pressable>
          )}

          {/* Food List or Empty */}
          {currentFoods.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={currentFoods}
              renderItem={renderFoodItem}
              keyExtractor={(item) => item.id}
              style={styles.foodList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Footer Tip */}
          <Text style={styles.footerText}>{getFooterText()}</Text>
        </View>
      </View>

      {/* Describe -> Save as Favorite */}
      <DescribeMealModal
        visible={showDescribeModal}
        onClose={() => setShowDescribeModal(false)}
        onMealParsed={async (parsedMeal) => {
          const uid = auth.currentUser?.uid;
          if (!uid) { return; }

          try {
            await addDoc(collection(db, `users/${uid}/favorites`), {
              name: parsedMeal.name,
              calories: parsedMeal.calories,
              protein: parsedMeal.protein,
              carbs: parsedMeal.carbs,
              fat: parsedMeal.fat,
              createdAt: new Date(),
            });

            Toast.show({
              type: 'success',
              text1: 'Meal Saved!',
              text2: 'You can now reuse this food anytime.',
              position: 'bottom',
            });

            await loadFavoriteMeals();
            setShowDescribeModal(false);
          } catch (error) {
            console.error('Error saving favorite meal:', error);
            Toast.show({
              type: 'error',
              text1: 'Save Failed',
              text2: 'Could not save meal. Try again.',
              position: 'bottom',
            });
          }
        }}
      />

      <Modal visible={!!selectedAIFavorite} transparent animationType="fade" onRequestClose={() => setSelectedAIFavorite(null)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedAIFavorite?.name || 'Saved AI Meal'}</Text>
              <Pressable onPress={() => setSelectedAIFavorite(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>
            <ScrollView>
              {selectedAIFavorite?.sourceName ? (
                <Text style={styles.detailMeta}>Source: {selectedAIFavorite.sourceName}</Text>
              ) : null}
              <Text style={styles.detailMeta}>
                {selectedAIFavorite?.calories || 0} cal • {selectedAIFavorite?.protein || 0}g P •{' '}
                {selectedAIFavorite?.carbs || 0}g C • {selectedAIFavorite?.fat || 0}g F
              </Text>

              {selectedAIFavorite?.orderDetails?.length ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>How to Order</Text>
                  {selectedAIFavorite.orderDetails.map((item, index) => (
                    <Text key={`order-${index}`} style={styles.detailLine}>• {item}</Text>
                  ))}
                </View>
              ) : null}

              {selectedAIFavorite?.ingredients?.length ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Ingredients</Text>
                  {selectedAIFavorite.ingredients.map((item, index) => (
                    <Text key={`ingredient-${index}`} style={styles.detailLine}>• {item}</Text>
                  ))}
                </View>
              ) : null}

              {selectedAIFavorite?.instructions?.length ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Instructions</Text>
                  {selectedAIFavorite.instructions.map((item, index) => (
                    <Text key={`instruction-${index}`} style={styles.detailLine}>{index + 1}. {item}</Text>
                  ))}
                </View>
              ) : null}

              {selectedAIFavorite?.whyItFits ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Why This Fits</Text>
                  <Text style={styles.detailParagraph}>{selectedAIFavorite.whyItFits}</Text>
                </View>
              ) : null}

              {selectedAIFavorite?.fallback ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Fallback</Text>
                  <Text style={styles.detailParagraph}>{selectedAIFavorite.fallback}</Text>
                </View>
              ) : null}
            </ScrollView>

            <Pressable
              style={styles.detailLogButton}
              onPress={async () => {
                if (!selectedAIFavorite) { return; }
                await logQuickFood(selectedAIFavorite);
                setSelectedAIFavorite(null);
              }}
            >
              <Text style={styles.detailLogButtonText}>Log This Meal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default QuickFavoritesModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxHeight: '85%',
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
  mealContextCard: {
    backgroundColor: '#1e3a4a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4FC3F7',
  },
  mealContextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealContextTime: {
    color: '#4FC3F7',
    fontSize: 12,
  },
  categoryTabs: {
    marginBottom: 8,
  },
  categoryTab: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCategoryTab: {
    backgroundColor: '#4FC3F7',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#000',
    fontWeight: '600',
  },
  categoryDescription: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  foodList: {
    maxHeight: 400,
  },
  foodItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  loggingFood: {
    opacity: 0.6,
  },
  foodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  foodMacros: {
    color: '#aaa',
    fontSize: 13,
  },
  lastUsed: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  favoriteDetail: {
    color: '#8abfd6',
    fontSize: 11,
    marginTop: 3,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.86)',
    justifyContent: 'center',
    padding: 20,
  },
  detailContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  detailMeta: {
    color: '#aeb4ba',
    fontSize: 12,
    marginBottom: 6,
  },
  detailSection: {
    marginTop: 10,
  },
  detailSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailLine: {
    color: '#c8ced6',
    fontSize: 13,
    marginBottom: 4,
  },
  detailParagraph: {
    color: '#c8ced6',
    fontSize: 13,
    lineHeight: 19,
  },
  detailLogButton: {
    marginTop: 12,
    backgroundColor: '#4FC3F7',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLogButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4FC3F7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  addFoodText: {
    color: '#000',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
});
