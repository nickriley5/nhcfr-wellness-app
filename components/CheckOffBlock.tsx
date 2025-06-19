// components/CheckOffBlock.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

interface CheckOffBlockProps {
  id: string;
  name: string;
  sets: number;
  repsOrDuration: string;
  videoUri?: string;
  /** timed = stopwatch/count-down (secs) instead of plain text  */
  isTimed?: boolean;
  /** target seconds if timed */
  seconds?: number;
}

type TimerState = 'idle' | 'running' | 'paused' | 'done';
type IntervalId = ReturnType<typeof setInterval>;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;

const CheckOffBlock: React.FC<CheckOffBlockProps> = ({
  name,
  sets,
  repsOrDuration,
  videoUri,
  isTimed = false,
  seconds: targetSeconds = 0,
}) => {
  /* ------------------------------------------------------- state */
  const [done, setDone] = useState(false);

  // video toggle
  const [playingVideo, setPlayingVideo] = useState(false);

  // per-exercise timer
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsed, setElapsed] = useState(0); // seconds (count-up) OR remaining
  const intervalRef = useRef<IntervalId | null>(null);

  /* ---------------------------------------------------- timer side-effects */
  useEffect(() => {
    if (!isTimed) return;

    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) =>
          targetSeconds
            ? Math.max(prev - 1, 0) // count-down
            : prev + 1, // stopwatch
        );
      }, 1000) as IntervalId;
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // auto-finish
    if (isTimed && targetSeconds && elapsed === 0 && timerState === 'running') {
      setTimerState('done');
      setDone(true);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, isTimed, elapsed, targetSeconds]);

  /* ---------------------------------------------------- progress bar */
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isTimed || !targetSeconds) return;
    if (timerState === 'running') {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: targetSeconds * 1000,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.stopAnimation();
    }
  }, [timerState, targetSeconds]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'], // shrink left->right
  });

  /* ---------------------------------------------------- handlers  */
  const toggleDone = () => {
    // if a timer is running, stop & mark complete
    if (isTimed && timerState === 'running') {
      setTimerState('done');
    }
    setDone((d) => !d);
  };

  const startTimer = () => {
    if (timerState === 'idle' || timerState === 'paused') {
      setElapsed(targetSeconds || 0);
      setTimerState('running');
    }
  };
  const pauseTimer = () => setTimerState('paused');
  const stopTimer  = () => {
    setTimerState('done');
    setDone(true);
  };

  /* ---------------------------------------------------- render  */
  return (
    <Pressable
      onPress={toggleDone}
      style={[
        styles.container,
        done && styles.done,
      ]}>
      <View style={{ flex: 1 }}>
        {/* title + detail */}
        <View style={styles.rowHeader}>
          <Text style={[styles.name, done && styles.doneText]}>{name}</Text>

          {/* optional video button */}
          {!!videoUri && (
            <TouchableOpacity onPress={() => setPlayingVideo((p) => !p)}>
              <Ionicons
                name={playingVideo ? 'close-circle' : 'play-circle'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          )}

          {/* check-off icon */}
          <Ionicons
            name={done ? 'checkmark-circle' : 'ellipse-outline'}
            size={28}
            color={done ? '#66bb6a' : '#bbb'}
            style={{ marginLeft: 8 }}
          />
        </View>

        <Text style={[styles.detail, done && styles.doneText]}>
          {sets} × {repsOrDuration}
        </Text>

        {/* video preview (16:9) */}
        {playingVideo && videoUri && (
          <View style={styles.videoBox}>
            <Video
              source={{ uri: videoUri }}
              style={styles.video}
              controls
              resizeMode="contain"
            />
          </View>
        )}

        {/* timer controls */}
        {isTimed && (
          <View style={styles.timerRow}>
            <View style={styles.timerDigitsBox}>
              <Text style={styles.timerDigits}>{fmt(targetSeconds ? elapsed : elapsed)}</Text>
            </View>

            {timerState !== 'running' && timerState !== 'done' && (
              <Pressable onPress={startTimer}>
                <Ionicons name="play" size={26} color="#fff" />
              </Pressable>
            )}
            {timerState === 'running' && (
              <>
                <Pressable onPress={pauseTimer}>
                  <Ionicons name="pause" size={26} color="#fff" />
                </Pressable>
                <Pressable onPress={stopTimer} style={{ marginLeft: 8 }}>
                  <Ionicons name="stop" size={26} color="#fff" />
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* progress bar (only when timed + running) */}
        {isTimed && targetSeconds > 0 && timerState === 'running' && (
          <Animated.View style={[styles.progress, { width: progressWidth }]} />
        )}
      </View>
    </Pressable>
  );
};

/* ---------------------------------------------------- styles */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
    padding: 14,
    marginVertical: 6,
    borderRadius: 12,
  },
  done: { backgroundColor: '#2e7d32' },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600', flexShrink: 1 },
  detail: { color: '#aaa', fontSize: 14, marginTop: 2 },
  doneText: { color: '#fff', textDecorationLine: 'line-through' },

  /* video */
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: { width: '100%', height: '100%' },

  /* timer */
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timerDigitsBox: {
    backgroundColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  timerDigits: {
    color: '#fff',
    fontVariant: ['tabular-nums'],
    fontFamily: 'monospace',
  },

  /* progress */
  progress: {
    height: 3,
    backgroundColor: '#66bb6a',
    borderRadius: 3,
    marginTop: 6,
  },
});

export default CheckOffBlock;
