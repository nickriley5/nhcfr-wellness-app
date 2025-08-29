import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { calculateItemMacros, sumMacros, validateMealAccuracy, preciseRound, safeNumber } from '../../utils/precisionMath';

interface EditableFoodItem {
  id: string;
  name: string;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseQuantity: number;
  currentQuantity: number;
  unit?: string;
}

interface MealData {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string | null;
  foodItems?: EditableFoodItem[];
  originalDescription?: string;
  mealType?: any;
  plannedTime?: string;
}

interface Props {
  visible: boolean;
  meal: MealData | null;
  onClose: () => void;
  onSave: (updatedMeal: MealData) => void;
  onDelete?: (mealId: string) => void;
  onReDescribe?: (meal: MealData) => void;
  dateKey: string; // Firestore path date key
}

/* ---------- helpers ---------- */
const clamp = (n: number) => Math.max(0, preciseRound(n));

const recalcTotalsFromItems = (items: EditableFoodItem[]) => {
  const itemMacros = items.map(item =>
    calculateItemMacros({
      baseCalories: item.baseCalories,
      baseProtein: item.baseProtein,
      baseCarbs: item.baseCarbs,
      baseFat: item.baseFat,
      baseQuantity: item.baseQuantity,
      currentQuantity: item.currentQuantity,
    })
  );
  return sumMacros(itemMacros);
};

const safeInt = (t: string) => {
  const v = parseInt(t.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(v) ? v : 0;
};

const kcalFromMacros = (p: number, c: number, f: number) => clamp(4 * safeNumber(p) + 4 * safeNumber(c) + 9 * safeNumber(f));


/* ---------- component ---------- */
const MealEditModal: React.FC<Props> = ({
  visible,
  meal,
  onClose,
  onSave,
  onDelete,
  onReDescribe,
  dateKey,
}) => {
  const [editedMeal, setEditedMeal] = useState<MealData>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    photoUri: null,
    foodItems: [],
  });

  // Advanced per-item editor toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Manual override for totals (when off, totals are derived from items)
  const [manualTotals, setManualTotals] = useState<boolean>(true);

  // init when a new meal arrives
  useEffect(() => {
    if (!meal) {return;}
    const items = meal.foodItems || [];
    const derivedTotals = items.length ? recalcTotalsFromItems(items) : null;

    setEditedMeal({
      ...meal,
      calories: derivedTotals ? derivedTotals.calories : meal.calories,
      protein: derivedTotals ? derivedTotals.protein : meal.protein,
      carbs: derivedTotals ? derivedTotals.carbs : meal.carbs,
      fat: derivedTotals ? derivedTotals.fat : meal.fat,
      foodItems: items.map((i) => ({ ...i })),
    });

    // if there are items, start in "derived" mode; otherwise manual
    setManualTotals(items.length === 0);
  }, [meal]);

  // Live totals from items
  const itemTotals = useMemo(() => {
    const items = editedMeal.foodItems || [];
    return items.length ? recalcTotalsFromItems(items) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }, [editedMeal.foodItems]);

  // What we display in the macro cards
  const displayTotals = manualTotals
    ? {
        calories: editedMeal.calories,
        protein: editedMeal.protein,
        carbs: editedMeal.carbs,
        fat: editedMeal.fat,
      }
    : itemTotals;

  // ✅ Enhanced accuracy validation
  const accuracyStatus = useMemo(() => {
    if (!editedMeal.foodItems?.length || manualTotals) {
      return null;
    }

    const mealLevelTotals = {
      calories: editedMeal.calories,
      protein: editedMeal.protein,
      carbs: editedMeal.carbs,
      fat: editedMeal.fat,
    };

    return validateMealAccuracy(mealLevelTotals, itemTotals);
  }, [editedMeal, itemTotals, manualTotals]);

  // Update items; if derived-mode, also refresh meal totals to match
  const updateItems = (updater: (prev: EditableFoodItem[]) => EditableFoodItem[]) => {
    setEditedMeal((prev) => {
      const nextItems = updater(prev.foodItems || []);
      const next = { ...prev, foodItems: nextItems };
      if (!manualTotals) {
        const t = recalcTotalsFromItems(nextItems);
        next.calories = t.calories;
        next.protein = t.protein;
        next.carbs = t.carbs;
        next.fat = t.fat;
      }
      return next;
    });
  };

  /* ---------- item controls ---------- */
  const changeQty = (itemId: string, delta: number) => {
    updateItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, currentQuantity: clamp((it.currentQuantity || 0) + delta) } : it
      )
    );
  };

  const deleteItem = (itemId: string) => {
    updateItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const updateItemMacros = (
  itemId: string,
  patch: Partial<Pick<EditableFoodItem, 'baseCalories' | 'baseProtein' | 'baseCarbs' | 'baseFat'>>
) => {
  updateItems((prev) =>
    prev.map((it) => {
      if (it.id !== itemId) {return it;}

      // Start with existing values
      const nextProtein = patch.baseProtein ?? it.baseProtein;
      const nextCarbs   = patch.baseCarbs   ?? it.baseCarbs;
      const nextFat     = patch.baseFat     ?? it.baseFat;

      // If user is changing P/C/F, auto-derive kcal.
      // If user explicitly changed kcal (patch.baseCalories present), respect that.
      const nextCalories =
        patch.baseCalories !== undefined
          ? patch.baseCalories
          : kcalFromMacros(nextProtein, nextCarbs, nextFat);

      return {
        ...it,
        baseProtein: clamp(nextProtein),
        baseCarbs:   clamp(nextCarbs),
        baseFat:     clamp(nextFat),
        baseCalories: clamp(nextCalories),
      };
    })
  );
};


  /* ---------- meal macro controls ---------- */
  const nudgeMealMacro = (key: 'calories' | 'protein' | 'carbs' | 'fat', delta: number) => {
    if (!manualTotals) {setManualTotals(true);} // auto-flip so buttons work
    setEditedMeal((p) => ({ ...p, [key]: clamp((p as any)[key] + delta) } as MealData));
  };

  const changeMealMacroText = (key: 'calories' | 'protein' | 'carbs' | 'fat', text: string) => {
    if (!manualTotals) {setManualTotals(true);}
    setEditedMeal((p) => ({ ...p, [key]: clamp(safeInt(text)) } as MealData));
  };

  /* ---------- persistence ---------- */
  const handleSave = async () => {
    if (!editedMeal.name.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a meal name', position: 'bottom' });
      return;
    }

    try {
      const uid = auth.currentUser?.uid;
      if (uid && editedMeal.id) {
        const mealDocRef = doc(db, `users/${uid}/mealLogs/${dateKey}/meals`, editedMeal.id);

        // If derived mode, persist the item totals; else persist manual
        const saveTotals = manualTotals ? displayTotals : itemTotals;

        await updateDoc(mealDocRef, {
          name: editedMeal.name,
          calories: clamp(saveTotals.calories),
          protein: clamp(saveTotals.protein),
          carbs: clamp(saveTotals.carbs),
          fat: clamp(saveTotals.fat),
          photoUri: editedMeal.photoUri || null,
          foodItems: editedMeal.foodItems || [],
          originalDescription: editedMeal.originalDescription || '',
          updatedAt: new Date(),
        });
      }

      onSave({
        ...editedMeal,
        calories: clamp(displayTotals.calories),
        protein: clamp(displayTotals.protein),
        carbs: clamp(displayTotals.carbs),
        fat: clamp(displayTotals.fat),
      });

      Toast.show({ type: 'success', text1: 'Meal Updated!', position: 'bottom' });
      onClose();
    } catch (error) {
      console.error('Failed to update meal:', error);
      Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Please try again', position: 'bottom' });
    }
  };

  const handleDelete = async () => {
    if (!meal?.id) {return;}
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {throw new Error('Missing user ID');}

      const mealRef = doc(db, `users/${uid}/mealLogs/${dateKey}/meals/${meal.id}`);
      await deleteDoc(mealRef);

      Toast.show({ type: 'success', text1: 'Meal deleted!', position: 'bottom' });
      onDelete?.(meal.id);
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
      Toast.show({ type: 'error', text1: 'Delete failed', text2: 'Please try again', position: 'bottom' });
    }
  };

  if (!meal) {return null;}

  const items = editedMeal.foodItems || [];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>Edit Meal</Text>

              <View style={styles.headerActions}>
                {!!editedMeal.originalDescription && (
                  <Pressable
                    onPress={() => onReDescribe?.(editedMeal)}
                    style={[styles.reDescribeBtn, styles.reDescribeBtnMargin]}
                  >
                    <Ionicons name="refresh" size={16} color="#000" />
                    <Text style={styles.reDescribeText}>Re-describe</Text>
                  </Pressable>
                )}
                <Pressable onPress={onClose}>
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Photo */}
            {editedMeal.photoUri && (
              <View style={styles.photoContainer}>
                <Image source={{ uri: editedMeal.photoUri }} style={styles.mealPhoto} />
              </View>
            )}

            {/* Original description bubble */}
            {!!editedMeal.originalDescription && (
              <View style={styles.descPill}>
                <Ionicons name="chatbubbles" size={14} color="#ccc" />
                <Text style={styles.descPillText} numberOfLines={2}>
                  {editedMeal.originalDescription}
                </Text>
              </View>
            )}

            {/* Name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Meal Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedMeal.name}
                onChangeText={(text) => setEditedMeal((prev) => ({ ...prev, name: text }))}
                placeholder="Enter meal name"
                placeholderTextColor="#666"
              />
            </View>

            {/* Items */}
            {!!items.length && (
              <>
                <View style={styles.itemsHeaderRow}>
                  <Text style={styles.sectionTitle}>Items in this meal</Text>
                  <Pressable
                    onPress={() => setShowAdvanced((v) => !v)}
                    style={[styles.reDescribeBtn, styles.reDescribeBtnDark]}
                  >
                    <Ionicons name="settings" size={14} color="#ddd" />
                    <Text style={styles.advancedToggleText}>
                      {showAdvanced ? 'Hide Advanced' : 'Advanced'}
                    </Text>
                  </Pressable>
                </View>

                {items.map((item, idx) => (
                <View
                  key={String(item.id ?? `${(item.name || 'item')}-${idx}`)}
                  style={styles.itemCard}
                    >
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMacros}>
                      {item.baseCalories} kcal • P {item.baseProtein}g • C {item.baseCarbs}g • F {item.baseFat}g per{' '}
                      {item.baseQuantity} {item.unit || 'serving'}
                    </Text>

                    <View style={styles.itemRow}>
                      <Pressable style={styles.qtyBtn} onPress={() => changeQty(item.id, -1)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </Pressable>
                      <View style={styles.qtyValue}>
                        <Text style={styles.qtyValueText}>{item.currentQuantity}</Text>
                      </View>
                      <Pressable style={styles.qtyBtn} onPress={() => changeQty(item.id, +1)}>
                        <Text style={styles.qtyBtnText}>＋</Text>
                      </Pressable>

                      <Pressable style={styles.trashBtn} onPress={() => deleteItem(item.id)}>
                        <Ionicons name="trash" size={18} color="#fff" />
                      </Pressable>
                    </View>

                    {showAdvanced && (
                      <View style={styles.advancedGrid}>
                        <AdvField
                          label="kcal"
                          value={String(item.baseCalories)}
                          onChange={(t) => updateItemMacros(item.id, { baseCalories: safeInt(t) })}
                        />
                        <AdvField
                          label="P"
                          value={String(item.baseProtein)}
                          onChange={(t) => updateItemMacros(item.id, { baseProtein: safeInt(t) })}
                        />
                        <AdvField
                          label="C"
                          value={String(item.baseCarbs)}
                          onChange={(t) => updateItemMacros(item.id, { baseCarbs: safeInt(t) })}
                        />
                        <AdvField
                          label="F"
                          value={String(item.baseFat)}
                          onChange={(t) => updateItemMacros(item.id, { baseFat: safeInt(t) })}
                        />
                      </View>
                    )}
                  </View>
                ))}

                <Text style={styles.totalsText}>
                  Totals from items: {itemTotals.calories} kcal • P {itemTotals.protein}g • C {itemTotals.carbs}g • F {itemTotals.fat}g
                </Text>

                {/* ✅ Enhanced accuracy indicator */}
                {accuracyStatus && accuracyStatus.shouldFlag && (
                  <View style={styles.accuracyWarning}>
                    <Ionicons name="warning" size={16} color="#F06292" />
                    <Text style={styles.accuracyWarningText}>
                      Macro discrepancy detected ({Math.round(accuracyStatus.variance * 100)}% variance)
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Macros Section */}
            {/* Macros Section */}
<View style={styles.sectionHeaderColumn}>
  <Text style={styles.sectionTitle}>Nutrition Information</Text>

  {/* manual override switch (now under the title) */}
  <View style={styles.switchRow}>
    <Text style={styles.switchLabel}>
      {manualTotals ? 'Manual override' : 'Derived from items'}
    </Text>
    <Switch
      value={manualTotals}
      onValueChange={setManualTotals}
      trackColor={{ false: '#444', true: '#4FC3F7' }}
      thumbColor="#000"
    />
  </View>

  {/* ✅ Accuracy status indicator */}
  {!manualTotals && accuracyStatus && (
    <View style={styles.accuracyIndicator}>
      <Ionicons
        name={accuracyStatus.isAccurate ? 'checkmark-circle' : 'warning'}
        size={14}
        color={accuracyStatus.isAccurate ? '#4CAF50' : '#F06292'}
      />
      <Text style={[
        styles.accuracyText,
        accuracyStatus.isAccurate ? styles.accuracySuccess : styles.accuracyError,
      ]}>
        {accuracyStatus.isAccurate ? 'Calculations verified' : `${Math.round(accuracyStatus.variance * 100)}% variance detected`}
      </Text>
    </View>
  )}
</View>


            {/* Calories */}
            <MacroRow
              label="Calories"
              unit=" kcal"
              value={displayTotals.calories}
              disabled={!manualTotals}
              onMinus={() => nudgeMealMacro('calories', -10)}
              onPlus={() => nudgeMealMacro('calories', +10)}
              onChange={(t) => changeMealMacroText('calories', t)}
            />

            {/* Protein */}
            <MacroRow
              label="Protein"
              unit="g"
              value={displayTotals.protein}
              disabled={!manualTotals}
              accent="#4FC3F7"
              onMinus={() => nudgeMealMacro('protein', -1)}
              onPlus={() => nudgeMealMacro('protein', +1)}
              onChange={(t) => changeMealMacroText('protein', t)}
            />

            {/* Carbs */}
            <MacroRow
              label="Carbs"
              unit="g"
              value={displayTotals.carbs}
              disabled={!manualTotals}
              accent="#81C784"
              onMinus={() => nudgeMealMacro('carbs', -1)}
              onPlus={() => nudgeMealMacro('carbs', +1)}
              onChange={(t) => changeMealMacroText('carbs', t)}
            />

            {/* Fat */}
            <MacroRow
              label="Fat"
              unit="g"
              value={displayTotals.fat}
              disabled={!manualTotals}
              accent="#F06292"
              onMinus={() => nudgeMealMacro('fat', -1)}
              onPlus={() => nudgeMealMacro('fat', +1)}
              onChange={(t) => changeMealMacroText('fat', t)}
            />

            {/* Actions */}
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

/* ---------- small subcomponents ---------- */
const AdvField = ({ label, value, onChange }: { label: string; value: string; onChange: (t: string) => void }) => (
  <View style={styles.advField}>
    <Text style={styles.advLabel}>{label}</Text>
    <TextInput
      style={styles.advInput}
      keyboardType="numeric"
      value={value}
      onChangeText={onChange}
    />
  </View>
);

const MacroRow: React.FC<{
  label: string;
  unit: string;
  value: number;
  disabled: boolean;
  accent?: string;
  onMinus: () => void;
  onPlus: () => void;
  onChange: (t: string) => void;
}> = ({ label, unit, value, disabled, accent = '#FFD54F', onMinus, onPlus, onChange }) => {
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroInfo}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={[styles.macroValue, { color: accent }]}>
          {value}
          {unit}
        </Text>
        <Text style={styles.derivedNote}>{disabled ? 'Derived from items' : 'Manual'}</Text>
      </View>
      <View style={styles.macroControls}>
        <Pressable style={[styles.macroButton, disabled && styles.disabledBtn]} onPress={disabled ? undefined : onMinus}>
          <Ionicons name="remove" size={16} color={disabled ? '#555' : '#fff'} />
        </Pressable>
        <TextInput
          style={[styles.macroInput, disabled && styles.disabledInput]}
          value={String(value)}
          editable={!disabled}
          keyboardType="numeric"
          onChangeText={disabled ? undefined : onChange}
        />
        <Pressable style={[styles.macroButton, disabled && styles.disabledBtn]} onPress={disabled ? undefined : onPlus}>
          <Ionicons name="add" size={16} color={disabled ? '#555' : '#fff'} />
        </Pressable>
      </View>
    </View>
  );
};

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '95%', maxHeight: '90%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  itemsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },

  reDescribeBtn: { backgroundColor: '#4FC3F7', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  reDescribeBtnDark: { backgroundColor: '#333' },
  reDescribeBtnMargin: { marginRight: 10 },
  reDescribeText: { color: '#000', fontWeight: '700', fontSize: 12 },

  photoContainer: { alignItems: 'center', marginBottom: 12 },
  mealPhoto: { width: 120, height: 120, borderRadius: 12, resizeMode: 'cover' },

  descPill: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#2a2a2a', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#333', marginBottom: 12 },
  descPillText: { color: '#ddd', fontSize: 12, flex: 1, lineHeight: 16 },

  inputSection: { marginBottom: 16 },
  inputLabel: { color: '#aaa', fontSize: 14, marginBottom: 8 },
  textInput: { backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { color: '#aaa', marginRight: 6 },

  itemCard: { backgroundColor: '#222', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#333', marginBottom: 12 },
  itemName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  itemMacros: { color: '#aaa', marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { backgroundColor: '#444', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  qtyValue: { backgroundColor: '#333', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  qtyValueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  trashBtn: { marginLeft: 'auto', backgroundColor: '#C62828', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },

  advancedGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  advField: { backgroundColor: '#1f1f1f', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#333', minWidth: 64, alignItems: 'center' },
  advLabel: { color: '#aaa', fontSize: 10, marginBottom: 4 },
  advInput: { color: '#fff', fontSize: 14, textAlign: 'center', paddingVertical: 4, paddingHorizontal: 6, minWidth: 50 },

  totalsText: { color: '#ddd', marginBottom: 12, marginTop: -4 },

  macroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, marginBottom: 12 },
  macroInfo: { flex: 1 },
  macroLabel: { color: '#aaa', fontSize: 14, marginBottom: 4 },
  macroValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  derivedNote: { color: '#888', fontSize: 12, marginTop: 2 },
  macroControls: { flexDirection: 'row', alignItems: 'center' },
  macroButton: { backgroundColor: '#444', borderRadius: 6, padding: 8 },
  macroInput: { backgroundColor: '#333', color: '#fff', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8, minWidth: 60, textAlign: 'center', fontSize: 16 },
  disabledBtn: { opacity: 0.35 },
  disabledInput: { opacity: 0.55 },

  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  deleteButton: { flex: 1, backgroundColor: '#F44336', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  saveButton: { flex: 2, backgroundColor: '#4FC3F7', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#000', fontWeight: '600', marginLeft: 6 },
  advancedToggleText: { color: '#ddd', fontSize: 12, fontWeight: '700' },
  sectionHeaderColumn: {
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  marginTop: 8,
  marginBottom: 8,
},

  // ✅ NEW: Accuracy indicator styles
  accuracyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1f1f',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#5d2d2d',
  },
  accuracyWarningText: {
    color: '#F06292',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  accuracyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  accuracyText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  accuracySuccess: {
    color: '#4CAF50',
  },
  accuracyError: {
    color: '#F06292',
  },
});
