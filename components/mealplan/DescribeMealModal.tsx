import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { describeMeal, MealMacroResult } from '../../utils/nutritionService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onMealLogged?: (meal: MealMacroResult) => void; // callback if you want to log meal later
}

const DescribeMealModal: React.FC<Props> = ({ visible, onClose, onMealLogged }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MealMacroResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const mealData = await describeMeal(query);
      setResult(mealData);

      // If you want to auto-log after success, uncomment:
      // if (onMealLogged) onMealLogged(mealData);

    } catch (err) {
      setError('Could not find meal info. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = () => {
    if (result && onMealLogged) {
      onMealLogged(result);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Describe Your Meal</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Input */}
          <TextInput
            placeholder="e.g. 2 eggs, 1 toast, 1 tbsp butter"
            placeholderTextColor="#999"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />

          {/* Action Button */}
          <Pressable style={styles.searchButton} onPress={handleSubmit}>
            <Text style={styles.searchButtonText}>Analyze Meal</Text>
          </Pressable>

          {/* Loading Spinner */}
          {loading && <ActivityIndicator color="#4FC3F7" style={styles.loadingIndicator} />}

          {/* Error */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Result */}
          {result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Estimated Macros</Text>
              <Text style={styles.resultItem}>Calories: {result.calories}</Text>
              <Text style={styles.resultItem}>Protein: {result.protein} g</Text>
              <Text style={styles.resultItem}>Carbs: {result.carbs} g</Text>
              <Text style={styles.resultItem}>Fat: {result.fat} g</Text>
              <Text style={styles.resultSource}>Source: {result.source}</Text>

              <Pressable style={styles.logButton} onPress={handleLogMeal}>
                <Text style={styles.logButtonText}>Log This Meal</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DescribeMealModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  searchButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  errorText: {
    color: '#F06292',
    textAlign: 'center',
    marginTop: 8,
  },
  resultBox: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultItem: {
    color: '#ddd',
    marginBottom: 4,
  },
  resultSource: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
  },
  logButton: {
    backgroundColor: '#81C784',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  loadingIndicator: {
    marginTop: 10,
  },
});
