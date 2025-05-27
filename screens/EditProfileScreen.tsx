import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Toast from '../components/Toast';

const EditProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Profile'>>();
  const [fullName, setFullName] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female' | ''>('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const fetchProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setFullName(data.fullName || '');
      setSex(data.sex || '');
      setDob(data.dob || '');
      setHeight(data.height || '');
      setWeight(data.weight || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      await setDoc(doc(db, 'users', uid), {
        fullName,
        sex,
        dob,
        height,
        weight,
      }, { merge: true });

      setShowToast(true);

      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (err: any) {
      console.log('Profile update failed:', err.message || err.toString());
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Your Profile</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#aaa"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth (MM/DD/YYYY)"
          placeholderTextColor="#aaa"
          value={dob}
          onChangeText={setDob}
        />
        <TextInput
          style={styles.input}
          placeholder="Height (in)"
          placeholderTextColor="#aaa"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Weight (lbs)"
          placeholderTextColor="#aaa"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Sex</Text>
        <View style={styles.buttonGroup}>
          {['Male', 'Female'].map(option => (
            <Pressable
              key={option}
              onPress={() => setSex(option as 'Male' | 'Female')}
              style={[styles.selectButton, sex === option && styles.selected]}
            >
              <Text style={styles.buttonText}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>
      </ScrollView>

      {showToast && (
        <Toast message="Profile updated successfully!" onClose={() => setShowToast(false)} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#121212',
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: { color: '#fff' },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  label: { color: '#d32f2f', fontSize: 18, marginBottom: 8 },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  selected: { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
  buttonText: { color: '#fff', fontSize: 16 },
  saveButton: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
