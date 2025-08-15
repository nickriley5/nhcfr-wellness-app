import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../firebase';
import {
  analyzeWeightProgress,
  adjustMacroPlansIfNeeded,
  getNutritionGuidance,
} from '../../utils/adaptiveNutrition';

interface NutritionInsightsCardProps {
  onMacroUpdated?: () => void;
}

const NutritionInsightsCard: React.FC<NutritionInsightsCardProps> = ({ onMacroUpdated }) => {
  const [guidance, setGuidance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadGuidance = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const nutritionGuidance = await getNutritionGuidance(uid);
      setGuidance(nutritionGuidance);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading nutrition guidance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuidance();
  }, []);

  const handleAutoAdjust = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || adjusting) {
      return;
    }

    try {
      setAdjusting(true);

      // Get analysis first to show user what will happen
      const analysis = await analyzeWeightProgress(uid);
      if (!analysis) {
        Alert.alert('No Data', 'Need more weight entries to make adjustments.');
        return;
      }

      if (analysis.recommendedAction === 'maintain') {
        Alert.alert('On Track! 🎯', 'Your nutrition plan is working well. No adjustments needed.');
        return;
      }

      if (analysis.recommendedAction === 'slow_down') {
        Alert.alert(
          'Take It Slower ⚠️',
          analysis.warningMessage || 'Current rate may be too aggressive. Consider consulting with a nutritionist.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show confirmation dialog with details
      const actionText = analysis.recommendedAction === 'increase_calories'
        ? `increase by ${analysis.adjustmentAmount} calories`
        : `decrease by ${analysis.adjustmentAmount} calories`;

      Alert.alert(
        'Adjust Nutrition Plan?',
        `Based on your progress, I recommend we ${actionText} to better align with your goals.\n\n${analysis.warningMessage || ''}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Adjust Plan',
            onPress: async () => {
              const success = await adjustMacroPlansIfNeeded(uid, true);
              if (success) {
                Alert.alert(
                  'Plan Updated! ✅',
                  'Your macro targets have been adjusted. Check your meal plan for the new targets.',
                  [{ text: 'OK' }]
                );
                onMacroUpdated?.();
                loadGuidance(); // Refresh guidance
              } else {
                Alert.alert('Update Failed', 'Unable to adjust plan. Please try again later.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adjusting plan:', error);
      Alert.alert('Error', 'Unable to analyze progress. Please try again later.');
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Nutrition Insights</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#33d6a6" />
          <Text style={styles.loadingText}>Analyzing your progress...</Text>
        </View>
      </View>
    );
  }

  if (!guidance) {
    return (
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Nutrition Insights</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No insights yet</Text>
          <Text style={styles.helperText}>
            Log your weight regularly to get personalized nutrition guidance
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tile}>
      <View style={styles.tileHeaderRow}>
        <Text style={styles.tileHeader}>Nutrition Insights</Text>
        <Pressable
          style={[styles.adjustButton, adjusting && styles.adjustButtonDisabled]}
          onPress={handleAutoAdjust}
          disabled={adjusting}
        >
          {adjusting ? (
            <ActivityIndicator size="small" color="#0b0f14" />
          ) : (
            <Ionicons name="settings" size={18} color="#0b0f14" />
          )}
        </Pressable>
      </View>

      <Text style={styles.guidanceText}>{guidance}</Text>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.refreshButton}
          onPress={loadGuidance}
        >
          <Ionicons name="refresh" size={16} color="#aaa" />
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>

        {lastUpdated && (
          <Text style={styles.timestampText}>
            Updated {lastUpdated.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        )}
      </View>

      <Pressable
        style={styles.autoAdjustButton}
        onPress={handleAutoAdjust}
        disabled={adjusting}
      >
        <Text style={styles.autoAdjustText}>
          {adjusting ? 'Analyzing...' : 'Auto-Adjust Plan'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  tileHeader: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 20,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adjustButton: {
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonDisabled: {
    backgroundColor: '#2a4a3d',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 4,
  },
  helperText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  guidanceText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    color: '#aaa',
    fontSize: 14,
  },
  timestampText: {
    color: '#aaa',
    fontSize: 12,
  },
  autoAdjustButton: {
    backgroundColor: '#33d6a6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  autoAdjustText: {
    color: '#0b0f14',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default NutritionInsightsCard;
