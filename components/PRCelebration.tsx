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
  messages: string[];
  onClose: () => void;
}

const PRCelebration: React.FC<PRCelebrationProps> = ({ visible, messages, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.bubble}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.header}>New PRs Unlocked!</Text>
          {messages.map((msg, idx) => (
            <Text key={idx} style={styles.message}>{msg}</Text>
          ))}
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
    maxWidth: '85%',
    alignItems: 'center',
    elevation: 10,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  header: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default PRCelebration;
