import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import WheelPicker from 'react-native-wheely';

const GoalsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [goalWeight, setGoalWeight] = useState('');
  const [dietPreference, setDietPreference] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editType, setEditType] = useState<'goals' | 'meal' | 'workout' | null>(null);

  const dietOptions = ['Paleo', 'Carnivore', 'Vegan', 'Vegetarian', 'Keto'];
  const restrictionOptions = ['None', 'Dairy-Free', 'Gluten-Free', 'Low FODMAP'];
  const weightOptions = Array.from({ length: 200 }, (_, i) => (100 + i).toString());

  useEffect(() => {
    const fetchGoals = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGoalWeight(data.goalWeight?.toString() || '');
          setDietPreference(data.dietPreference || '');
          setRestrictions(Array.isArray(data.restrictions) ? data.restrictions : []);
        }
      } catch (err) {
        Alert.alert('Error loading goals');
      }
    };

    fetchGoals();
  }, []);

  const saveGoals = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}
    try {
      await updateDoc(doc(db, 'users', uid), {
        goalWeight,
        dietPreference,
        restrictions: restrictions.includes('None') ? [] : restrictions,
      });
      setModalVisible(false);
      Alert.alert('Goals updated successfully!');
    } catch (err) {
      Alert.alert('Error saving goals');
    }
  };

  const openEditModal = (type: 'goals' | 'meal' | 'workout') => {
    setEditType(type);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>🎯 Your Current Goals</Text>

      <Text style={styles.infoText}>Goal Weight: {goalWeight} lbs</Text>
      <Text style={styles.infoText}>Diet: {dietPreference || 'None'}</Text>
      <Text style={styles.infoText}>Restrictions: {restrictions.length > 0 ? restrictions.join(', ') : 'None'}</Text>

      <Pressable style={styles.thinButton} onPress={() => openEditModal('goals')}>
        <Ionicons name="create-outline" size={20} color="#fff" style={styles.iconMarginRight} />
        <Text style={styles.thinButtonText}>Edit Fitness & Diet Goals</Text>
      </Pressable>

      <Pressable style={styles.thinButton} onPress={() => openEditModal('meal')}>
        <Ionicons name="fast-food-outline" size={20} color="#fff" style={styles.iconMarginRight} />
        <Text style={styles.thinButtonText}>Change Meal Program</Text>
      </Pressable>

      <Pressable style={styles.thinButton} onPress={() => openEditModal('workout')}>
        <Ionicons name="barbell-outline" size={20} color="#fff" style={styles.iconMarginRight} />
        <Text style={styles.thinButtonText}>Change Workout Program</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editType === 'goals' ? 'Update Fitness & Diet Goals' : editType === 'meal' ? 'Change Meal Program' : 'Change Workout Program'}
            </Text>

            {editType === 'goals' && (
              <>
                <Text style={styles.label}>Goal Weight (lbs)</Text>
                <WheelPicker
                  selectedIndex={weightOptions.indexOf(goalWeight)}
                  options={weightOptions}
                  onChange={i => setGoalWeight(weightOptions[i])}
                  visibleRest={2}
                  itemHeight={40}
                  containerStyle={styles.wheelPickerContainer}
                  selectedIndicatorStyle={styles.selectedIndicator}
                  itemTextStyle={styles.wheelPickerItemText}
                />
                <Text style={styles.label}>Dietary Preference</Text>
                <WheelPicker
                  selectedIndex={dietOptions.indexOf(dietPreference)}
                  options={dietOptions}
                  onChange={i => setDietPreference(dietOptions[i])}
                  visibleRest={2}
                  itemHeight={40}
                  containerStyle={styles.wheelPickerContainer}
                  selectedIndicatorStyle={styles.selectedIndicator}
                  itemTextStyle={styles.wheelPickerItemText}
                />
                <Text style={styles.label}>Restrictions</Text>
                <WheelPicker
                  selectedIndex={restrictions.length ? restrictionOptions.indexOf(restrictions[0]) : 0}
                  options={restrictionOptions}
                  onChange={i => setRestrictions(
                    restrictionOptions[i] === 'None' ? [] : [restrictionOptions[i]]
                  )}
                  visibleRest={2}
                  itemHeight={40}
                  containerStyle={styles.wheelPickerContainer}
                  selectedIndicatorStyle={styles.selectedIndicator}
                  itemTextStyle={styles.wheelPickerItemText}
                />
              </>
            )}

            {editType !== 'goals' && <Text style={styles.infoText}>Customization coming soon...</Text>}

            <View style={styles.buttonRow}>
              <Pressable style={[styles.thinButton, styles.flexButtonLeft]} onPress={() => setModalVisible(false)}>
                <Text style={styles.thinButtonText}>Cancel</Text>
              </Pressable>
              {editType === 'goals' && (
                <Pressable style={[styles.thinButton, styles.flexButtonRight]} onPress={saveGoals}>
                  <Text style={styles.thinButtonText}>Save</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#121212', flex: 1 },
  contentContainer: { padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 20 },
  infoText: { color: '#ddd', fontSize: 16, marginBottom: 8 },
  label: { color: '#ccc', fontSize: 14, marginTop: 10 },
  thinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: '#d32f2f',
    borderWidth: 1.5,
    padding: 12,
    marginTop: 16,
    borderRadius: 10,
  },
  thinButtonText: { color: '#fff', fontWeight: '600' },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  iconMarginRight: {
    marginRight: 10,
  },
  wheelPickerContainer: {
    height: 160,
    backgroundColor: '#2a2a2a',
  },
  selectedIndicator: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d32f2f',
  },
  wheelPickerItemText: {
    color: '#d32f2f',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  flexButtonLeft: {
    flex: 1,
    marginRight: 10,
  },
  flexButtonRight: {
    flex: 1,
  },
});

export default GoalsScreen;
