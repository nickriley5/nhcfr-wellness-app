// screens/MacroPlanOverviewScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Rect, Path } from 'react-native-svg';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const screenWidth = Dimensions.get('window').width;

// Define barWidth and barSpacing outside the component for use in styles
const barWidth = 28;
const barSpacing = 10;

const MacroPlanOverviewScreen = () => {
  const route = useRoute<
    RouteProp<RootStackParamList, 'MacroPlanOverview'>
  >();
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList>
  >();

  const { proteinGrams, fatGrams, carbGrams, zoneBlocks, dietMethod, goalType, name } = route.params;


  const [selectedMode, setSelectedMode] = useState<'standard' | 'zone'>(
    dietMethod === 'zone' ? 'zone' : 'standard'
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const chartHeight = 180;



  // Calorie calculation
  const calorieFrom = (p: number, c: number, f: number) =>
    p * 4 + c * 4 + f * 9;
  const targetCalories = calorieFrom(
    proteinGrams,
    carbGrams,
    fatGrams
  );

  // Weekly data state
  const initialWeekly = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ].map(day => ({
    day,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
  }));

  const [weeklyData, setWeeklyData] = useState(initialWeekly);

  // Editors
  const [editProtein, setEditProtein] = useState<number>(proteinGrams);
  const [editCarbs, setEditCarbs] = useState<number>(carbGrams);
  const [editFat, setEditFat] = useState<number>(fatGrams);

  useEffect(() => {
    const d = weeklyData[selectedDayIndex];
    LayoutAnimation.easeInEaseOut();
    setEditProtein(d.protein);
    setEditCarbs(d.carbs);
    setEditFat(d.fat);
  }, [selectedDayIndex, weeklyData]);

  const currentDayCalories = calorieFrom(
    editProtein,
    editCarbs,
    editFat
  );
  const diff = currentDayCalories - targetCalories;
  const saveDisabled = currentDayCalories !== targetCalories;


  const colors = {
    protein: '#4FC3F7',
    carbs: '#81C784',
    fat: '#F06292',
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a']}
        style={styles.container}
      >

        <View style={styles.headerContainer}>
  <Text style={styles.greeting}>Hi, {name}</Text>
  <View style={styles.goalTag}>
    <Text style={styles.goalText}>🎯 Goal: {goalType === 'maintain' ? 'Maintain Weight' : goalType === 'fatloss' ? 'Lose Fat' : 'Build Muscle'}</Text>
  </View>
</View>


        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.recapCard}>
            <Text style={styles.recapText}>
              Target: {targetCalories} kcal · P {proteinGrams}g · C {carbGrams}g · F {fatGrams}g
            </Text>
          </View>

          <View style={styles.toggleContainer}>
  {['standard', 'zone'].map(mode => (
    <TouchableOpacity
      key={mode}
      style={[
        styles.toggleButton,
        selectedMode === mode && styles.toggleActive,
      ]}
      onPress={() => setSelectedMode(mode as 'standard' | 'zone')}
    >
      <Text
        style={[
          styles.toggleText,
          selectedMode === mode && styles.toggleTextActive,
        ]}
      >
        {mode === 'standard' ? 'Standard Macros' : 'Zone Blocks'}
      </Text>
    </TouchableOpacity>
  ))}
</View>


          {selectedMode === 'standard' ? (
            <>
              <Text style={styles.chartLabel}>
                Weekly Macro Overview
              </Text>
              <Svg width={screenWidth} height={chartHeight + 5}>
  {weeklyData.map((d, i) => {
    const total = calorieFrom(d.protein, d.carbs, d.fat);
    const proteinHeight = (d.protein * 4 / total) * chartHeight;
    const carbsHeight = (d.carbs * 4 / total) * chartHeight;
    const fatHeight = (d.fat * 9 / total) * chartHeight;


    const xOffset = 24; // shift right to align bars
    const x = xOffset + i * (barWidth + barSpacing);
    const y = chartHeight;

    return (
      <React.Fragment key={i}>
        <Rect
          x={x}
          y={y - proteinHeight}
          width={barWidth}
          height={proteinHeight}
          fill={colors.protein}
          onPress={() => setSelectedDayIndex(i)}
        />
        <Rect
          x={x}
          y={y - proteinHeight - carbsHeight}
          width={barWidth}
          height={carbsHeight}
          fill={colors.carbs}
          onPress={() => setSelectedDayIndex(i)}
        />
        <Rect
          x={x}
          y={y - proteinHeight - carbsHeight - fatHeight}
          width={barWidth}
          height={fatHeight}
          fill={colors.fat}
          onPress={() => setSelectedDayIndex(i)}
        />
      </React.Fragment>
    );
  })}
</Svg>



              <View style={styles.dayLabelsRow}>
  {dayLabels.map((label, i) => (
    <Text key={i} style={styles.dayLabel}>
      {label}
    </Text>
  ))}
</View>


              <Text
                style={[
                  styles.diffText,
                  diff > 0 ? styles.over : styles.under,
                ]}
              >
                {diff === 0
                  ? 'On target'
                  : diff > 0
                  ? `+ ${diff} kcal over`
                  : `${Math.abs(diff)} kcal under`}
              </Text>

              <View style={styles.editCard}>
                <Text style={styles.editTitle}>
                  Edit {weeklyData[selectedDayIndex].day} Macros
                </Text>
                {(
                  ['protein', 'carbs', 'fat'] as const
                ).map(m => {
                  const val =
                    m === 'protein'
                      ? editProtein
                      : m === 'carbs'
                      ? editCarbs
                      : editFat;
                  return (
                    <View
                      key={m}
                      style={styles.sliderRow}
                    >
                      <Text style={styles.sliderLabel}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}: {val}g
                      </Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={
                          targetCalories /
                          (m === 'fat' ? 9 : 4)
                        }
                        step={1}
                        value={val}
                        onValueChange={(
                          value: number
                        ) => {
                          if (m === 'protein') {
                            setEditProtein(value);
                          } else if (m === 'carbs') {
                            setEditCarbs(val);
                          } else {
                            setEditFat(val);
                          }
                        }}
                      />
                    </View>
                  );
                })}
                <Text style={styles.warning}>
                  {saveDisabled
                    ? `Total calories must equal ${targetCalories} kcal`
                    : 'Ready to save'}
                </Text>
                <View style={styles.editButtons}>
                  <Pressable
                    style={[
                      styles.saveButton,
                      saveDisabled && styles.disabled,
                    ]}
                    disabled={saveDisabled}
                    onPress={() => {
                      const updated = weeklyData.map(
                        (d, i) =>
                          i === selectedDayIndex
                            ? {
                                ...d,
                                protein: editProtein,
                                carbs: editCarbs,
                                fat: editFat,
                              }
                            : d
                      );
                      setWeeklyData(updated);
                    }}
                  >
                    <Text style={styles.saveText}>
                      Save
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const d =
                        weeklyData[selectedDayIndex];
                      setEditProtein(d.protein);
                      setEditCarbs(d.carbs);
                      setEditFat(d.fat);
                    }}
                  >
                    <Text style={styles.cancelText}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.chartLabel}>
                Zone Block Distribution
              </Text>
              <Svg height={200} width={200} style={styles.centeredSvg}>
                {(() => {
                  const total =
                    zoneBlocks.protein +
                    zoneBlocks.carbs +
                    zoneBlocks.fats;
                  let start = 0;
                  const r = 90;
                  const cx = 100;
                  const cy = 100;
                  return [
                    { key: 'Protein', v: zoneBlocks.protein, color: colors.protein },
                    { key: 'Carbs', v: zoneBlocks.carbs, color: colors.carbs },
                    { key: 'Fats', v: zoneBlocks.fats, color: colors.fat },
                  ].map((s, i) => {
                    const angle =
                      (s.v / total) * 2 * Math.PI;
                    const x1 =
                      cx + r * Math.cos(start);
                    const y1 =
                      cy + r * Math.sin(start);
                    const x2 =
                      cx + r * Math.cos(start + angle);
                    const y2 =
                      cy + r * Math.sin(start + angle);
                    const large = angle > Math.PI ? 1 : 0;
                    const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
                    start += angle;
                    return (
                      <Path
                        key={i}
                        d={d}
                        fill={s.color}
                      />
                    );
                  });
                })()}
              </Svg>

              <View style={styles.zoneLegend}>
  {[
    { label: 'Protein', color: colors.protein },
    { label: 'Carbs', color: colors.carbs },
    { label: 'Fats', color: colors.fat },
  ].map((item, idx) => (
    <View key={idx} style={styles.legendRow}>
      <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
      <Text style={styles.legendText}>{item.label}</Text>
    </View>
  ))}
</View>

<Text style={styles.totalBlocks}>
  Total: {zoneBlocks.protein + zoneBlocks.carbs + zoneBlocks.fats} Blocks
</Text>



              <View style={styles.dayDetailCard}>
                <Text style={styles.label}>
                  Meal Breakdown (mock):
                </Text>
                <Text style={styles.summary}>
  🥞 Breakfast: {zoneBlocks.protein}P/{zoneBlocks.carbs}C/{zoneBlocks.fats}F blocks{'\n'}
  🍎 Snack: 2 blocks{'\n'}
  🥗 Lunch: 4 blocks{'\n'}
  🍲 Dinner: 4 blocks
</Text>
              </View>
            </>
          )}

          <Pressable
            style={styles.button}
            onPress={() =>
              navigation.navigate('AppDrawer', {
                screen: 'MainTabs',
                params: { screen: 'Dashboard' },
              })
            }
          >
            <Text style={styles.buttonText}>
              Return to Dashboard
            </Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  headerContainer: {
  marginBottom: 20,
  alignItems: 'center',
},
greeting: {
  fontSize: 22,
  fontWeight: '700',
  color: '#fff',
  marginBottom: 6,
},
goalTag: {
  backgroundColor: '#2a2a2a',
  paddingHorizontal: 16,
  paddingVertical: 6,
  borderRadius: 20,
},
goalText: {
  color: '#ccc',
  fontWeight: '600',
  fontSize: 14,
},

  container: { flex: 1 },
  scroll: { padding: 20 },
  recapCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  recapText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  toggleContainer: {
  flexDirection: 'row',
  backgroundColor: '#2b2b2b',
  borderRadius: 999,
  padding: 4,
  marginVertical: 20,
  },
  toggleButton: {
  flex: 1,
  paddingVertical: 10,
  borderRadius: 999,
  alignItems: 'center',
  justifyContent: 'center',
},
  toggleActive: {
  backgroundColor: '#4FC3F7',
},
toggleText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#aaa',
},
toggleTextActive: {
  color: '#fff',
},
  chartLabel: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  diffText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  over: { color: '#ff6b6b' },
  under: { color: '#81C784' },
  editCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  editTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sliderRow: { marginBottom: 12 },
  sliderLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  slider: { width: '100%', height: 40 },
  warning: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  centeredSvg: { alignSelf: 'center', marginBottom: 8 },
  dayDetailCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summary: { color: '#bbb', fontSize: 14, lineHeight: 20 },
  button: {
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dayLabelsRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 2,
  paddingHorizontal: 10,
},
dayLabel: {
  color: 'white',
  fontSize: 12,
  textAlign: 'center',
  width: barWidth + barSpacing,
},
zoneLegend: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginBottom: 10,
},
legendRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginHorizontal: 8,
},
legendColorBox: {
  width: 14,
  height: 14,
  borderRadius: 3,
  marginRight: 6,
},
legendText: {
  color: '#ccc',
  fontSize: 13,
},
totalBlocks: {
  textAlign: 'center',
  color: '#888',
  fontSize: 14,
  marginBottom: 10,
},


});

export default MacroPlanOverviewScreen;
