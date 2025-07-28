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
import { auth, db } from '../../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { MealContext } from './MealLoggingModal';

interface QuickFood {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'recent' | 'favorites' | 'quick-add';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('quick-add');
  const [loggingFood, setLoggingFood] = useState<string | null>(null);
  const [recentMeals, setRecentMeals] = useState<QuickFood[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // 🔥 QUICK ADD FOODS (most commonly used)
  const quickAddFoods: QuickFood[] = [
    // Beverages (most used)
    { id: '1', category: 'quick-add', emoji: '☕', name: 'Black Coffee', calories: 5, protein: 0, carbs: 1, fat: 0 },
    { id: '2', category: 'quick-add', emoji: '🥛', name: 'Whole Milk (1 cup)', calories: 150, protein: 8, carbs: 12, fat: 8 },
    { id: '3', category: 'quick-add', emoji: '💧', name: 'Water (0 cal)', calories: 0, protein: 0, carbs: 0, fat: 0 },
    { id: '4', category: 'quick-add', emoji: '🥤', name: 'Sports Drink (20oz)', calories: 130, protein: 0, carbs: 34, fat: 0 },

    // Quick Proteins
    { id: '10', category: 'quick-add', emoji: '🥚', name: 'Hard Boiled Egg', calories: 70, protein: 6, carbs: 1, fat: 5 },
    { id: '11', category: 'quick-add', emoji: '🍳', name: '2 Scrambled Eggs', calories: 180, protein: 12, carbs: 2, fat: 14 },
    { id: '12', category: 'quick-add', emoji: '🍗', name: 'Grilled Chicken (6oz)', calories: 280, protein: 53, carbs: 0, fat: 6 },
    { id: '13', category: 'quick-add', emoji: '🥤', name: 'Protein Shake', calories: 160, protein: 30, carbs: 4, fat: 3 },

    // Common Snacks
    { id: '20', category: 'quick-add', emoji: '🍎', name: 'Apple', calories: 95, protein: 0, carbs: 25, fat: 0 },
    { id: '21', category: 'quick-add', emoji: '🍌', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
    { id: '22', category: 'quick-add', emoji: '🥜', name: 'Mixed Nuts (1oz)', calories: 175, protein: 5, carbs: 6, fat: 16 },
    { id: '23', category: 'quick-add', emoji: '🧀', name: 'String Cheese', calories: 80, protein: 7, carbs: 1, fat: 6 },

    // Quick Meals
    { id: '30', category: 'quick-add', emoji: '🥪', name: 'Turkey Sandwich', calories: 350, protein: 25, carbs: 35, fat: 12 },
    { id: '31', category: 'quick-add', emoji: '🍞', name: 'Toast (2 slices)', calories: 160, protein: 6, carbs: 30, fat: 2 },
    { id: '32', category: 'quick-add', emoji: '🥓', name: '3 Bacon Strips', calories: 130, protein: 9, carbs: 0, fat: 10 },
    { id: '33', category: 'quick-add', emoji: '🍕', name: 'Pizza Slice', calories: 285, protein: 12, carbs: 36, fat: 10 },
  ];

  const categories = [
    { id: 'quick-add', name: 'Quick Add', emoji: '⚡', description: 'Common foods for instant logging' },
    { id: 'recent', name: 'Recent', emoji: '🕒', description: 'Your last 10 logged meals' },
    { id: 'favorites', name: 'Favorites', emoji: '⭐', description: 'Your saved favorite foods' },
  ];

  // Load recent meals when modal opens and recent tab is selected
  useEffect(() => {
    if (visible && selectedCategory === 'recent') {
      loadRecentMeals();
    }
  }, [visible, selectedCategory]);

  const loadRecentMeals = async () => {
    setLoadingRecent(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

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
          const data = doc.data();
          recent.push({
            id: `recent-${dateKey}-${index}`,
            name: data.name || 'Unnamed Meal',
            emoji: data.mealEmoji || '🍽️', // ✅ Use stored meal emoji if available
            calories: data.calories || 0,
            protein: data.protein || 0,
            carbs: data.carbs || 0,
            fat: data.fat || 0,
            category: 'recent',
            lastUsed: data.loggedAt?.toDate(),
          });
        });

        if (recent.length >= 10) {break;}
      }

      setRecentMeals(recent);
    } catch (error) {
      console.error('Failed to load recent meals:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const getCurrentFoods = (): QuickFood[] => {
    switch (selectedCategory) {
      case 'recent':
        return recentMeals;
      case 'favorites':
        return []; // TODO: Implement favorites functionality later
      case 'quick-add':
      default:
        return quickAddFoods;
    }
  };

  // ✅ ENHANCED: Uses mealContext for proper date/time and meal categorization
  const logQuickFood = async (food: QuickFood) => {
    setLoggingFood(food.id);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      // ✅ Use meal context date or fallback to today
      const targetDate = mealContext?.date || format(new Date(), 'yyyy-MM-dd');
      const mealLogRef = collection(db, `users/${uid}/mealLogs/${targetDate}/meals`);

      await addDoc(mealLogRef, {
        name: `${food.emoji} ${food.name}`,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        source: `QUICK_ADD_${food.category.toUpperCase()}`,
        // ✅ Include meal context data for better organization
        mealType: mealContext?.mealType?.id || 'unknown',
        mealEmoji: mealContext?.mealType?.emoji || '🍽️',
        plannedDate: mealContext?.date || format(new Date(), 'yyyy-MM-dd'),
        plannedTime: mealContext?.time || format(new Date(), 'HH:mm'),
        loggedAt: new Date(),
      });

      if (onFoodLogged) {
        onFoodLogged();
      }

      console.log(`✅ Logged: ${food.name} for ${mealContext?.mealType?.label || 'meal'}`);

    } catch (error) {
      console.error('Failed to log food:', error);
    } finally {
      setLoggingFood(null);
    }
  };

  const renderFoodItem = ({ item }: { item: QuickFood }) => (
    <Pressable
      style={[styles.foodItem, loggingFood === item.id && styles.loggingFood]}
      onPress={() => logQuickFood(item)}
      disabled={loggingFood === item.id}
    >
      <View style={styles.foodContent}>
        <Text style={styles.foodEmoji}>{item.emoji}</Text>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodMacros}>
            {item.calories} cal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
          </Text>
          {item.lastUsed && (
            <Text style={styles.lastUsed}>
              Last logged: {format(item.lastUsed, 'MMM d')}
            </Text>
          )}
        </View>
        {loggingFood === item.id ? (
          <ActivityIndicator size="small" color="#4FC3F7" />
        ) : (
          <Ionicons name="add-circle" size={24} color="#4FC3F7" />
        )}
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
      favorites: 'Favorites feature coming soon!\nFor now, use Quick Add for instant logging.',
      'quick-add': 'Something went wrong loading quick foods.',
    };

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>
          {selectedCategory === 'recent' ? '🕒' : selectedCategory === 'favorites' ? '⭐' : '⚡'}
        </Text>
        <Text style={styles.emptyText}>
          {emptyMessages[selectedCategory as keyof typeof emptyMessages]}
        </Text>
      </View>
    );
  };

  const currentFoods = getCurrentFoods();

  // ✅ Dynamic footer text based on meal context
  const getFooterText = () => {
    if (mealContext?.mealType) {
      const mealLabel = mealContext.mealType.label;
      const dateText = mealContext.date === format(new Date(), 'yyyy-MM-dd')
        ? "today's"
        : format(new Date(mealContext.date), 'MMM d');
      return `💡 Tap any food to add it to ${dateText} ${mealLabel.toLowerCase()}`;
    }
    return '💡 Tap any food to instantly add it to your log';
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>⚡ Quick Add</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* ✅ Show meal context info */}
          {mealContext?.mealType && (
            <View style={styles.mealContextCard}>
              <Text style={styles.mealContextText}>
                {mealContext.mealType.emoji} Adding to {mealContext.mealType.label}
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
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.activeCategoryText,
                ]}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Category Description */}
          <Text style={styles.categoryDescription}>
            {categories.find(c => c.id === selectedCategory)?.description}
          </Text>

          {/* Food List */}
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

          {/* ✅ Dynamic Footer Info */}
          <Text style={styles.footerText}>
            {getFooterText()}
          </Text>
        </View>
      </View>
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
  // ✅ NEW: Meal context display
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
});
