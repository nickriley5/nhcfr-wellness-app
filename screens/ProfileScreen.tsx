import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data());
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

        <Text style={styles.name}>{profile?.name || 'Good afternoon, Firefighter!'}</Text>

        <View style={styles.detailRow}><Text style={styles.label}>DOB:</Text><Text style={styles.value}>{profile?.dob || '-'}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Height:</Text><Text style={styles.value}>{profile?.height} in</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Weight:</Text><Text style={styles.value}>{profile?.weight} lbs</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Goal Weight:</Text><Text style={styles.value}>{profile?.goalWeight} lbs</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Diet:</Text><Text style={styles.value}>{profile?.dietaryPreference || 'None'}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Restrictions:</Text><Text style={styles.value}>{profile?.dietaryRestrictions?.join(', ') || 'None'}</Text></View>
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
  
  changePhoto: { color: '#4fc3f7', fontSize: 12, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
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
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  
  editText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
});

export default ProfileScreen;
