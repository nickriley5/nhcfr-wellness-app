import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView, Alert, Modal, TextInput, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import WheelPicker from 'react-native-wheely';
import Toast from '../components/Toast';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Profile'>>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinDate, setJoinDate] = useState<string>('');
    const [showToast, setShowToast] = useState(false);

  const [bodyFatPct, setBodyFatPct] = useState<string>('');
  const [bfModalVisible, setBfModalVisible] = useState(false);
  const [bfStep, setBfStep] = useState<number>(1);
  const [gender, setGender] = useState<'male'|'female'|null>(null);
  const [neck, setNeck] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hip, setHip] = useState<string>('');
  const [manualMode, setManualMode] = useState(false);
  const [manualBfInput, setManualBfInput] = useState('');

  const measurementOptions = Array.from({ length: 51 }, (_, i) => (10 + i).toString());

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data.bodyFatPct != null) setBodyFatPct(data.bodyFatPct.toString());
        if (data?.createdAt?.toDate) {
          const joined = data.createdAt.toDate();
          setJoinDate(joined.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }));
        }
      }
    } catch (err) {
      Alert.alert('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProfile(); }, []));

  const updateProfilePicture = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7, selectionLimit: 1 });
    if (result.assets?.length) {
      const photoUri = result.assets[0].uri;
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid), { profilePicture: photoUri });
      setProfile((prev: any) => ({ ...prev, profilePicture: photoUri }));
    }
  };

  const saveBodyFat = async (pct: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), { bodyFatPct: pct });
      setBodyFatPct(pct.toFixed(1));
      setBfModalVisible(false);
      setShowToast(true);

    } catch {
      Alert.alert('Error saving body fat');
    }
  };

    // Calculate body fat via U.S. Navy method
const calculateBodyFat = (): number | null => {
  const h = profile?.height;
  if (!gender || !neck || !waist || (gender === 'female' && !hip) || !h) return null;
  
  const hNum = Number(h);
  const neckNum = Number(neck);
  const waistNum = Number(waist);
  let bf: number;
  
  if (gender === 'male') {
    // Male formula: 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
    bf = 86.010 * Math.log10(waistNum - neckNum) - 70.041 * Math.log10(hNum) + 36.76;
  } else {
    // Female formula: 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
    const hipNum = Number(hip);
    bf = 163.205 * Math.log10(waistNum + hipNum - neckNum) - 97.684 * Math.log10(hNum) - 78.387;
  }
  
  // Round to 1 decimal place
  return Math.round(bf * 10) / 10;
};

  const handleSave = () => {
    if (manualMode) {
      const manualValue = parseFloat(manualBfInput);
      if (isNaN(manualValue) || manualValue <= 0 || manualValue > 70) {
        Alert.alert('Invalid body fat %');
        return;
      }
      saveBodyFat(manualValue);
    } else {
      const result = calculateBodyFat();
      if (result) saveBodyFat(result);
      else Alert.alert('Unable to calculate. Please check values.');
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#d32f2f" /></View>;

  const fullName = profile?.fullName || 'Firefighter';
  const firstName = fullName.split(' ')[0];
  const workouts = profile?.totalWorkouts || 0;
  const getRank = (count: number) => count >= 100 ? 'Ironclad' : count >= 50 ? 'Veteran' : 'Rookie';
  const completionFields = [profile?.fullName, profile?.dob, profile?.height, profile?.weight, profile?.profilePicture, profile?.bodyFatPct];
  const completionPercent = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Pressable style={styles.backButton} onPress={() => navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Dashboard' } })}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
        <Text style={styles.backText}>Dashboard</Text>
      </Pressable>

      <View style={styles.profileSection}>
        <Pressable onPress={updateProfilePicture} style={styles.profileImageContainer}>
          <Image source={{ uri: profile?.profilePicture || 'https://via.placeholder.com/100' }} style={styles.profileImage} />
          <Text style={styles.changePhoto}>Change Photo</Text>
        </Pressable>
        <Text style={styles.name}>Hello, {firstName} 👋</Text>
        <Text style={styles.rankText}>Rank: {getRank(workouts)}</Text>
        <Text style={styles.joinDate}>Member since {joinDate}</Text>
        <View style={styles.progressBarContainer}><View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} /></View>
        <Text style={styles.progressText}>Profile {completionPercent}% complete</Text>

        <View style={styles.detailRow}><Text style={styles.label}>DOB:</Text><Text style={styles.value}>{profile?.dob || '-'}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Height:</Text><Text style={styles.value}>{profile?.height} in</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Weight:</Text><Text style={styles.value}>{profile?.weight} lbs</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Sex:</Text><Text style={styles.value}>{profile?.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '-'}</Text></View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Body Fat %:</Text>
          <Text style={styles.value}>{bodyFatPct || '-'}</Text>
          <Pressable onPress={() => setBfModalVisible(true)} style={styles.estimateButton}><Text style={styles.estimateText}>Update</Text></Pressable>
        </View>
      </View>

      <Modal visible={bfModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Body Fat % Input Mode</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Manual Input:</Text>
              <Switch value={manualMode} onValueChange={setManualMode} />
            </View>

            {manualMode ? (
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 6, padding: 10, marginTop: 12 }}
                keyboardType="numeric"
                placeholder="Enter body fat % manually"
                value={manualBfInput}
                onChangeText={setManualBfInput}
              />
            ) : (
              <>
                {bfStep === 1 && (
                  <>
                    <Text style={styles.modalTitle}>Select Gender</Text>
                    <View style={styles.buttonRow}>
                      <Pressable style={[styles.genderButton, gender==='male' && styles.genderSelected]} onPress={() => setGender('male')}><Text style={styles.genderText}>Male</Text></Pressable>
                      <Pressable style={[styles.genderButton, gender==='female' && styles.genderSelected]} onPress={() => setGender('female')}><Text style={styles.genderText}>Female</Text></Pressable>
                    </View>
                  </>
                )}
                {bfStep === 2 && <><Text style={styles.modalTitle}>Neck Circumference (in)</Text><WheelPicker selectedIndex={neck ? measurementOptions.indexOf(neck) : 0} options={measurementOptions} onChange={i => setNeck(measurementOptions[i])} visibleRest={2} itemHeight={32} containerStyle={{ height: 160 }} itemTextStyle={{ color: '#d32f2f' }} /></>}
                {bfStep === 3 && <><Text style={styles.modalTitle}>Waist Circumference (in)</Text><WheelPicker selectedIndex={waist ? measurementOptions.indexOf(waist) : 0} options={measurementOptions} onChange={i => setWaist(measurementOptions[i])} visibleRest={2} itemHeight={32} containerStyle={{ height: 160 }} itemTextStyle={{ color: '#d32f2f' }} /></>}
                {bfStep === 4 && gender==='female' && <><Text style={styles.modalTitle}>Hip Circumference (in)</Text><WheelPicker selectedIndex={hip ? measurementOptions.indexOf(hip) : 0} options={measurementOptions} onChange={i => setHip(measurementOptions[i])} visibleRest={2} itemHeight={32} containerStyle={{ height: 160 }} itemTextStyle={{ color: '#d32f2f' }} /></>}
                {((bfStep === 4 && gender==='male') || bfStep === 5) && <><Text style={styles.modalTitle}>Your Estimated Body Fat</Text><Text style={styles.bfResult}>{calculateBodyFat()?.toFixed(1)}%</Text></>}
              </>
            )}

            <View style={styles.modalNav}>
              <Pressable onPress={() => bfStep>1 ? setBfStep(bfStep-1) : setBfModalVisible(false)} style={styles.navButton}><Text style={styles.navText}>{bfStep>1 ? 'Back' : 'Cancel'}</Text></Pressable>
              {!manualMode && ((bfStep===1 && gender) || (bfStep===2 && neck) || (bfStep===3 && waist) || (bfStep===4 && ((gender==='male') || (gender==='female' && hip)))) && (
                <Pressable onPress={() => setBfStep(bfStep+1)} style={styles.navButton}><Text style={styles.navText}>Next</Text></Pressable>
              )}
              <Pressable onPress={handleSave} style={styles.navButton}><Text style={styles.navText}>Save</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Pressable style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.editText}>Edit Profile</Text>
      </Pressable>
      {showToast && (
  <Toast message="Body fat updated successfully!" onClose={() => setShowToast(false)} />
)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { color: '#fff', fontSize: 16, marginLeft: 8 },
  profileSection: { alignItems: 'center', paddingVertical: 16 },
  profileImageContainer: { alignItems: 'center', marginBottom: 12 },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 8, borderWidth: 1.5, borderColor: '#444' },
  changePhoto: { color: '#4fc3f7', fontSize: 12, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  rankText: { fontSize: 14, color: '#ccc', marginBottom: 2 },
  joinDate: { fontSize: 12, color: '#888', marginBottom: 10 },
  progressBarContainer: { height: 6, width: '80%', backgroundColor: '#333', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: '#4fc3f7' },
  progressText: { color: '#aaa', fontSize: 12, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 24, marginBottom: 8 },
  label: { color: '#bbb', fontSize: 14 },
  value: { color: '#fff', fontSize: 14, fontWeight: '600' },
  estimateButton: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'transparent' },
  estimateText: { color: '#4fc3f7', fontSize: 12 },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a2a', borderColor: '#d32f2f', borderWidth: 1, padding: 12, margin: 24, borderRadius: 10 },
  editText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 20, width: '90%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  bfResult: { color: '#4fc3f7', fontSize: 32, fontWeight: '700', textAlign: 'center', marginVertical: 16 },
  modalNav: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  navButton: { padding: 10 },
  navText: { color: '#4fc3f7', fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  genderButton: { borderWidth: 1, borderColor: '#4fc3f7', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  genderSelected: { backgroundColor: '#4fc3f7' },
  genderText: { color: '#fff', fontSize: 16, textAlign: 'center' },
});

export default ProfileScreen;
