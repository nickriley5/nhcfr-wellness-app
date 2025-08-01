import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface MealData {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string | null;
}

interface Props {
  visible: boolean;
  meal: MealData | null;
  onClose: () => void;
  onSave: (updatedMeal: MealData) => void;
  onDelete?: (mealId: string) => void;
}

const MealEditModal: React.FC<Props> = ({ visible, meal, onClose, onSave, onDelete }) => {
  const [editedMeal, setEditedMeal] = useState<MealData>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Initialize form when meal changes
  useEffect(() => {
    if (meal) {
      setEditedMeal({ ...meal });
    }
  }, [meal]);

  const handleSave = () => {
    if (!editedMeal.name.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    if (editedMeal.calories < 0 || editedMeal.protein < 0 || editedMeal.carbs < 0 || editedMeal.fat < 0) {
      Alert.alert('Error', 'Macro values cannot be negative');
      return;
    }

    onSave(editedMeal);
  };

  const handleDelete = () => {
    if (!meal?.id) {return;}

    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete && meal.id) {
              onDelete(meal.id);
            }
          },
        },
      ]
    );
  };

  const adjustMacro = (field: keyof MealData, change: number) => {
    setEditedMeal(prev => ({
      ...prev,
      [field]: Math.max(0, (prev[field] as number) + change),
    }));
  };

  if (!meal) {return null;}

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>Edit Meal</Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Photo Preview */}
            {editedMeal.photoUri && (
              <View style={styles.photoContainer}>
                <Image source={{ uri: editedMeal.photoUri }} style={styles.mealPhoto} />
              </View>
            )}

            {/* Meal Name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Meal Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedMeal.name}
                onChangeText={(text) => setEditedMeal(prev => ({ ...prev, name: text }))}
                placeholder="Enter meal name"
                placeholderTextColor="#666"
              />
            </View>

            {/* Macros Section */}
            <Text style={styles.sectionTitle}>Nutrition Information</Text>

            {/* Calories */}
            <View style={styles.macroRow}>
              <View style={styles.macroInfo}>
                <Text style={styles.macroLabel}>Calories</Text>
                <Text style={styles.macroValue}>{editedMeal.calories} kcal</Text>
              </View>
              <View style={styles.macroControls}>
                <Pressable
                  style={styles.macroButton}
                  onPress={() => adjustMacro('calories', -10)}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </Pressable>
                <TextInput
                  style={styles.macroInput}
                  value={editedMeal.calories.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text, 10) || 0;
                    setEditedMeal(prev => ({ ...prev, calories: value }));
                  }}
                  keyboardType="numeric"
                />
                <Pressable
                  style={styles.macroButton}
                  onPress={() => adjustMacro('calories', 10)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Protein */}
            <View style={styles.macroRow}>
              <View style={styles.macroInfo}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={[styles.macroValue, styles.proteinColor]}>{editedMeal.protein}g</Text>
              </View>
              <View style={styles.macroControls}>
                <Pressable
                  style={styles.macroButton}
                  onPress={() => adjustMacro('protein', -1)}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </Pressable>
                <TextInput
                  style={styles.macroInput}
                  value={editedMeal.protein.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text, 10) || 0;
                    setEditedMeal(prev => ({ ...prev, protein: value }));
                  }}
                  keyboardType="numeric"
                />
                <Pressable
                  style={styles.macroButton}
                  onPress={() => adjustMacro('protein', 1)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Carbs */}
            <View style={styles.macroRow}>
              <View style={styles.macroInfo}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={[styles.macroValue, styles.carbColor]}>{editedMeal.carbs}g</Text>
              </View>
              <View style={styles.macroControls}>
                <Pressable
                  style={styles.macroButton}
                  onPress={() => adjustMacro('carbs', -1)}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </Pressable>
                <TextInput
                  style={styles.macroInput}
                  value={editedMeal.carbs.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text, 10) || 0;
                    setEditedMeal(prev => ({ ...prev, carbs: value }));
                  }}
                  keyboardType="numeric"
                />
                <Pressable
                  style={styles.macroButton}
                  onPress={() => adjustMacro('carbs', 1)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Fat */}
            <View style={styles.macroRow}>
              <View style={styles.macroInfo}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={[styles.macroValue, styles.fatColor]}>{editedMeal.fat}g</Text>
              </View>
              <View style={styles.macroControls}>
                <Pressable
                  style={styles.macroButton}
                  onPress={() => adjustMacro('fat', -1)}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </Pressable>
                <TextInput
                  style={styles.macroInput}
                  value={editedMeal.fat.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text, 10) || 0;
                    setEditedMeal(prev => ({ ...prev, fat: value }));
                  }}
                  keyboardType="numeric"
                />
                <Pressable
                  style={styles.macroButton}
                  onPress={() => adjustMacro('fat', 1)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {onDelete && meal.id && (
                <Pressable style={styles.deleteButton} onPress={handleDelete}>
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              )}

              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Ionicons name="checkmark" size={18} color="#000" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default MealEditModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mealPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  macroInfo: {
    flex: 1,
  },
  macroLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  macroValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  proteinColor: { color: '#4FC3F7' },
  carbColor: { color: '#81C784' },
  fatColor: { color: '#F06292' },
  macroControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroButton: {
    backgroundColor: '#444',
    borderRadius: 6,
    padding: 8,
  },
  macroInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    minWidth: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '600',
    marginLeft: 6,
  },
});
