import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { calculateItemMacros, sumMacros } from '../../utils/precisionMath';

// ✅ Shared meal interface - matches MealPlanScreen
export interface MealCardProps {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string | null;
  foodItems?: any[];
  originalDescription?: string; // NEW
  onEdit?: (meal: MealCardProps) => void;
  /** ✅ NEW: analysis meta for confidence chip */
  lastAnalysisMeta?: {
    confidence?: number | null;
  };
}


const MealCard: React.FC<MealCardProps> = ({
  id,
  name,
  calories,
  protein,
  carbs,
  fat,
  photoUri,
  foodItems,
  originalDescription,
  lastAnalysisMeta,
  onEdit,
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit({ id, name, calories, protein, carbs, fat, photoUri, foodItems, originalDescription, lastAnalysisMeta });
    }
  };

  const totals = foodItems?.length
    ? sumMacros(
        foodItems.map(item =>
          calculateItemMacros({
            baseCalories: item.baseCalories,
            baseProtein: item.baseProtein,
            baseCarbs: item.baseCarbs,
            baseFat: item.baseFat,
            baseQuantity: item.baseQuantity,
            currentQuantity: item.currentQuantity,
          })
        )
      )
    : { calories, protein, carbs, fat };

  return (
    <Pressable style={styles.mealCard} onPress={handleEdit}>
      <View style={styles.mealCardContent}>
        {/* ✅ Photo Thumbnail */}
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.mealPhoto} />
        ) : (
          <View style={styles.mealPhotoPlaceholder}>
            <Ionicons name="restaurant" size={20} color="#666" />
          </View>
        )}

        {/* Meal Info */}
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{name}</Text>

          {!!originalDescription && (
            <Text style={styles.mealSubtitle} numberOfLines={1}>
              {originalDescription}
            </Text>
          )}

          {lastAnalysisMeta?.confidence != null && (
  <View style={styles.confidencePill}>
    <Text style={styles.confidenceText}>
      confidence ~{Number(lastAnalysisMeta.confidence).toFixed(2)}
    </Text>
  </View>
)}

          <Text style={styles.mealCalories}>{totals.calories} kcal</Text>
  <View style={styles.mealMacroRow}>
    <Text style={[styles.mealMacro, styles.proteinColor]}>P {totals.protein}g</Text>
    <Text style={[styles.mealMacro, styles.carbColor]}>C {totals.carbs}g</Text>
    <Text style={[styles.mealMacro, styles.fatColor]}>F {totals.fat}g</Text>
  </View>
</View>

        {/* ✅ Edit Icon */}
        {onEdit && (
          <View style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color="#4FC3F7" />
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default MealCard;

const styles = StyleSheet.create({
  mealCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  mealCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  mealPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  mealInfo: { flex: 1 },
  mealName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  mealSubtitle: { color: '#bbb', fontSize: 12, marginBottom: 4 },
  mealCalories: { color: '#FFD54F', marginBottom: 6, fontSize: 14, fontWeight: '500' },
  mealMacroRow: { flexDirection: 'row' },
  mealMacro: { marginRight: 12, fontWeight: '500', fontSize: 13 },
  proteinColor: { color: '#4FC3F7' },
  carbColor: { color: '#81C784' },
  fatColor: { color: '#F06292' },
  editButton: { padding: 8, marginLeft: 8 },
  confidencePill: {
  alignSelf: 'flex-start',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: '#1f2937',
  marginBottom: 6,
},
confidenceText: {
  color: '#9CA3AF',
  fontSize: 12,
},
});
