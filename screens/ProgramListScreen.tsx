// screens/ProgramListScreen.tsx

import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { PROGRAM_TEMPLATES } from '../utils/ProgramTemplates';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProgramListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSelect = (programId: string) => {
    navigation.navigate('ProgramPreview', { programId });
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#FFF" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.header}>Choose Your Training Program</Text>

      <FlatList
        data={PROGRAM_TEMPLATES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => handleSelect(item.id)}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.meta}>
              {item.durationWeeks} Weeks · {item.daysPerWeek || '3–6'} Days/Week
            </Text>
          </Pressable>
        )}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

export default ProgramListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    backgroundColor: '#0E0E0E',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#FF3C3C',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
    textAlign: 'center',
  },
  meta: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  flatListContent: {
    paddingBottom: 40,
  },
});
