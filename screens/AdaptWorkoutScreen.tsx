// screens/AdaptWorkoutScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../App';
import { useProgram } from '../src/hooks/useProgram';
import Toast from '../components/Toast';

const fallbackVideos: Record<string, string> = {
  Pushups:      'https://www.w3schools.com/html/mov_bbb.mp4',
  'Bent-over Rows': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Overhead Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Air Squat':  'https://www.w3schools.com/html/mov_bbb.mp4',
};

const similarExercises: Record<string, { name: string; videoUri: string; thumbnailUri: string }[]> = {
  Pushups: [
    { name: 'Incline Pushup', videoUri: fallbackVideos.Pushups, thumbnailUri: 'https://via.placeholder.com/100' },
    { name: 'Kneeling Pushup', videoUri: fallbackVideos.Pushups, thumbnailUri: 'https://via.placeholder.com/100' },
    { name: 'Wide Pushup',    videoUri: fallbackVideos.Pushups, thumbnailUri: 'https://via.placeholder.com/100' },
  ],
  'Bent-over Rows': [
    { name: 'Band Rows',      videoUri: fallbackVideos['Bent-over Rows'], thumbnailUri: 'https://via.placeholder.com/100' },
    { name: 'Single Arm Rows',videoUri: fallbackVideos['Bent-over Rows'], thumbnailUri: 'https://via.placeholder.com/100' },
  ],
  'Overhead Press': [
    { name: 'Pike Press',     videoUri: fallbackVideos['Overhead Press'], thumbnailUri: 'https://via.placeholder.com/100' },
    { name: 'Band Press',     videoUri: fallbackVideos['Overhead Press'], thumbnailUri: 'https://via.placeholder.com/100' },
  ],
  'Air Squat': [
    { name: 'Wall Sit',       videoUri: fallbackVideos['Air Squat'], thumbnailUri: 'https://via.placeholder.com/100' },
    { name: 'Split Squat',    videoUri: fallbackVideos['Air Squat'], thumbnailUri: 'https://via.placeholder.com/100' },
    { name: 'Step-Up',        videoUri: fallbackVideos['Air Squat'], thumbnailUri: 'https://via.placeholder.com/100' },
  ],
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AdaptWorkout'>;

const AdaptWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { program, loading, error, saveAdaptedWorkout } = useProgram();

  const [adaptedExercises, setAdaptedExercises] = useState<any[]>([]);
  const [playingIndex, setPlayingIndex]       = useState<number | null>(null);
  const [modalVisible, setModalVisible]       = useState(false);
  const [currentIndex, setCurrentIndex]       = useState<number | null>(null);
  const [showAllReplacements, setShowAllReplacements] = useState(false);
  const [showToast, setShowToast]             = useState(false);

  // populate adaptedExercises when program arrives
  useEffect(() => {
    if (program) {
      const dayIdx = program.currentDay - 1;
      const today = program.days[dayIdx].exercises.map((ex: any) => ({
        ...ex,
        videoUri: fallbackVideos[ex.name] || fallbackVideos.Pushups,
      }));
      setAdaptedExercises(today);
    }
  }, [program]);

  // loading state
  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f','#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  // error or no program
  if (error || !program) {
    return (
      <LinearGradient colors={['#0f0f0f','#1c1c1c']} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Unable to load your workout.</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  // preview toggle
  const togglePlay = (idx: number) => setPlayingIndex(prev => prev === idx ? null : idx);

  // open swap modal
  const handleAdapt = (idx: number) => {
    setCurrentIndex(idx);
    setModalVisible(true);
  };

  // select a replacement exercise
  const selectReplacement = (rep: { name: string; videoUri: string }) => {
    if (currentIndex === null) return;
    const updated = [...adaptedExercises];
    updated[currentIndex] = { ...updated[currentIndex], name: rep.name, videoUri: rep.videoUri };
    setAdaptedExercises(updated);
    setModalVisible(false);
    setCurrentIndex(null);
    setShowAllReplacements(false);
  };

  // save adapted workout
  const handleSave = async () => {
    try {
      const dayIdx = program.currentDay - 1;
      await saveAdaptedWorkout(dayIdx, adaptedExercises);
      setShowToast(true);
      setTimeout(() => navigation.navigate('WorkoutDetail',{ adapt:true }), 1500);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <LinearGradient colors={['#0f0f0f','#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff"/>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Adapt Today’s Workout</Text>

        {adaptedExercises.map((ex, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>{ex.name}</Text>
            <Pressable onPress={() => togglePlay(i)} style={styles.videoBox}>
              {playingIndex === i
                ? <Video source={{ uri: ex.videoUri }} style={styles.video} controls paused={false} onEnd={()=>setPlayingIndex(null)}/>
                : <View style={styles.playOverlay}>
                    <Ionicons name="play-circle-outline" size={42} color="#fff"/>
                    <Text style={styles.playText}>Preview</Text>
                  </View>
              }
            </Pressable>
            <Pressable style={styles.button} onPress={()=>handleAdapt(i)}>
              <Text style={styles.buttonText}>Swap Exercise</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" style={styles.icon}/>
          <Text style={styles.buttonText}>Save Adapted Workout</Text>
        </Pressable>
        <Pressable style={[styles.saveButton, styles.secondaryButton]} onPress={()=>navigation.navigate('Main',{screen:'MainTabs',params:{screen:'Workout'}})}>
          <Ionicons name="arrow-back" size={20} color="#fff" style={styles.icon}/>
          <Text style={styles.buttonText}>Back to Workout Hub</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentIndex !== null && (
              <>
                <Text style={styles.modalTitle}>
                  Replacing: <Text style={{color:'#4fc3f7'}}>{adaptedExercises[currentIndex].name}</Text>
                </Text>
                <Text style={styles.modalSubTitle}>Choose a replacement:</Text>
                <FlatList
                  data={ showAllReplacements
                    ? similarExercises[adaptedExercises[currentIndex].name] || []
                    : (similarExercises[adaptedExercises[currentIndex].name]||[]).slice(0,3)
                  }
                  keyExtractor={item=>item.name}
                  renderItem={({item})=>(
                    <Pressable style={styles.replacementItem} onPress={()=>selectReplacement(item)}>
                      <Image source={{uri:item.thumbnailUri}} style={styles.thumbnail}/>
                      <View style={styles.replacementInfo}>
                        <Text style={styles.replacementText}>{item.name}</Text>
                        <Text style={styles.replacementTag}>🏷 No Equipment</Text>
                      </View>
                    </Pressable>
                  )}
                />
                {(similarExercises[adaptedExercises[currentIndex].name]||[]).length>3 && (
                  <Pressable style={styles.moreToggle} onPress={()=>setShowAllReplacements(p=>!p)}>
                    <Text style={styles.moreToggleText}>
                      {showAllReplacements?'➖ Show Less':'➕ More Options'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
            <Pressable style={styles.cancelButton} onPress={()=>setModalVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {showToast && <Toast message="Adapted workout saved!" onClose={()=>setShowToast(false)}/>}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex:1,
   },
  content: { 
    padding:24, 
    alignItems:'center', 
  },
  topBar: { 
    alignSelf:'flex-start', 
    marginVertical:8, 
  },
  backButton: { 
    flexDirection:'row', 
    alignItems:'center', 
  },
  backText: { 
    color:'#fff', 
    marginLeft:8, 
    fontSize:16, 
  },
  title: { 
    color:'#d32f2f', 
    fontSize:24, 
    fontWeight:'700', 
    marginBottom:20, 
    textAlign:'center',
   },
  card: { 
    backgroundColor:'#2a2a2a', 
    borderRadius:12, 
    padding:16, 
    width:'100%', 
    marginBottom:16, 
  },
  cardTitle: { 
    color:'#fff', 
    fontSize:18, 
    fontWeight:'600', 
    marginBottom:8, 
  },
  videoBox: { 
    width:'100%', 
    aspectRatio:16/9, 
    backgroundColor:'#000', 
    borderRadius:8, 
    overflow:'hidden', 
    justifyContent:'center', 
    alignItems:'center', 
    marginBottom:12, 
  },
  video:  { 
    width:'100%', 
    height:'100%', 
  },
  playOverlay:  { 
    justifyContent:'center', 
    alignItems:'center', 
  },
  playText:  { 
    color:'#fff', 
    marginTop:4, 
    fontSize:14,
  },
  button: { 
    backgroundColor:'#2a2a2a', 
    borderWidth:1, 
    borderColor:'#d32f2f', 
    borderRadius:10, 
    paddingVertical:12, 
    width:'100%', 
    alignItems:'center', 
    marginBottom:8, 
  },
  buttonText: { 
    color:'#fff', 
    fontSize:14, 
    fontWeight:'700', 
    textTransform:'uppercase', 
  },
  saveButton: { 
    flexDirection:'row', 
    alignItems:'center', 
    backgroundColor:'#2a2a2a', 
    borderWidth:1, 
    borderColor:'#d32f2f', 
    borderRadius:12, 
    paddingVertical:16, 
    paddingHorizontal:24, 
    width:'100%', 
    marginTop:12, 
  },
  secondaryButton:{ 
    borderColor:'#888', 
    marginTop:8, 
  },
  icon: { 
    marginRight:8, 
  },
  modalOverlay: { 
    flex:1, 
    backgroundColor:'rgba(0,0,0,0.8)', 
    justifyContent:'center', 
    alignItems:'center', 
  },
  modalContent: { 
    backgroundColor:'#1e1e1e', 
    borderRadius:12, 
    padding:20, 
    width:'80%', 
  },
  modalTitle: { 
    color:'#fff', 
    fontSize:18, 
    fontWeight:'600', 
    textAlign:'center', 
    marginBottom:12, 
  },
  modalSubTitle: { 
    color:'#bbb', 
    fontSize:14, 
    textAlign:'center', 
    marginBottom:10, 
  },
  replacementItem:{ 
    flexDirection:'row', 
    alignItems:'center', 
    padding:12, 
    borderBottomWidth:1, 
    borderBottomColor:'#333', 
  },
  thumbnail: { 
    width:50, 
    height:50, 
    borderRadius:8, 
    marginRight:10, 
  },
  replacementInfo:{ 
    justifyContent:'center', 
  },
  replacementText:{ 
    color:'#fff', 
    fontSize:16, 
  },
  replacementTag: { 
    color:'#aaa', 
    fontSize:12, 
    fontStyle:'italic', 
    marginTop:2, 
  },
  moreToggle:{ 
    alignItems:'center', 
    marginVertical:8, 
  },
  moreToggleText:{ 
    color:'#4fc3f7', 
    fontSize:14, 
  },
  cancelButton: { 
    marginTop:12, 
    borderWidth:1, 
    borderColor:'#888', 
    borderRadius:10, 
    paddingVertical:12, 
    alignItems:'center', 
    backgroundColor:'#2a2a2a', 
  },
  centered: { 
    flex:1, 
    justifyContent:'center', 
    alignItems:'center', 
  },
  errorText: { 
    color:'#fff', 
    fontSize:16, 
    marginBottom:12, 
  },
  primaryButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
   alignItems: 'center',
  },
});

export default AdaptWorkoutScreen;
