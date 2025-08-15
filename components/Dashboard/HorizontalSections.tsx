// components/Dashboard/HorizontalSections.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';

interface HorizontalSectionsProps {
  children: React.ReactNode[];
}

const { width: screenWidth } = Dimensions.get('window');
const SECTION_WIDTH = screenWidth - 32; // Account for padding

export default function HorizontalSections({ children }: HorizontalSectionsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {children.map((child, index) => (
          <View key={index} style={[styles.section, { width: SECTION_WIDTH }]}>
            {child}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    paddingRight: 16,
  },
});
