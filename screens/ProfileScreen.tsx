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
        <Pressable onPress={updateProfilePicture}>
          <Image
            source={{ uri: profile?.profilePicture || 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
          />
          <Text style={styles.changePhoto}>Change Photo</Text>
        </Pressable>
        <Text style={styles.name}>{profile?.name || 'No name set'}</Text>
        <Text style={styles.info}>DOB: {profile?.dob}</Text>
        <Text style={styles.info}>Height: {profile?.height} in</Text>
        <Text style={styles.info}>Weight: {profile?.weight} lbs</Text>
        <Text style={styles.info}>Goal Weight: {profile?.goalWeight} lbs</Text>
        <Text style={styles.info}>Diet: {profile?.dietaryPreference}</Text>
        <Text style={styles.info}>Restrictions: {profile?.dietaryRestrictions?.join(', ') || 'None'}</Text>
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
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  changePhoto: { color: '#4fc3f7', fontSize: 12, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  info: { fontSize: 14, color: '#bbb', marginBottom: 2 },
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
