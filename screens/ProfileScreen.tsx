import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Profile'>>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinDate, setJoinDate] = useState<string>('');

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);

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

  const updateProfilePicture = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { profilePicture: photoUri });
      setProfile((prev: any) => ({ ...prev, profilePicture: photoUri }));
    }
  };

  const getRank = (count: number = 0) => {
    if (count >= 100) return 'Ironclad';
    if (count >= 50) return 'Veteran';
    return 'Rookie';
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  const fullName = profile?.fullName || 'Firefighter';
  const firstName = fullName.split(' ')[0];
  const workouts = profile?.totalWorkouts || 0;
  const rank = getRank(workouts);
  const completionScore = [profile?.fullName, profile?.dob, profile?.height, profile?.weight, profile?.profilePicture].filter(Boolean).length;
  const completionPercent = Math.round((completionScore / 5) * 100);

  return (
    <ScrollView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.navigate('Main', {
        screen: 'MainTabs',
        params: { screen: 'Dashboard' }
      })}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
        <Text style={styles.backText}>Dashboard</Text>
      </Pressable>

      <View style={styles.profileSection}>
        <Pressable onPress={updateProfilePicture} style={styles.profileImageContainer}>
          <Image
            source={{ uri: profile?.profilePicture || 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
          />
          <Text style={styles.changePhoto}>Change Photo</Text>
        </Pressable>

        <Text style={styles.name}>Hello, {firstName} 👋</Text>
        <Text style={styles.rankText}>Rank: {rank}</Text>
        <Text style={styles.joinDate}>Member since {joinDate}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
        </View>
        <Text style={styles.progressText}>Profile {completionPercent}% complete</Text>

        <View style={styles.detailRow}><Text style={styles.label}>DOB:</Text><Text style={styles.value}>{profile?.dob || '-'}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Height:</Text><Text style={styles.value}>{profile?.height} in</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Weight:</Text><Text style={styles.value}>{profile?.weight} lbs</Text></View>
      </View>

      <Pressable style={styles.editButton} onPress={() => Alert.alert('Edit functionality coming soon.')}>
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.editText}>Edit Profile</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backText: { color: '#fff', fontSize: 16, marginLeft: 8 },
  profileSection: { alignItems: 'center', paddingHorizontal: 24 },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#444',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  changePhoto: { color: '#4fc3f7', fontSize: 12, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  rankText: { fontSize: 14, color: '#ccc', marginBottom: 2 },
  joinDate: { fontSize: 12, color: '#888', marginBottom: 10 },
  progressBarContainer: {
    height: 6,
    width: '80%',
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4fc3f7',
  },
  progressText: { color: '#aaa', fontSize: 12, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 24, marginBottom: 6 },
  label: { color: '#bbb', fontSize: 14 },
  value: { color: '#fff', fontSize: 14, fontWeight: '600' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderColor: '#d32f2f',
    borderWidth: 1,
    padding: 12,
    margin: 24,
    borderRadius: 10,
  },
  editText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
});

export default ProfileScreen;
