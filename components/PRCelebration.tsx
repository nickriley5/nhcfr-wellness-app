import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

interface PRCelebrationProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

const PRCelebration: React.FC<PRCelebrationProps> = ({ visible, message, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.bubble}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <ConfettiCannon count={80} origin={{ x: 200, y: -10 }} fadeOut />
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: '#d32f2f',
    padding: 24,
    borderRadius: 16,
    maxWidth: '80%',
    alignItems: 'center',
    elevation: 10,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  message: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default PRCelebration;
