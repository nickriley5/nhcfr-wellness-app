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
          style={[styles.gradient, styles.completeGradient]}
        >
          <View style={[styles.content, styles.completeContent]}>
            <View style={[styles.iconContainer, styles.completeIconContainer]}>
              <Ionicons name="checkmark-circle-outline" size={30} color="#4caf50" />
            </View>
            <View style={[styles.textContainer, styles.completeTextContainer]}>
              <Text
                style={[styles.title, styles.completeTitle, styles.completeText]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                allowFontScaling={false}
              >
                Readiness Check Complete
              </Text>
              <Text
                style={[styles.subtitle, styles.completeText]}
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
            <Text style={styles.indicatorText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Sleep
            </Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="battery-charging" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Energy
            </Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="body" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Soreness
            </Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="flame" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Readiness
            </Text>
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
    minHeight: 118,
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  completeGradient: {
    minHeight: 0,
    height: 96,
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  completeContent: {
    minHeight: 48,
    justifyContent: 'center',
  },
  completeIconContainer: {
    position: 'absolute',
    left: 16,
    marginRight: 0,
  },
  completeTextContainer: {
    alignItems: 'center',
    flex: 0,
    width: '100%',
    paddingHorizontal: 66,
  },
  completeTitle: {
    fontSize: 15,
  },
  completeText: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  indicator: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  indicatorText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textAlign: 'center',
  },
});
