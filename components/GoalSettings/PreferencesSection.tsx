import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  dietaryPreference: 'none' | 'carnivore' | 'paleo' | 'vegetarian' | 'vegan';
  dietaryRestrictions: Array<'gluten_free' | 'dairy_free' | 'low_fodmap'>;
  onChangePreference: (value: Props['dietaryPreference']) => void;
  onToggleRestriction: (value: 'gluten_free' | 'dairy_free' | 'low_fodmap') => void;
}

const PreferencesSection = ({
  dietaryPreference,
  dietaryRestrictions,
  onChangePreference,
  onToggleRestriction,
}: Props) => {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.label}>Dietary Preference</Text>
        <View style={styles.optionsRow}>
          {['none', 'carnivore', 'paleo'].map((pref) => (
            <Pressable
              key={pref}
              style={[styles.optionButton, dietaryPreference === pref && styles.activeOption]}
              onPress={() => onChangePreference(pref as Props['dietaryPreference'])}
            >
              <Text style={styles.optionText}>{pref.charAt(0).toUpperCase() + pref.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.optionsRow, styles.justifyFlexStart]}>
          {['vegetarian', 'vegan'].map((pref) => (
            <Pressable
              key={pref}
              style={[styles.optionButton, dietaryPreference === pref && styles.activeOption]}
              onPress={() => onChangePreference(pref as Props['dietaryPreference'])}
            >
              <Text style={styles.optionText}>{pref.charAt(0).toUpperCase() + pref.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.summary}>
          Preferences help shape future recipe suggestions.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Dietary Restrictions</Text>
        <Text style={styles.hint}>Select all that apply</Text>
        <View style={styles.optionsRow}>
          {(['gluten_free', 'dairy_free', 'low_fodmap'] as const).map((r) => (
            <Pressable
              key={r}
              style={[styles.optionButton, dietaryRestrictions.includes(r) && styles.activeOption]}
              onPress={() => onToggleRestriction(r)}
            >
              <Text style={styles.optionText}>
                {r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </Pressable>
          ))}
        </View>
        {dietaryRestrictions.length === 0 && (
          <Text style={styles.hint}>No restrictions selected</Text>
        )}
        <Text style={styles.summary}>
          Restrictions will be used to filter future recipes.
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#1f1f1f', borderRadius: 16, padding: 16, marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, marginBottom: 8 },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  justifyFlexStart: {
    justifyContent: 'flex-start',
  },
  optionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    minWidth: '23%',
    flexGrow: 1,
    textAlign: 'center',
  },
  activeOption: {
    backgroundColor: '#ff3b30',
  },
  optionText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    flexWrap: 'nowrap',
    marginTop: 4,
  },
  summary: { color: '#aaa', marginTop: 8, fontSize: 13 },
  hint: { color: '#999', fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
});

export default PreferencesSection;
