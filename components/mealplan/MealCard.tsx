import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ✅ Shared meal interface - matches MealPlanScreen
export interface MealCardProps {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string | null;
  onEdit?: (meal: MealCardProps) => void;
}

const MealCard: React.FC<MealCardProps> = ({
  id,
  name,
  calories,
  protein,
  carbs,
  fat,
  photoUri,
  onEdit,
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit({ id, name, calories, protein, carbs, fat, photoUri });
    }
  };

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
          <Text style={styles.mealCalories}>{calories} kcal</Text>
          <View style={styles.mealMacroRow}>
            <Text style={[styles.mealMacro, styles.proteinColor]}>P {protein}g</Text>
            <Text style={[styles.mealMacro, styles.carbColor]}>C {carbs}g</Text>
            <Text style={[styles.mealMacro, styles.fatColor]}>F {fat}g</Text>
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
  // ✅ NEW: Photo thumbnail styles
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
  mealInfo: {
    flex: 1,
  },
  mealName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealCalories: {
    color: '#FFD54F',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  mealMacroRow: {
    flexDirection: 'row',
  },
  mealMacro: {
    marginRight: 12,
    fontWeight: '500',
    fontSize: 13,
  },
  proteinColor: { color: '#4FC3F7' },
  carbColor: { color: '#81C784' },
  fatColor: { color: '#F06292' },
  // ✅ NEW: Edit button styles
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
});
