import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface LogFoodButtonProps {
  onPress: () => void;
}

const LogFoodButton: React.FC<LogFoodButtonProps> = ({ onPress }) => {
  return (
    <Pressable style={styles.logButton} onPress={onPress}>
      <Ionicons name="add" size={24} color="#fff" />
      <Text style={styles.logButtonText}>Log Food</Text>
    </Pressable>
  );
};

export default LogFoodButton;

const styles = StyleSheet.create({
  logButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#F44336',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
