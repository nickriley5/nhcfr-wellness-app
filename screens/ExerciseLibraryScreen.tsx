import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Platform,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { firebaseApp, auth } from '../firebase';
import { exercises as localExercises } from '../data/exercises';

const db = getFirestore(firebaseApp);

const categoryIcons: Record<string, string> = {
  'Upper Body': 'barbell-outline',
  'Lower Body': 'walk-outline',
  Core: 'body-outline',
  Conditioning: 'flash-outline',
  'Full Body': 'fitness-outline',
  'Mobility & Flexibility': 'accessibility-outline',
  'Recovery / Rest': 'bed-outline',
};

const ExerciseLibraryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'ExerciseLibrary'>>();
  const [exercises, setExercises] = useState<any[]>([]);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const uid = auth.currentUser?.uid;

        // Load exercises from Firebase every time
        const snapshot = await getDocs(collection(db, 'exercises'));
        const exercisesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // If Firebase has data, use it; otherwise fall back to local data
        const finalExercises = exercisesList.length > 0 ? exercisesList : localExercises;
        console.log('📚 Exercise library loaded:', finalExercises.length, 'exercises');
        setAllExercises(finalExercises);
        setExercises(finalExercises);

        // Load favorites
        if (uid) {
          const favSnapshot = await getDoc(doc(db, 'users', uid, 'favorites', 'list'));
          if (favSnapshot.exists()) {
            const favs = new Set<string>(favSnapshot.data().ids || []);
            setFavorites(favs);
          }
        }
      } catch (error) {
        console.error('Failed to load exercise library:', error);
        // Fallback to local data on error
        setAllExercises(localExercises);
        setExercises(localExercises);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Function to categorize exercises based on focusArea
  const categorizeExercise = useCallback((focusArea: string): string => {
    if (!focusArea) {
      return 'Other';
    }

    const area = focusArea.toLowerCase();
    if (area.includes('chest') || area.includes('triceps')) {
      return 'Upper Body';
    }
    if (area.includes('shoulders')) {
      return 'Upper Body';
    }
    if (area.includes('back') || area.includes('lats') || area.includes('biceps')) {
      return 'Upper Body';
    }
    if (area.includes('quads') || area.includes('glutes') || area.includes('hamstrings')) {
      return 'Lower Body';
    }
    if (area.includes('calves') || area.includes('legs')) {
      return 'Lower Body';
    }
    if (area.includes('core') || area.includes('abs')) {
      return 'Core';
    }
    if (area.includes('full body') || area.includes('total body')) {
      return 'Full Body';
    }
    if (area.includes('cardio') || area.includes('conditioning')) {
      return 'Conditioning';
    }
    return 'Other';
  }, []);

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter exercises by category
  const filterByCategory = (category: string) => {
    setSelectedCategory(category);
  };

  // Effect to re-filter when category or search changes
  useEffect(() => {
    if (allExercises.length > 0) {
      let filtered = allExercises;

      // Filter by category
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(exercise =>
          categorizeExercise(exercise.focusArea) === selectedCategory
        );
      }

      // Filter by search query
      if (searchQuery.trim()) {
        filtered = filtered.filter(exercise =>
          exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exercise.focusArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exercise.coachingNotes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categorizeExercise(exercise.focusArea).toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort alphabetically by name
      filtered.sort((a, b) => a.name.localeCompare(b.name));

      setExercises(filtered);
    }
  }, [selectedCategory, searchQuery, allExercises, categorizeExercise]);

  // Get available categories
  const getAvailableCategories = (): string[] => {
    const categories = new Set<string>();
    allExercises.forEach(exercise => {
      categories.add(categorizeExercise(exercise.focusArea));
    });
    return ['All', ...Array.from(categories).sort()];
  };

  const toggleFavorite = async (exerciseId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    const newFavorites = new Set(favorites);
    if (favorites.has(exerciseId)) {
      newFavorites.delete(exerciseId);
    } else {
      newFavorites.add(exerciseId);
    }
    setFavorites(newFavorites);

    await setDoc(doc(db, 'users', uid, 'favorites', 'list'), {
      ids: Array.from(newFavorites),
    });
  };

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <ActivityIndicator size="large" color="#d32f2f" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Exercise Library</Text>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </Pressable>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {getAvailableCategories().map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => filterByCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Exercise count */}
        <Text style={styles.exerciseCount}>
          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} found
          {searchQuery.length > 0 && ` for "${searchQuery}"`}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </Text>

        {exercises.map((ex) => (
          <Pressable
            key={ex.id}
            style={styles.card}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
          >
            <View style={styles.row}>
              <Ionicons
                name={categoryIcons[ex.category] ?? 'fitness-outline'}
                size={36}
                color="#d32f2f"
                style={styles.icon}
              />
              <Image source={{ uri: ex.thumbnailUri }} style={styles.thumbnail} />
              <View style={styles.flex1}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.categoryLabel}>
                  {categorizeExercise(ex.focusArea)} • {ex.focusArea}
                </Text>
                <Text style={styles.description}>{ex.coachingNotes}</Text>
              </View>
              <Pressable onPress={() => toggleFavorite(ex.id)}>
                <Ionicons
                  name={favorites.has(ex.id) ? 'star' : 'star-outline'}
                  size={20}
                  color="#fbc02d"
                />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
  },
  content: { padding: 24 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 4,
  },
  categoryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#d32f2f',
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  exerciseCount: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    marginRight: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#d32f2f',
    marginBottom: 2,
    fontWeight: '500',
  },
  description: {
    color: '#ccc',
    fontSize: 14,
  },
  flex1: {
    flex: 1,
  },
});

export default ExerciseLibraryScreen;
