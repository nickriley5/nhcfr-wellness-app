import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Toast from '../components/Toast';
import DashboardButton from '../components/Common/DashboardButton';
import BodyFatCalculatorModal from '../components/Modals/BodyFatCalculatorModal';
import PageHelpButton from '../components/Common/PageHelpButton';

type UserProfile = {
  fullName?: string;
  dob?: string;
  height?: number;
  weight?: number;
  sex?: 'male' | 'female';
  profilePicture?: string;
  bodyFatPct?: number;
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
};

const completionFieldsFilled = (profile: UserProfile | null): number => {
  if (!profile) {return 0;}
  return [
    profile.fullName,
    profile.dob,
    profile.height,
    profile.weight,
    profile.profilePicture,
    profile.bodyFatPct,
  ].filter(Boolean).length;
};

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Profile'>>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinDate, setJoinDate] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [bodyFatPct, setBodyFatPct] = useState<string>('');
  const [bfModalVisible, setBfModalVisible] = useState(false);

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data.bodyFatPct != null) {
          setBodyFatPct(data.bodyFatPct.toString());
        }
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

  useFocusEffect(useCallback(() => {
    fetchProfile();
  }, []));

  const goToDashboard = useCallback(() => {
    navigation.navigate('AppDrawer', {
      screen: 'MainTabs',
      params: { screen: 'Dashboard' },
    });
  }, [navigation]);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const cameraPermission = PermissionsAndroid.PERMISSIONS.CAMERA;
      const alreadyGranted = await PermissionsAndroid.check(cameraPermission);
      if (alreadyGranted) {
        return true;
      }

      const result = await PermissionsAndroid.request(cameraPermission, {
        title: 'Camera Access',
        message: 'Allow camera access to take your profile photo?',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'No',
        buttonPositive: 'Yes',
      });

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      Alert.alert('Camera Error', 'Unable to request camera permission.');
      return false;
    }
  };

  const saveProfilePicture = async (photoUri?: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !photoUri) {
      return;
    }

    await updateDoc(doc(db, 'users', uid), { profilePicture: photoUri });
    setProfile((prev) => (prev ? { ...prev, profilePicture: photoUri } : null));
  };

  const handleImagePickerResponse = async (
    response: ImagePickerResponse,
    errorTitle: string
  ) => {
    if (response.didCancel) {
      return;
    }
    if (response.errorMessage) {
      Alert.alert(errorTitle, response.errorMessage);
      return;
    }

    await saveProfilePicture(response.assets?.[0]?.uri);
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Camera Access Needed', 'Camera access is required to take a new profile photo.');
      return;
    }

    const options: CameraOptions = { mediaType: 'photo', quality: 0.7, maxWidth: 1024, maxHeight: 1024 };
    launchCamera(options, (response) => {
      handleImagePickerResponse(response, 'Camera Error');
    });
  };

  const openImageLibrary = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.7,
      selectionLimit: 1,
      maxWidth: 1024,
      maxHeight: 1024,
    };
    launchImageLibrary(options, (response) => {
      handleImagePickerResponse(response, 'Gallery Error');
    });
  };

  const updateProfilePicture = () => {
    Alert.alert('Change Profile Photo', 'Choose a photo source', [
      { text: 'Take Photo', onPress: openCamera },
      { text: 'Choose from Gallery', onPress: openImageLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  const firstName = profile?.fullName?.split(' ')[0] || 'Firefighter';
  const completionPercent = Math.round((completionFieldsFilled(profile) / 6) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Pressable style={styles.backButton} onPress={goToDashboard}>
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
        <Text style={styles.joinDate}>Member since {joinDate}</Text>

        {profile?.updatedAt?.toDate && (
          <Text style={styles.joinDate}>
            Last updated{' '}
            {new Date(profile.updatedAt.toDate()).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        )}

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
        </View>
        <Text style={styles.progressText}>Profile {completionPercent}% complete</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>DOB:</Text>
          <Text style={styles.value}>{profile?.dob || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Height:</Text>
          <Text style={styles.value}>{profile?.height} in</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Weight:</Text>
          <Text style={styles.value}>{profile?.weight} lbs</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Sex:</Text>
          <Text style={styles.value}>
            {profile?.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '-'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Body Fat %:</Text>
          <Text style={styles.value}>{bodyFatPct || '-'}</Text>
          <Pressable onPress={() => setBfModalVisible(true)} style={styles.estimateButton}>
            <Text style={styles.estimateText}>Update</Text>
          </Pressable>
        </View>
      </View>

      <BodyFatCalculatorModal
        visible={bfModalVisible}
        onClose={() => setBfModalVisible(false)}
        onSaved={(val: number) => {
          setBodyFatPct(val.toFixed(1));
          setShowToast(true);
        }}
      />

      <DashboardButton text="Edit Profile" onPress={() => navigation.navigate('EditProfile')} variant="redSolid" />

      {showToast && (
        <Toast message="Body fat updated successfully!" onClose={() => setShowToast(false)} />
      )}

      <PageHelpButton
        pageKey="profile"
        title="Profile Tips"
        intro="Keep this accurate so nutrition, readiness, and calorie estimates have the right baseline."
        tips={[
          {
            title: 'Update weight when it changes',
            body: 'Your current weight helps calorie estimates and meal targets stay realistic.',
          },
          {
            title: 'Photo is optional',
            body: 'Tap Change Photo to use the camera or gallery. This only changes your profile picture.',
          },
          {
            title: 'Body fat is an estimate',
            body: 'Use Update if you want a rough body fat estimate. It helps nutrition planning, but it does not need to be perfect.',
          },
        ]}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { color: '#fff', fontSize: 16, marginLeft: 8 },
  profileSection: { alignItems: 'center', paddingVertical: 16 },
  profileImageContainer: { alignItems: 'center', marginBottom: 12 },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#444',
  },
  changePhoto: { color: '#4fc3f7', fontSize: 12, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  joinDate: { fontSize: 12, color: '#888', marginBottom: 10 },
  progressBarContainer: {
    height: 6,
    width: '80%',
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: { height: '100%', backgroundColor: '#4fc3f7' },
  progressText: { color: '#aaa', fontSize: 12, marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  label: { color: '#bbb', fontSize: 14 },
  value: { color: '#fff', fontSize: 14, fontWeight: '600' },
  estimateButton: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'transparent' },
  estimateText: { color: '#4fc3f7', fontSize: 12 },
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
