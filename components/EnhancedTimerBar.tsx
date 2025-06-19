import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';

export type TimerState = 'idle' | 'running' | 'paused' | 'stopped';

interface Props {
  seconds: number;
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

const EnhancedTimerBar: React.FC<Props> = ({
  seconds,
  state,
  onStart,
  onPause,
  onStop,
}) => {
  const barColor =
    state === 'running'
      ? '#2e7d32'
      : state === 'paused'
      ? '#f9a825'
      : state === 'stopped'
      ? '#c62828'
      : '#424242';

  const statusText = {
    idle: '',
    running: 'In Progress',
    paused: 'Paused',
    stopped: `Finished in ${fmt(seconds)}`,
  }[state];

  return (
    <View style={[styles.bar, { backgroundColor: barColor }]}>
      {state === 'paused' && Platform.OS !== 'android' && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={8}
          reducedTransparencyFallbackColor="rgba(255,255,255,0.3)"
        />
      )}

      <View
        style={[
          styles.inner,
          state === 'stopped' && styles.centered,
        ]}
      >
        {state !== 'stopped' && (
          <>
            <Text style={styles.time}>{fmt(seconds)}</Text>

            {state === 'idle' && (
              <Pressable onPress={onStart}>
                <Ionicons name="play" size={32} color="#fff" />
              </Pressable>
            )}
            {state === 'running' && (
              <>
                <Pressable onPress={onPause}>
                  <Ionicons name="pause" size={32} color="#fff" />
                </Pressable>
                <Pressable onPress={onStop} style={styles.iconGap}>
                  <Ionicons name="stop" size={32} color="#fff" />
                </Pressable>
              </>
            )}
            {state === 'paused' && (
              <>
                <Pressable onPress={onStart}>
                  <Ionicons name="play" size={32} color="#fff" />
                </Pressable>
                <Pressable onPress={onStop} style={styles.iconGap}>
                  <Ionicons name="stop" size={32} color="#fff" />
                </Pressable>
              </>
            )}
          </>
        )}

        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexWrap: 'wrap',
  },
  centered: {
    justifyContent: 'center',
  },
  time: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    fontFamily: 'monospace',
    marginHorizontal: 16,
  },
  statusText: {
    width: '100%',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  iconGap: {
    marginLeft: 12,
  },
});

export default EnhancedTimerBar;
