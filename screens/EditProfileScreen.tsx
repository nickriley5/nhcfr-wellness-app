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
  const [dobDate, setDobDate] = useState<Date | undefined>(undefined);
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
      const dobString = data.dob || '';
      setDob(dobString);
      
      // Parse the date string to initialize dobDate
      if (dobString) {
        const parts = dobString.split('/');
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          setDobDate(dateObj);
        }
      }
      
      setHeight(data.height ? data.height.toString() : '');
      setWeight(data.weight ? data.weight.toString() : '');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const calculateAge = (dateString: string): number | undefined => {
    if (!dateString) return undefined;
    const parts = dateString.split('/');
    if (parts.length !== 3) return undefined;
    
    const birthDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSave = async () => {
    if (saving) {return;}
    setSaving(true);

    const uid = auth.currentUser?.uid;
    console.log('🔥 EditProfile - Starting save...');
    console.log('🔥 UID:', uid);
    
    if (!uid) {
      console.error('❌ No UID - user not authenticated!');
      return;
    }

    try {
      const age = calculateAge(dob);
      
      const profileData = {
        fullName,
        sex: sex.toLowerCase(),
        dob,
        age,
        height: parseFloat(height),
        weight: parseFloat(weight),
      };
      
      console.log('🔥 Profile data to save:', profileData);
      console.log('🔥 Firestore path:', `users/${uid}`);
      console.log('🔥 Attempting to write profile to Firestore...');
      
      await setDoc(doc(db, 'users', uid), profileData, { merge: true });
      
      console.log('✅ Profile saved successfully!');

      setShowToast(true);
      setTimeout(() => {
        navigation.goBack();
        setSaving(false);
      }, 1200);
    } catch (err: any) {
      console.error('❌ Profile update failed:', err);
      console.error('❌ Error message:', err.message || err.toString());
      console.error('❌ Error stack:', err.stack);
      setSaving(false);
    }
  };

  const handleDobChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDobDate(selectedDate);
    }
  };

  const handleDobConfirm = () => {
    if (dobDate) {
      const formatted = `${dobDate.getMonth() + 1}/${dobDate.getDate()}/${dobDate.getFullYear()}`;
      setDob(formatted);
    }
    setShowDobPicker(false);
  };

  const handleDobCancel = () => {
    setShowDobPicker(false);
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

        <Pressable 
          onPress={() => {
            // Initialize dobDate from dob string if not already set
            if (!dobDate && dob) {
              const parts = dob.split('/');
              if (parts.length === 3) {
                const dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                setDobDate(dateObj);
              }
            } else if (!dobDate) {
              // Default to 30 years ago if no date set
              const defaultDate = new Date();
              defaultDate.setFullYear(defaultDate.getFullYear() - 30);
              setDobDate(defaultDate);
            }
            setShowDobPicker(true);
          }} 
          style={styles.input}
        >
          <Text style={styles.dob}>{dob || 'Date of Birth (MM/DD/YYYY)'}</Text>
        </Pressable>
        {showDobPicker && (
          <View style={styles.pickerContainer}>
            <View style={styles.pickerButtons}>
              <Pressable onPress={handleDobCancel}>
                <Text style={styles.pickerButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDobConfirm}>
                <Text style={[styles.pickerButtonText, styles.pickerButtonDone]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={dobDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDobChange}
              maximumDate={new Date()}
              textColor="#ffffff"
            />
          </View>
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
  pickerContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  pickerButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  pickerButtonDone: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
