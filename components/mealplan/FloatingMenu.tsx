import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FloatingMenu: React.FC = () => (
  <View style={styles.floatingContainer}>
    <Pressable style={styles.floatingButton}>
      <Ionicons name="add" size={30} color="#fff" />
    </Pressable>
    <View style={styles.radialMenu}>
      <Pressable style={styles.menuOption}>
        <Ionicons name="camera" size={24} color="#fff" />
        <Text style={styles.menuLabel}>Snap Meal</Text>
      </Pressable>
      <Pressable style={styles.menuOption}>
        <Ionicons name="mic" size={24} color="#fff" />
        <Text style={styles.menuLabel}>Describe</Text>
      </Pressable>
      <Pressable style={styles.menuOption}>
        <Ionicons name="barcode" size={24} color="#fff" />
        <Text style={styles.menuLabel}>Scan</Text>
      </Pressable>
      <Pressable style={styles.menuOption}>
        <Ionicons name="star" size={24} color="#fff" />
        <Text style={styles.menuLabel}>Favorites</Text>
      </Pressable>
    </View>
  </View>
);

export default FloatingMenu;

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  radialMenu: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  menuLabel: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
});
