import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const GoalsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [goalWeight, setGoalWeight] = useState('');
  const [dietPreference, setDietPreference] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editType, setEditType] = useState<'goals' | 'meal' | 'workout' | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGoalWeight(data.goalWeight?.toString() || '');
          setDietPreference(data.dietPreference || '');
          setRestrictions(Array.isArray(data.restrictions) ? data.restrictions.join(', ') : '');
        }
      } catch (err) {
        Alert.alert('Error loading goals');
      }
    };

    fetchGoals();
  }, []);

  const saveGoals = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        goalWeight,
        dietPreference,
        restrictions: restrictions.split(',').map(r => r.trim()),
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>🎯 Your Current Goals</Text>

      <Text style={styles.infoText}>Goal Weight: {goalWeight} lbs</Text>
      <Text style={styles.infoText}>Diet: {dietPreference || 'None'}</Text>
      <Text style={styles.infoText}>Restrictions: {restrictions || 'None'}</Text>

      <Pressable style={styles.outlinedButton} onPress={() => openEditModal('goals')}>
        <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.buttonText}>Edit Fitness & Diet Goals</Text>
      </Pressable>

      <Pressable style={styles.outlinedButton} onPress={() => openEditModal('meal')}>
        <Ionicons name="fast-food-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.buttonText}>Change Meal Program</Text>
      </Pressable>

      <Pressable style={styles.outlinedButton} onPress={() => openEditModal('workout')}>
        <Ionicons name="barbell-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.buttonText}>Change Workout Program</Text>
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
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={goalWeight}
                  onChangeText={setGoalWeight}
                />
                <Text style={styles.label}>Dietary Preference</Text>
                <TextInput
                  style={styles.input}
                  value={dietPreference}
                  onChangeText={setDietPreference}
                />
                <Text style={styles.label}>Dietary Restrictions</Text>
                <TextInput
                  style={styles.input}
                  value={restrictions}
                  onChangeText={setRestrictions}
                />
              </>
            )}

            {editType !== 'goals' && <Text style={styles.infoText}>Customization coming soon...</Text>}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Pressable style={[styles.outlinedButton, { flex: 1, marginRight: 10 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              {editType === 'goals' && (
                <Pressable style={[styles.outlinedButton, { flex: 1 }]} onPress={saveGoals}>
                  <Text style={styles.buttonText}>Save</Text>
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
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 20 },
  infoText: { color: '#ddd', fontSize: 16, marginBottom: 8 },
  label: { color: '#ccc', fontSize: 14, marginTop: 10 },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderColor: '#333',
    borderWidth: 1,
    marginTop: 4,
  },
  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderColor: '#d32f2f',
    borderWidth: 1.5,
    padding: 12,
    marginTop: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
});

export default GoalsScreen;
