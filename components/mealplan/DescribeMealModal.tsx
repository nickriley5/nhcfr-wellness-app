import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { describeMeal, MealMacroResult } from '../../utils/nutritionService';
import { auth, db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';

interface AlternativeResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onMealLogged?: (meal: MealMacroResult) => void;
  pendingPhotoUri?: string | null;
}

const DescribeMealModal: React.FC<Props> = ({ visible, onClose, onMealLogged, pendingPhotoUri }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AlternativeResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AlternativeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingMacros, setEditingMacros] = useState(false);
  const [editedMacros, setEditedMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Suggested queries for better UX
  const suggestions = [
    '2 eggs and toast',
    'Starbucks venti latte',
    'Big Mac from McDonald\'s',
    '6oz grilled chicken',
    '2 slices pizza',
  ];

  const handleSubmit = async () => {
    if (!query.trim()) {return;}

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedResult(null);

    try {
      // Get primary result
      const primaryResult = await describeMeal(query);

      // Create alternatives with different confidence levels
      const alternatives: AlternativeResult[] = [
        {
          id: '1',
          name: query,
          calories: primaryResult.calories,
          protein: primaryResult.protein,
          carbs: primaryResult.carbs,
          fat: primaryResult.fat,
          source: primaryResult.source,
          confidence: 'high',
        },
        // Add variations (in real app, these could come from trying different APIs)
        {
          id: '2',
          name: `${query} (larger portion)`,
          calories: Math.round(primaryResult.calories * 1.3),
          protein: Math.round(primaryResult.protein * 1.3),
          carbs: Math.round(primaryResult.carbs * 1.3),
          fat: Math.round(primaryResult.fat * 1.3),
          source: primaryResult.source,
          confidence: 'medium',
        },
        {
          id: '3',
          name: `${query} (smaller portion)`,
          calories: Math.round(primaryResult.calories * 0.7),
          protein: Math.round(primaryResult.protein * 0.7),
          carbs: Math.round(primaryResult.carbs * 0.7),
          fat: Math.round(primaryResult.fat * 0.7),
          source: primaryResult.source,
          confidence: 'medium',
        }      ];

      setResults(alternatives);
      setSelectedResult(alternatives[0]); // Auto-select the best match

    } catch (err) {
      setError('Could not find meal info. Try a different description.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: AlternativeResult) => {
    setSelectedResult(result);
    setEditedMacros({
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
    });
  };

  const handleLogMeal = async () => {
    if (!selectedResult) {return;}

    const finalMacros = editingMacros ? editedMacros : selectedResult;

    try {
      // Log to Firestore
      const uid = auth.currentUser?.uid;
      if (uid) {
        const dateKey = format(new Date(), 'yyyy-MM-dd');
        const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);

        await addDoc(mealLogRef, {
          name: selectedResult.name,
          calories: finalMacros.calories,
          protein: finalMacros.protein,
          carbs: finalMacros.carbs,
          fat: finalMacros.fat,
          source: selectedResult.source,
          photoUri: pendingPhotoUri,
          loggedAt: new Date(),
        });
      }

      // Callback
      if (onMealLogged) {
        onMealLogged({
          calories: finalMacros.calories,
          protein: finalMacros.protein,
          carbs: finalMacros.carbs,
          fat: finalMacros.fat,
          source: selectedResult.source,
        });
      }

      // Reset and close
      setQuery('');
      setResults([]);
      setSelectedResult(null);
      setEditingMacros(false);
      onClose();

    } catch (err) {
      setError('Failed to log meal. Please try again.');
    }
  };

  const renderResultItem = ({ item }: { item: AlternativeResult }) => (
    <Pressable
      style={[
        styles.resultItem,
        selectedResult?.id === item.id && styles.selectedResult,
      ]}
      onPress={() => handleSelectResult(item)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultName}>{item.name}</Text>
        <View style={[styles.confidenceBadge, styles[`confidence${item.confidence}`]]}>
          <Text style={styles.confidenceText}>
            {item.confidence === 'high' ? '🎯' : item.confidence === 'medium' ? '👍' : '🤔'}
          </Text>
        </View>
      </View>
      <Text style={styles.resultMacros}>
        {item.calories} cal • {item.protein}g protein • {item.carbs}g carbs • {item.fat}g fat
      </Text>
      <Text style={styles.resultSource}>Source: {item.source}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
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
              multiline
            />

            {/* Suggestions */}
            {!loading && results.length === 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Try these examples:</Text>
                {suggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => setQuery(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Action Button */}
            <Pressable
              style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
              onPress={handleSubmit}
              disabled={!query.trim() || loading}
            >
              <Text style={styles.searchButtonText}>
                {loading ? 'Analyzing...' : 'Analyze Meal'}
              </Text>
            </Pressable>

            {/* Loading */}
            {loading && <ActivityIndicator color="#4FC3F7" style={styles.loadingIndicator} />}

            {/* Error */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Results */}
            {results.length > 0 && (
              <>
                <Text style={styles.resultsTitle}>Select the best match:</Text>
                <FlatList
                  data={results}
                  renderItem={renderResultItem}
                  keyExtractor={(item) => item.id}
                  style={styles.resultsList}
                  scrollEnabled={false}
                />

                {/* Edit Macros Option */}
                {selectedResult && (
                  <View style={styles.editSection}>
                    <Pressable
                      style={styles.editToggle}
                      onPress={() => setEditingMacros(!editingMacros)}
                    >
                      <Text style={styles.editToggleText}>
                        {editingMacros ? '📝 Stop Editing' : '✏️ Edit Macros'}
                      </Text>
                    </Pressable>

                    {editingMacros && (
                      <View style={styles.editInputs}>
                        <View style={styles.editRow}>
                          <Text style={styles.editLabel}>Calories:</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editedMacros.calories.toString()}
                            onChangeText={(text) => setEditedMacros(prev => ({
                              ...prev, calories: parseInt(text, 10) || 0,
                            }))}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.editRow}>
                          <Text style={styles.editLabel}>Protein (g):</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editedMacros.protein.toString()}
                            onChangeText={(text) => setEditedMacros(prev => ({
                              ...prev, protein: parseInt(text, 10) || 0,
                            }))}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.editRow}>
                          <Text style={styles.editLabel}>Carbs (g):</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editedMacros.carbs.toString()}
                            onChangeText={(text) => setEditedMacros(prev => ({
                              ...prev, carbs: parseInt(text, 10) || 0,
                            }))}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.editRow}>
                          <Text style={styles.editLabel}>Fat (g):</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editedMacros.fat.toString()}
                            onChangeText={(text) => setEditedMacros(prev => ({
                              ...prev, fat: parseInt(text, 10) || 0,
                            }))}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    )}

                    <Pressable style={styles.logButton} onPress={handleLogMeal}>
                      <Text style={styles.logButtonText}>
                        🍽️ Log This Meal
                      </Text>
                    </Pressable>
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    color: '#4FC3F7',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#444',
  },
  searchButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingIndicator: {
    marginTop: 16,
  },
  errorText: {
    color: '#F06292',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  resultsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedResult: {
    borderColor: '#4FC3F7',
    backgroundColor: '#1e3a4a',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  confidencehigh: {
    backgroundColor: '#4CAF50',
  },
  confidencemedium: {
    backgroundColor: '#FF9800',
  },
  confidencelow: {
    backgroundColor: '#F44336',
  },
  confidenceText: {
    fontSize: 12,
  },
  resultMacros: {
    color: '#ddd',
    fontSize: 13,
    marginBottom: 2,
  },
  resultSource: {
    color: '#888',
    fontSize: 11,
  },
  editSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editToggle: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  editToggleText: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '500',
  },
  editInputs: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editLabel: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  editInput: {
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width: 80,
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: '#81C784',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
});
