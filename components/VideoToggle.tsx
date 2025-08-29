// components/VideoToggle.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';

interface VideoToggleProps {
  uri: string;
}

const VideoToggle: React.FC<VideoToggleProps> = ({ uri }) => {
  const [expanded, setExpanded] = useState(false);

  if (!uri) {return null;}

  // Check if it's a YouTube URL
  const isYouTubeUrl = uri.includes('youtube.com') || uri.includes('youtu.be');

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';

    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    return `https://www.youtube.com/embed/${videoId}?playsinline=1&controls=1`;
  };

  const renderVideo = () => {
    if (isYouTubeUrl) {
      return (
        <WebView
          style={styles.video}
          source={{ uri: getYouTubeEmbedUrl(uri) }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      );
    } else {
      return (
        <Video
          source={{ uri }}
          style={styles.video}
          controls
          resizeMode="contain"
          paused={false}
          onEnd={() => setExpanded(false)}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {!expanded ? (
        <Pressable
          onPress={() => setExpanded(true)}
          style={styles.toggleBtn}>
          <Ionicons name="play-circle-outline" size={28} color="#fff" />
          <Text style={styles.toggleText}>
            {isYouTubeUrl ? 'View Exercise (YouTube)' : 'View Exercise'}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.videoBox}>
          {renderVideo()}
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
