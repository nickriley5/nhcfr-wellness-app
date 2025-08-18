// components/Modals/HydrationSettingsModal.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';

interface HydrationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  hydrationToday: {
    currentOz: number;
    goalOz: number;
    containerOz: number;
  };
  updateHydrationGoal: (newGoal: number) => Promise<void>;
  updateContainerSize: (newContainerOz: number) => Promise<void>;
}

export default function HydrationSettingsModal({
  visible,
  onClose,
  hydrationToday,
  updateHydrationGoal,
  updateContainerSize,
}: HydrationSettingsModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={dashboardStyles.modalOverlay}>
      <View style={dashboardStyles.hydrationModal}>
        <Text style={dashboardStyles.modalTitle}>Hydration Settings</Text>
        <Text style={dashboardStyles.modalSubtitle}>Configure your water tracking</Text>

        <ScrollView
          style={dashboardStyles.modalScrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Container Size Section */}
          <View style={dashboardStyles.modalSection}>
            <Text style={dashboardStyles.sectionTitle}>Container Size</Text>
            <Text style={dashboardStyles.sectionSubtitle}>What are you drinking from?</Text>
            <View style={dashboardStyles.containerOptionsGrid}>
              {[
                { oz: 8, label: 'Small Cup' },
                { oz: 12, label: 'Coffee Mug' },
                { oz: 16, label: 'Bottle' },
                { oz: 20, label: 'Large Bottle' },
                { oz: 32, label: 'Nalgene' },
                { oz: 64, label: 'Half Gallon' },
                { oz: 128, label: 'Gallon Jug' },
              ].map(container => (
                <Pressable
                  key={container.oz}
                  style={[
                    dashboardStyles.containerOption,
                    hydrationToday.containerOz === container.oz && dashboardStyles.containerOptionSelected,
                  ]}
                  onPress={() => updateContainerSize(container.oz)}
                >
                  <Text style={[
                    dashboardStyles.containerOptionText,
                    hydrationToday.containerOz === container.oz && dashboardStyles.containerOptionTextSelected,
                  ]}>
                    {container.oz} oz
                  </Text>
                  <Text style={[
                    dashboardStyles.containerOptionLabel,
                    hydrationToday.containerOz === container.oz && dashboardStyles.containerOptionLabelSelected,
                  ]}>
                    {container.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Daily Goal Section */}
          <View style={dashboardStyles.modalSection}>
            <Text style={dashboardStyles.sectionTitle}>Daily Goal</Text>
            <Text style={dashboardStyles.sectionSubtitle}>Choose your target water intake</Text>
            <View style={dashboardStyles.goalOptionsGrid}>
              {[48, 64, 80, 96, 112, 128, 144, 160, 192].map(oz => (
                <Pressable
                  key={oz}
                  style={[
                    dashboardStyles.goalOption,
                    hydrationToday.goalOz === oz && dashboardStyles.goalOptionSelected,
                  ]}
                  onPress={() => updateHydrationGoal(oz)}
                >
                  <Text style={[
                    dashboardStyles.goalOptionText,
                    hydrationToday.goalOz === oz && dashboardStyles.goalOptionTextSelected,
                  ]}>
                    {oz} oz
                  </Text>
                  <Text style={[
                    dashboardStyles.goalOptionSubtext,
                    hydrationToday.goalOz === oz && dashboardStyles.goalOptionSubtextSelected,
                  ]}>
                    {oz === 48 ? '6 cups' :
                     oz === 64 ? '8 cups' :
                     oz === 80 ? '10 cups' :
                     oz === 96 ? '12 cups' :
                     oz === 112 ? '14 cups' :
                     oz === 128 ? '1 gallon' :
                     oz === 144 ? '1.1 gal' :
                     oz === 160 ? '1.25 gal' :
                     '1.5 gal'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={dashboardStyles.modalButtons}>
          <Pressable
            style={dashboardStyles.modalCancelButton}
            onPress={onClose}
          >
            <Text style={dashboardStyles.modalCancelText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
