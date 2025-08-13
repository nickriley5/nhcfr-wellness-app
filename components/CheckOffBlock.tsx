// components/CheckOffBlock.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VideoToggle from './VideoToggle';

/* ───────── types ───────── */
interface CheckOffBlockProps {
  id: string;
  name: string;
  sets: number;
  repsOrDuration: string;
  videoUri: string;
  isTimed?: boolean;
  seconds?: number;         // default duration for timed blocks
}

/* ───────── helpers ─────── */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

/* ───────── component ───── */
const CheckOffBlock: React.FC<CheckOffBlockProps> = ({
  name,
  sets,
  repsOrDuration,
  videoUri,
  isTimed = false,
  seconds  = 60,
}) => {
  /* state ---------------------------------------------------- */
  const [done,      setDone]      = useState(false);
  const [running,   setRunning]   = useState(false);
  const [timeLeft,  setTimeLeft]  = useState(seconds);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* interval side-effect ------------------------------------ */
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setRunning(false);
            setDone(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1_000);
    }
    return () => {
      if (intervalRef.current) {clearInterval(intervalRef.current);}
    };
  }, [running]);

  /* handlers ------------------------------------------------- */
  const toggleDone = () => {
    if (intervalRef.current) {clearInterval(intervalRef.current);}
    intervalRef.current = null;
    setRunning(false);
    setDone(prev => !prev);
    if (!done && isTimed) {setTimeLeft(seconds);}           // reset if manually un-checking
  };

  const onPlayPause = () => {
    if (timeLeft === 0) {             // finished → restart
      setTimeLeft(seconds);
      setDone(false);
    }
    setRunning(prev => !prev);
  };

  const onReset = () => {
    if (intervalRef.current) {clearInterval(intervalRef.current);}
    intervalRef.current = null;
    setRunning(false);
    setTimeLeft(seconds);
    setDone(false);
  };

  /* render --------------------------------------------------- */
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      {/* top row */}
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.name, done && styles.lineThrough]}>{name}</Text>
          <Text style={[styles.sub,  done && styles.lineThrough]}>
            {isTimed ? fmt(timeLeft) : `${sets} × ${repsOrDuration}`}
          </Text>
        </View>

        {/* main icon */}
        <Pressable onPress={isTimed ? onPlayPause : toggleDone}>
          <Ionicons
            name={
              done ? 'checkmark-circle' :
              isTimed
                ? (running ? 'pause-circle' : 'play-circle-outline')
                : 'ellipse-outline'
            }
            size={30}
            color={done ? '#66bb6a' : '#fff'}
          />
        </Pressable>
      </View>

      {/* video toggle (shared UI) */}
      {!!videoUri && <VideoToggle uri={videoUri} />}

      {/* extra controls only for timed blocks */}
      {isTimed && !done && (
        <View style={styles.timerRow}>
          <Pressable onPress={onPlayPause} style={styles.timerBtn}>
            <Ionicons name={running ? 'pause' : 'play'} size={16} color="#fff" />
          </Pressable>
          <Pressable onPress={onReset} style={[styles.timerBtn, styles.timerBtnMargin]}>
            <Ionicons name="refresh" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
};

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
  },
  cardDone: { backgroundColor: '#2e7d32' },

  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info:  { maxWidth: '80%' },

  name:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  sub:   { color: '#aaa', fontSize: 14, marginTop: 2 },
  lineThrough: { textDecorationLine: 'line-through' },

  timerRow: { flexDirection: 'row', marginTop: 8 },
  timerBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timerBtnMargin: {
    marginLeft: 8,
  },
});

export default CheckOffBlock;
