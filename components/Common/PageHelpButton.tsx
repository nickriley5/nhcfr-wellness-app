import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

export type PageHelpTip = {
  title: string;
  body: string;
};

type PageHelpButtonProps = {
  pageKey: string;
  title: string;
  intro?: string;
  tips: PageHelpTip[];
  top?: number;
  right?: number;
  placement?: 'floating' | 'inline';
};

const PageHelpButton = ({
  pageKey,
  title,
  intro,
  tips,
  top = 14,
  right = 16,
  placement = 'floating',
}: PageHelpButtonProps) => {
  const [visible, setVisible] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    const loadSeenState = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem(`pageHelpSeen:${pageKey}`);
        if (mounted) {
          setShouldPulse(!hasSeen);
        }
      } catch {
        if (mounted) {
          setShouldPulse(true);
        }
      }
    };

    loadSeenState();

    return () => {
      mounted = false;
    };
  }, [pageKey]);

  useEffect(() => {
    if (!shouldPulse) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulse, shouldPulse]);

  const openHelp = async () => {
    setVisible(true);
    setShouldPulse(false);
    try {
      await AsyncStorage.setItem(`pageHelpSeen:${pageKey}`, 'true');
    } catch {
      // Non-critical. The help still opens even if local storage is unavailable.
    }
  };

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.85],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });
  const anchorStyle = placement === 'inline'
    ? styles.inlineAnchor
    : [styles.anchor, { top, right }];

  return (
    <>
      <View pointerEvents="box-none" style={anchorStyle}>
        {shouldPulse && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Help for ${title}`}
          onPress={openHelp}
          style={[styles.button, shouldPulse && styles.buttonActive]}
        >
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="information-circle-outline" size={24} color="#4fc3f7" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {intro ? <Text style={styles.intro}>{intro}</Text> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close help"
                onPress={() => setVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={styles.tipList} contentContainerStyle={styles.tipListContent}>
              {tips.map((tip) => (
                <View key={tip.title} style={styles.tipItem}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipBody}>{tip.body}</Text>
                </View>
              ))}
            </ScrollView>

            <Pressable style={styles.doneButton} onPress={() => setVisible(false)}>
              <Text style={styles.doneButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    zIndex: 50,
    elevation: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAnchor: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(20, 26, 34, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    borderColor: '#4fc3f7',
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  pulseRing: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#4fc3f7',
    backgroundColor: 'rgba(79, 195, 247, 0.18)',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  card: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#2b2b2b',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    width: '100%',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 195, 247, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    flexShrink: 1,
  },
  intro: {
    color: '#b8b8b8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    flexShrink: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipList: {
    marginTop: 2,
    width: '100%',
  },
  tipListContent: {
    paddingBottom: 8,
    width: '100%',
  },
  tipItem: {
    width: '100%',
    backgroundColor: '#202020',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#303030',
    padding: 14,
    marginBottom: 10,
  },
  tipTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
    flexShrink: 1,
  },
  tipBody: {
    color: '#cfcfcf',
    fontSize: 13,
    lineHeight: 19,
    flexShrink: 1,
  },
  doneButton: {
    marginTop: 12,
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default PageHelpButton;
