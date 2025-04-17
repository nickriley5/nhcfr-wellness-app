// screens/ExerciseLibraryScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string[];
  description: string;
  thumbnailUri: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 'push_up',
    name: 'Push‑Up',
    category: 'Upper Body',
    equipment: ['Bodyweight'],
    description: 'Standard push‑up focusing on chest and triceps.',
    thumbnailUri: 'https://via.placeholder.com/64',
  },
  {
    id: 'goblet_squat',
    name: 'Goblet Squat',
    category: 'Lower Body',
    equipment: ['Dumbbell'],
    description: 'Hold a dumbbell at chest level and squat.',
    thumbnailUri: 'https://via.placeholder.com/64',
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'Core',
    equipment: ['None'],
    description: 'Maintain a straight body line on elbows or hands.',
    thumbnailUri: 'https://via.placeholder.com/64',
  },
];

const groupByCategory = (data: Exercise[]) => {
  const groups: Record<string, Exercise[]> = {};
  data.forEach((e) => {
    (groups[e.category] ||= []).push(e);
  });
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
};

const ExerciseLibraryScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return EXERCISES.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term)
    );
  }, [search]);

  const sections = useMemo(() => groupByCategory(filtered), [filtered]);

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Library</Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Search exercises..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Top Back Button */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('ExerciseDetail', { exerciseId: item.id })
            }
          >
            <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom Back Button */}
      <Pressable
        style={[styles.backButton, { marginTop: 12, marginBottom: 24 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#d32f2f', marginBottom: 8 },
  searchBar: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  thumbnail: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#fff' },
  desc: { fontSize: 14, color: '#ccc', marginTop: 4 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 6,
  },
});

export default ExerciseLibraryScreen;
