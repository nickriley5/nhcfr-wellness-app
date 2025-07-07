import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Toast from '../components/Toast';
import DashboardButton from '../components/Common/DashboardButton';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Profile'>>();
  const [fullName, setFullName] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female' | ''>('');
  const [dob, setDob] = useState('');
  const [dobDate, _setDobDate] = useState<Date | undefined>(undefined);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setFullName(data.fullName || '');
      setSex(data.sex ? data.sex.charAt(0).toUpperCase() + data.sex.slice(1) : '');
      setDob(data.dob || '');
      setHeight(data.height ? data.height.toString() : '');
      setWeight(data.weight ? data.weight.toString() : '');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (saving) {return;}
    setSaving(true);

    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    try {
      await setDoc(doc(db, 'users', uid), {
        fullName,
        sex: sex.toLowerCase(),
        dob,
        height: parseFloat(height),
        weight: parseFloat(weight),
      }, { merge: true });

      setShowToast(true);
      setTimeout(() => {
        navigation.goBack();
        setSaving(false);
      }, 1200);
    } catch (err: any) {
      console.log('Profile update failed:', err.message || err.toString());
      setSaving(false);
    }
  };

  const handleDobChange = (_: any, selectedDate?: Date) => {
    setShowDobPicker(false);
    if (selectedDate) {
      const formatted = `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}/${selectedDate.getFullYear()}`;
      setDob(formatted);
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Your Profile</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#aaa"
          value={fullName}
          onChangeText={setFullName}
        />

        <Pressable onPress={() => setShowDobPicker(true)} style={styles.input}>
          <Text style={styles.dob}>{dob || 'Date of Birth (MM/DD/YYYY)'}</Text>
        </Pressable>
        {showDobPicker && (
          <DateTimePicker
            value={dobDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDobChange}
            maximumDate={new Date()}
          />
        )}

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

        <DashboardButton
          text={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={saving}
          variant="redSolid"
        />
      </ScrollView>
    </SafeAreaView>

      {showToast && (
        <Toast message="Profile updated successfully!" onClose={() => setShowToast(false)} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
  flex: 1,
  backgroundColor: '#121212',
},

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
  dob: {
    color: '#fff',
    fontSize: 16,
  },
});

export default EditProfileScreen;
