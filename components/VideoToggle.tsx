// components/VideoToggle.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';

interface VideoToggleProps {
  uri: string;
}

const VideoToggle: React.FC<VideoToggleProps> = ({ uri }) => {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSlowLoadHint, setShowSlowLoadHint] = useState(false);
  const slowHintTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!expanded) {
      setIsLoading(false);
      setShowSlowLoadHint(false);
      if (slowHintTimerRef.current) {
        clearTimeout(slowHintTimerRef.current);
      }
      return;
    }

    setIsLoading(true);
    setShowSlowLoadHint(false);
    slowHintTimerRef.current = setTimeout(() => {
      setShowSlowLoadHint(true);
    }, 1000);

    return () => {
      if (slowHintTimerRef.current) {
        clearTimeout(slowHintTimerRef.current);
      }
    };
  }, [expanded]);

  if (!uri) {return null;}

  // Check if it's a YouTube URL
  const isYouTubeUrl = uri.includes('youtube.com') || uri.includes('youtu.be');
  
  // Debug logging
  if (isYouTubeUrl) {
    console.log('🎥 YouTube video detected:', uri.substring(0, 60));
  }

  // Extract YouTube video ID with better error handling
  const getYouTubeVideoId = (url: string) => {
    try {
      let videoId = '';

      // Handle youtube.com/watch?v=VIDEO_ID format
      if (url.includes('youtube.com/watch?v=')) {
        const params = url.split('?')[1];
        if (params) {
          const vParam = params.split('&').find(p => p.startsWith('v='));
          if (vParam) {
            videoId = vParam.split('=')[1];
          }
        }
      } 
      // Handle youtube.com/shorts/VIDEO_ID format
      else if (url.includes('youtube.com/shorts/')) {
        const parts = url.split('youtube.com/shorts/')[1];
        if (parts) {
          videoId = parts.split('?')[0].split('/')[0];
        }
      }
      // Handle youtu.be/VIDEO_ID format
      else if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/')[1];
        if (parts) {
          videoId = parts.split('?')[0].split('/')[0];
        }
      }
      // Handle youtube.com/embed/VIDEO_ID format
      else if (url.includes('youtube.com/embed/')) {
        const parts = url.split('youtube.com/embed/')[1];
        if (parts) {
          videoId = parts.split('?')[0].split('/')[0];
        }
      }

      // Validate video ID (should be 11 characters)
      if (videoId && videoId.length === 11) {
        console.log('✅ Extracted YouTube video ID:', videoId);
        return videoId;
      } else {
        console.error('❌ Invalid YouTube video ID length:', videoId, 'from URL:', url);
        return '';
      }
    } catch (error) {
      console.error('❌ Error extracting YouTube video ID:', error, 'from URL:', url);
      return '';
    }
  };

  const renderVideo = () => {
    if (isYouTubeUrl) {
      const videoId = getYouTubeVideoId(uri);
      
      if (!videoId) {
        console.error('❌ Failed to extract valid YouTube video ID from:', uri);
        return (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#d32f2f" />
            <Text style={styles.errorText}>Unable to load YouTube video</Text>
            <Text style={styles.errorSubtext}>Invalid video URL format</Text>
          </View>
        );
      }
      
      console.log('📺 Rendering YouTube player for video ID:', videoId);
      
      return (
        <YoutubePlayer
          height={300}
          videoId={videoId}
          play={false}
          onError={(error: unknown) => {
            console.error('❌ YouTube player error:', error, 'for video ID:', videoId);
          }}
          onReady={() => {
            console.log('✅ YouTube player ready for video ID:', videoId);
            setIsLoading(false);
          }}
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
          onLoad={() => {
            setIsLoading(false);
          }}
          onError={(error) => {
            console.error('❌ Video playback error:', {
              uri: uri,
              errorType: error?.error?.errorString || 'Unknown error',
            });
            setIsLoading(false);
          }}
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
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
              {showSlowLoadHint && (
                <Text style={styles.loadingText}>Loading video… this can take a few seconds</Text>
              )}
            </View>
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default VideoToggle;
