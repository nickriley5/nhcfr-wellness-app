import React from 'react';
import { Dimensions, View, Text, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  hasCheckedInToday: boolean;
  onPress: () => void;
}

export const DailyCheckInCard: React.FC<Props> = ({ hasCheckedInToday, onPress }) => {
  if (hasCheckedInToday) {
    return (
      <Pressable style={styles.container} onPress={onPress}>
        <LinearGradient
          colors={['#1f2a22', '#203a26']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={30} color="#4caf50" />
            </View>
            <View style={styles.textContainer}>
              <Text
                style={styles.title}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                allowFontScaling={false}
              >
                Readiness Check Complete
              </Text>
              <Text
                style={styles.subtitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                allowFontScaling={false}
              >
                Tap to review or update
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={['#241617', '#321b1d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="pulse-outline" size={30} color="#ff6b6b" />
          </View>
          <View style={styles.textContainer}>
            <Text
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              allowFontScaling={false}
            >
              Complete Readiness Check
            </Text>
            <Text
              style={styles.subtitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              allowFontScaling={false}
            >
              Log recovery, stress, and training readiness
            </Text>
          </View>
          <View style={styles.trailingIcon}>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
          </View>
        </View>

        <View style={styles.indicatorRow}>
          <View style={styles.indicator}>
            <Ionicons name="moon" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText}>Sleep</Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="battery-charging" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText}>Energy</Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="body" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText}>Soreness</Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="flame" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText}>Readiness</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(screenWidth - 64, 520);

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    height: 82,
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
    flexShrink: 1,
  },
  trailingIcon: {
    width: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
    flexShrink: 0,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  indicator: {
    alignItems: 'center',
    gap: 4,
  },
  indicatorText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
});
