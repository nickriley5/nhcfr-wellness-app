import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';

interface QuickFood {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'station' | 'drinks' | 'snacks' | 'protein';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onFoodLogged?: () => void;
}

const QuickFavoritesModal: React.FC<Props> = ({ visible, onClose, onFoodLogged }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('station');
  const [loggingFood, setLoggingFood] = useState<string | null>(null);

  // 🔥 FIRE STATION SPECIFIC FOODS
  const quickFoods: QuickFood[] = [
    // Station Foods
    { id: '1', category: 'station', emoji: '☕', name: 'Black Coffee', calories: 5, protein: 0, carbs: 1, fat: 0 },
    { id: '2', category: 'station', emoji: '🥪', name: 'Turkey Sandwich', calories: 350, protein: 25, carbs: 35, fat: 12 },
    { id: '3', category: 'station', emoji: '🍕', name: 'Pizza Slice', calories: 285, protein: 12, carbs: 36, fat: 10 },
    { id: '4', category: 'station', emoji: '🌭', name: 'Hot Dog', calories: 150, protein: 5, carbs: 2, fat: 13 },
    { id: '5', category: 'station', emoji: '🥛', name: 'Whole Milk (1 cup)', calories: 150, protein: 8, carbs: 12, fat: 8 },
    { id: '6', category: 'station', emoji: '🍳', name: '2 Scrambled Eggs', calories: 180, protein: 12, carbs: 2, fat: 14 },
    { id: '7', category: 'station', emoji: '🥓', name: '3 Bacon Strips', calories: 130, protein: 9, carbs: 0, fat: 10 },
    { id: '8', category: 'station', emoji: '🍞', name: 'Toast (2 slices)', calories: 160, protein: 6, carbs: 30, fat: 2 },

    // Drinks
    { id: '20', category: 'drinks', emoji: '🥤', name: 'Sports Drink (20oz)', calories: 130, protein: 0, carbs: 34, fat: 0 },
    { id: '21', category: 'drinks', emoji: '🧃', name: 'Energy Drink', calories: 110, protein: 0, carbs: 28, fat: 0 },
    { id: '22', category: 'drinks', emoji: '🥛', name: 'Chocolate Milk', calories: 190, protein: 8, carbs: 26, fat: 8 },
    { id: '23', category: 'drinks', emoji: '💧', name: 'Water (0 cal)', calories: 0, protein: 0, carbs: 0, fat: 0 },
    { id: '24', category: 'drinks', emoji: '☕', name: 'Coffee with Cream', calories: 50, protein: 1, carbs: 4, fat: 4 },

    // Snacks & Emergency Food
    { id: '30', category: 'snacks', emoji: '🍎', name: 'Apple', calories: 95, protein: 0, carbs: 25, fat: 0 },
    { id: '31', category: 'snacks', emoji: '🍌', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
    { id: '32', category: 'snacks', emoji: '🥜', name: 'Mixed Nuts (1oz)', calories: 175, protein: 5, carbs: 6, fat: 16 },
    { id: '33', category: 'snacks', emoji: '🍪', name: 'Granola Bar', calories: 120, protein: 2, carbs: 20, fat: 4 },
    { id: '34', category: 'snacks', emoji: '🧀', name: 'String Cheese', calories: 80, protein: 7, carbs: 1, fat: 6 },
    { id: '35', category: 'snacks', emoji: '🥨', name: 'Pretzels (1oz)', calories: 110, protein: 3, carbs: 22, fat: 1 },

    // Protein Options
    { id: '40', category: 'protein', emoji: '🥤', name: 'Protein Shake', calories: 160, protein: 30, carbs: 4, fat: 3 },
    { id: '41', category: 'protein', emoji: '🍗', name: 'Grilled Chicken (6oz)', calories: 280, protein: 53, carbs: 0, fat: 6 },
    { id: '42', category: 'protein', emoji: '🐟', name: 'Canned Tuna', calories: 100, protein: 22, carbs: 0, fat: 1 },
    { id: '43', category: 'protein', emoji: '🥩', name: 'Lean Beef (4oz)', calories: 240, protein: 35, carbs: 0, fat: 10 },
    { id: '44', category: 'protein', emoji: '🥚', name: 'Hard Boiled Egg', calories: 70, protein: 6, carbs: 1, fat: 5 },
  ];

  const categories = [
    { id: 'station', name: 'Station Foods', emoji: '🏠' },
    { id: 'drinks', name: 'Drinks', emoji: '🥤' },
    { id: 'snacks', name: 'Snacks', emoji: '🍎' },
    { id: 'protein', name: 'Protein', emoji: '💪' },
  ];

  const filteredFoods = quickFoods.filter(food => food.category === selectedCategory);

  const logQuickFood = async (food: QuickFood) => {
    setLoggingFood(food.id);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      const dateKey = format(new Date(), 'yyyy-MM-dd');
      const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);

      await addDoc(mealLogRef, {
        name: `${food.emoji} ${food.name}`,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        source: 'QUICK_ADD',
        loggedAt: new Date(),
      });

      if (onFoodLogged) {
        onFoodLogged();
      }

      console.log(`✅ Logged: ${food.name}`);

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
        </View>
        {loggingFood === item.id ? (
          <Text style={styles.addingText}>Adding...</Text>
        ) : (
          <Ionicons name="add-circle" size={24} color="#4FC3F7" />
        )}
      </View>
    </Pressable>
  );

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

          {/* Food List */}
          <FlatList
            data={filteredFoods}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            style={styles.foodList}
            showsVerticalScrollIndicator={false}
          />

          {/* Footer Info */}
          <Text style={styles.footerText}>
            💡 Tap any food to instantly add it to today's log
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
  categoryTabs: {
    marginBottom: 16,
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
  addingText: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '500',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
