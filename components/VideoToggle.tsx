// components/VideoToggle.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

interface VideoToggleProps {
  uri: string;
}

const VideoToggle: React.FC<VideoToggleProps> = ({ uri }) => {
  const [expanded, setExpanded] = useState(false);

  if (!uri) {return null;}

  return (
    <View style={styles.container}>
      {!expanded ? (
        <Pressable
          onPress={() => setExpanded(true)}
          style={styles.toggleBtn}>
          <Ionicons name="play-circle-outline" size={28} color="#fff" />
          <Text style={styles.toggleText}>View Exercise</Text>
        </Pressable>
      ) : (
        <View style={styles.videoBox}>
          <Video
            source={{ uri }}
            style={styles.video}
            controls
            resizeMode="contain"
            paused={false}
            onEnd={() => setExpanded(false)}
          />
          <Pressable style={styles.closeBtn} onPress={() => setExpanded(false)}>
            <Ionicons name="close-circle" size={26} color="#fff" />
            <Text style={styles.toggleText}>Hide Video</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
  },
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
});

export default VideoToggle;
