/* eslint-disable no-trailing-spaces */
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  GestureResponderEvent,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';
import { Calendar, DateData } from 'react-native-calendars';

interface MealType {
  id: string;
  label: string;
  emoji: string;
  defaultTime: string;
}

interface LoggingMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  primary?: boolean;
  color: string;
}

export interface MealContext {
  mealType: MealType | null;
  date: string;
  time: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenDescribeModal: (mealContext: MealContext) => void;
  onOpenQuickAdd: (mealContext: MealContext) => void;
  onOpenCamera: (mealContext: MealContext) => void;
}

// Clock Face Component with proper TypeScript
interface ClockFaceProps {
  selectedHour: number;
  selectedMinute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  isSelectingMinutes: boolean;
}

const ClockFace: React.FC<ClockFaceProps> = ({ 
  selectedHour, 
  selectedMinute, 
  onHourChange, 
  onMinuteChange, 
  isSelectingMinutes, 
}) => {
  const clockRadius = 120;
  const centerX = clockRadius;
  const centerY = clockRadius;

  const calculateAngle = (x: number, y: number): number => {
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = (angle + 90) % 360;
    if (angle < 0) {angle += 360;}
    return angle;
  };

  const getClockPosition = (value: number, isMinute: boolean): { x: number; y: number } => {
    const maxValue = isMinute ? 60 : 12;
    const angle = (value / maxValue) * 360 - 90;
    const radian = (angle * Math.PI) / 180;
    const radius = clockRadius - 30;
    
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian),
    };
  };

  const handleClockTouch = (x: number, y: number): void => {
    const angle = calculateAngle(x, y);
    
    if (isSelectingMinutes) {
      // Snap to 5-minute intervals for better UX
      const rawMinute = (angle / 360) * 60;
      const minute = Math.round(rawMinute / 5) * 5;
      onMinuteChange(minute % 60);
    } else {
      const rawHour = (angle / 360) * 12;
      const hour = Math.round(rawHour) % 12;
      const adjustedHour = selectedHour >= 12 ? hour + 12 : hour;
      onHourChange(adjustedHour === 0 ? (selectedHour >= 12 ? 12 : 0) : adjustedHour);
    }
  };

  const handleNumberTap = (value: number): void => {
  if (isSelectingMinutes) {
    onMinuteChange(value);
  } else {
    // Simple 12-hour logic with AM/PM
    const isCurrentlyPM = selectedHour >= 12;
    const newHour = isCurrentlyPM ? value + 12 : value;
    onHourChange(newHour === 12 && !isCurrentlyPM ? 0 : newHour === 24 ? 12 : newHour);
  }
};

  const currentValue = isSelectingMinutes ? selectedMinute : selectedHour % 12;
  const handPosition = getClockPosition(currentValue, isSelectingMinutes);

  return (
    <View style={styles.clockFace}>
      {/* Background touch area for dragging */}
      <Pressable 
        style={styles.clockTouchArea}
        onPress={(event: GestureResponderEvent) => {
          const { locationX, locationY } = event.nativeEvent;
          handleClockTouch(locationX, locationY);
        }}
      >
        {/* Clock Numbers - Now Tappable! */}
        {isSelectingMinutes ? (
          // Minute markers (0, 5, 10, 15, etc.) - Tappable
          [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => {
            const position = getClockPosition(minute, true);
            return (
              <Pressable
                key={minute}
                style={[
                  styles.clockNumberButton,
                  { left: position.x - 20, top: position.y - 20 },
                  selectedMinute === minute && styles.selectedClockNumber,
                ]}
                onPress={() => handleNumberTap(minute)}
              >
                <Text style={[
                  styles.clockNumberText,
                  selectedMinute === minute && styles.selectedClockNumberText,
                ]}>
                  {minute.toString().padStart(2, '0')}
                </Text>
              </Pressable>
            );
          })
        ) : (
          // Hour markers (1-12) - Tappable
          Array.from({ length: 12 }, (_, i) => {
            const hour = i + 1;
            const position = getClockPosition(hour, false);
            const isSelected = (selectedHour % 12) === (hour % 12);
            return (
              <Pressable
                key={hour}
                style={[
                  styles.clockNumberButton,
                  { left: position.x - 20, top: position.y - 20 },
                  isSelected && styles.selectedClockNumber,
                ]}
                onPress={() => handleNumberTap(hour)}
              >
                <Text style={[
                  styles.clockNumberText,
                  isSelected && styles.selectedClockNumberText,
                ]}>
                  {hour}
                </Text>
              </Pressable>
            );
          })
        )}

        {/* Clock Hand */}
        <View style={styles.clockCenter} />
        <View 
          style={[
            styles.clockHand,
            {
              transform: [
                { translateX: (handPosition.x - centerX) / 2 },
                { translateY: (handPosition.y - centerY) / 2 },
                { 
                  rotate: `${((currentValue / (isSelectingMinutes ? 60 : 12)) * 360 - 90)}deg`, 
                },
              ],
            },
          ]} 
        />

        {/* Selected Time Dot */}
        <View 
          style={[
            styles.clockDot,
            { left: handPosition.x - 10, top: handPosition.y - 10 },
          ]} 
        />
      </Pressable>
      
    
    </View>
  );
};

const MealLoggingModal: React.FC<Props> = ({
  visible,
  onClose,
  onOpenDescribeModal,
  onOpenQuickAdd,
  onOpenCamera,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Clock picker states
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());
  const [isSelectingMinutes, setIsSelectingMinutes] = useState(false);

  const mealTypes: MealType[] = [
    { id: 'breakfast', label: 'Breakfast', emoji: '🍳', defaultTime: '08:00' },
    { id: 'snack1', label: 'Morning Snack', emoji: '🍎', defaultTime: '10:30' },
    { id: 'lunch', label: 'Lunch', emoji: '🥗', defaultTime: '12:30' },
    { id: 'snack2', label: 'Afternoon Snack', emoji: '🥜', defaultTime: '15:30' },
    { id: 'dinner', label: 'Dinner', emoji: '🍽️', defaultTime: '18:30' },
    { id: 'dessert', label: 'Dessert', emoji: '🍰', defaultTime: '20:00' },
  ];

  const methods: LoggingMethod[] = [
    {
      id: 'photo-describe',
      title: 'Photo + Describe',
      subtitle: '96% accuracy with smart analysis',
      icon: 'camera',
      primary: true,
      color: '#4FC3F7',
    },
    {
      id: 'quick-add',
      title: 'Quick Add',
      subtitle: 'Instant logging from favorites',
      icon: 'flash',
      color: '#81C784',
    },
    {
      id: 'describe-only',
      title: 'Describe Meal',
      subtitle: 'Text description only',
      icon: 'create',
      color: '#FFD54F',
    },
  ];

  // Auto-suggest meal type based on current time
  const getSuggestedMealType = (): MealType => {
    const currentHour = new Date().getHours();

    if (currentHour >= 6 && currentHour < 10) {return mealTypes[0];} // Breakfast
    if (currentHour >= 10 && currentHour < 12) {return mealTypes[1];} // Morning Snack
    if (currentHour >= 12 && currentHour < 15) {return mealTypes[2];} // Lunch
    if (currentHour >= 15 && currentHour < 17) {return mealTypes[3];} // Afternoon Snack
    if (currentHour >= 17 && currentHour < 21) {return mealTypes[4];} // Dinner
    return mealTypes[5]; // Dessert/Late night
  };

  const handleMethodSelect = (methodId: string): void => {
    const mealType = selectedMealType || getSuggestedMealType();

    const mealContext: MealContext = {
      mealType,
      date: selectedDate,
      time: selectedTime,
    };

    onClose();

    setTimeout(() => {
      switch (methodId) {
        case 'photo-describe':
          onOpenCamera(mealContext);
          break;
        case 'quick-add':
          onOpenQuickAdd(mealContext);
          break;
        case 'describe-only':
          onOpenDescribeModal(mealContext);
          break;
      }
    }, 300);
  };

  const resetModal = (): void => {
    setSelectedMealType(null);
    setSelectedTime(format(new Date(), 'HH:mm'));
    setSelectedHour(new Date().getHours());
    setSelectedMinute(new Date().getMinutes());
    setIsSelectingMinutes(false);
  };

  const handleClose = (): void => {
    resetModal();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Log Your Meal</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Quick Meal Type Selection */}
            <View style={styles.mealTypeSection}>
              <Text style={styles.sectionTitle}>
                {selectedMealType ? `${selectedMealType.emoji} ${selectedMealType.label}` : 'Meal Type (optional)'}
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTypeScroll}>
                {mealTypes.map((meal) => (
                  <Pressable
                    key={meal.id}
                    style={[
                      styles.mealTypeChip,
                      selectedMealType?.id === meal.id && styles.selectedMealType,
                    ]}
                    onPress={() => {
                      setSelectedMealType(meal);
                      setSelectedTime(meal.defaultTime);
                    }}
                  >
                    <Text style={styles.mealTypeEmoji}>{meal.emoji}</Text>
                    <Text style={[
                      styles.mealTypeText,
                      selectedMealType?.id === meal.id && styles.selectedMealTypeText,
                    ]}>
                      {meal.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Enhanced Time Section */}
            <View style={styles.timeSection}>
              <Text style={styles.sectionTitle}>When did you eat?</Text>

              {/* Date and Time Selectors */}
              <View style={styles.dateTimeRow}>
                {/* Date Selector */}
                <Pressable
                  style={styles.dateTimeCard}
                  onPress={() => setShowCalendar(true)}
                >
                  <View style={styles.dateTimeHeader}>
                    <Ionicons name="calendar" size={20} color="#4FC3F7" />
                    <Text style={styles.dateTimeLabel}>Date</Text>
                  </View>
                  <Text style={styles.dateTimeValue}>
                    {selectedDate === format(new Date(), 'yyyy-MM-dd')
                      ? 'Today'
                      : format(new Date(selectedDate), 'MMM d, yyyy')
                    }
                  </Text>
                </Pressable>

                {/* Time Selector */}
                <Pressable
                  style={styles.dateTimeCard}
                  onPress={() => setShowTimePicker(true)}
                >
                  <View style={styles.dateTimeHeader}>
                    <Ionicons name="time" size={20} color="#4FC3F7" />
                    <Text style={styles.dateTimeLabel}>Time</Text>
                  </View>
                  <Text style={styles.dateTimeValue}>{selectedTime}</Text>
                </Pressable>
              </View>
            </View>

            {/* Primary Methods - Big, Visual */}
            <View style={styles.primarySection}>
              <Text style={styles.sectionTitle}>How would you like to log this meal?</Text>

              {methods.map((method) => (
                <Pressable
                  key={method.id}
                  style={[
                    styles.methodCard,
                    method.primary && styles.primaryMethod,
                    { borderColor: method.color },
                  ]}
                  onPress={() => handleMethodSelect(method.id)}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
                    <Ionicons name={method.icon as any} size={28} color="#000" />
                  </View>
                  <View style={styles.methodContent}>
                    <Text style={styles.methodTitle}>{method.title}</Text>
                    <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </Pressable>
              ))}
            </View>

            {/* Info Footer */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                💡 Pro tip: Photo + Describe gives the most accurate nutrition data using AI analysis
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <Calendar
              onDayPress={(day: DateData) => {
                setSelectedDate(day.dateString);
                setShowCalendar(false);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#4FC3F7' },
              }}
              theme={{
                backgroundColor: '#2a2a2a',
                calendarBackground: '#2a2a2a',
                textSectionTitleColor: '#fff',
                selectedDayBackgroundColor: '#4FC3F7',
                selectedDayTextColor: '#000',
                todayTextColor: '#4FC3F7',
                dayTextColor: '#fff',
                textDisabledColor: '#666',
                monthTextColor: '#fff',
                arrowColor: '#4FC3F7',
              }}
            />

            <Pressable
              style={styles.calendarCloseButton}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.calendarCloseText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Analog Clock Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.clockPickerContainer}>
            {/* Time Display Header */}
            <View style={styles.clockHeader}>
              <Text style={styles.clockTimeDisplay}>
  {`${(selectedHour % 12 || 12)}:${selectedMinute.toString().padStart(2, '0')}`}
</Text>
              <View style={styles.amPmSelector}>
                <Pressable 
                  style={[styles.amPmBtn, selectedHour < 12 && styles.amPmBtnActive]}
                  onPress={() => {
                    if (selectedHour >= 12) {
                      setSelectedHour(selectedHour - 12);
                    }
                  }}
                >
                  <Text style={[styles.amPmBtnText, selectedHour < 12 && styles.amPmBtnTextActive]}>AM</Text>
                </Pressable>
                <Pressable 
                  style={[styles.amPmBtn, selectedHour >= 12 && styles.amPmBtnActive]}
                  onPress={() => {
                    if (selectedHour < 12) {
                      setSelectedHour(selectedHour + 12);
                    }
                  }}
                >
                  <Text style={[styles.amPmBtnText, selectedHour >= 12 && styles.amPmBtnTextActive]}>PM</Text>
                </Pressable>
              </View>
            </View>

            {/* Clock Face */}
            <View style={styles.clockContainer}>
              <ClockFace 
                selectedHour={selectedHour}
                selectedMinute={selectedMinute}
                onHourChange={setSelectedHour}
                onMinuteChange={setSelectedMinute}
                isSelectingMinutes={isSelectingMinutes}
              />
            </View>

            {/* Toggle between hours and minutes */}
            <View style={styles.clockModeSelector}>
              <Pressable 
                style={[styles.clockModeBtn, !isSelectingMinutes && styles.clockModeBtnActive]}
                onPress={() => setIsSelectingMinutes(false)}
              >
                <Text style={[styles.clockModeText, !isSelectingMinutes && styles.clockModeTextActive]}>Hour</Text>
              </Pressable>
              <Pressable 
                style={[styles.clockModeBtn, isSelectingMinutes && styles.clockModeBtnActive]}
                onPress={() => setIsSelectingMinutes(true)}
              >
                <Text style={[styles.clockModeText, isSelectingMinutes && styles.clockModeTextActive]}>Minute</Text>
              </Pressable>
            </View>

            {/* Action Buttons */}
            <View style={styles.clockActions}>
              <Pressable 
                style={styles.clockCancelBtn}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.clockCancelText}>CANCEL</Text>
              </Pressable>
              
              <Pressable 
                style={styles.clockOkBtn}
                onPress={() => {
  const displayHour = selectedHour % 12 || 12;
  setSelectedTime(`${displayHour}:${selectedMinute.toString().padStart(2, '0')}`);
  setShowTimePicker(false);
}}
              >
                <Text style={styles.clockOkText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default MealLoggingModal;

const styles = StyleSheet.create({
  // Main Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },

  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },

  // Meal Type Section
  mealTypeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  mealTypeScroll: {
    marginBottom: 8,
  },
  mealTypeChip: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMealType: {
    backgroundColor: '#4FC3F7',
    borderColor: '#4FC3F7',
  },
  mealTypeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#aaa',
  },
  selectedMealTypeText: {
    color: '#000',
    fontWeight: '600',
  },

  // Time Section
  timeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  dateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#aaa',
    marginLeft: 6,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  quickTimeSection: {
    marginTop: 8,
  },
  quickTimeLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  timeAdjustments: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeButtonText: {
    color: '#4FC3F7',
    fontSize: 12,
    fontWeight: '500',
  },

  // Primary Methods Section
  primarySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  methodCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  primaryMethod: {
    backgroundColor: '#1e3a4a',
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Calendar Modal
  calendarContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  calendarCloseButton: {
    backgroundColor: '#4FC3F7',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  calendarCloseText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },

  // Clock Picker Styles
  clockPickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 320,
    alignItems: 'center',
  },
  clockHeader: {
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  clockTimeDisplay: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 10,
  },
  amPmSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 2,
  },
  amPmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  amPmBtnActive: {
    backgroundColor: '#fff',
  },
  amPmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  amPmBtnTextActive: {
    color: '#4FC3F7',
  },
  clockContainer: {
    marginBottom: 20, // Extra space for quick minute buttons
    position: 'relative',
  },
  clockFace: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#f5f5f5',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockTouchArea: {
    width: 240,
    height: 240,
    borderRadius: 120,
    position: 'relative',
  },
  clockNumber: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockNumberButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectedClockNumber: {
    backgroundColor: '#4FC3F7',
  },
  clockNumberText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  selectedClockNumberText: {
    color: '#fff',
    fontWeight: '700',
  },
  clockCenter: {
    position: 'absolute',
    top: 115,
    left: 115,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4FC3F7',
    zIndex: 3,
  },
  clockHand: {
    position: 'absolute',
    top: 118,
    left: 120,
    width: 75,
    height: 4,
    backgroundColor: '#4FC3F7',
    transformOrigin: '0 50%',
    zIndex: 2,
  },
  clockDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4FC3F7',
    zIndex: 4,
    borderWidth: 3,
    borderColor: '#fff',
  },
  clockModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 2,
    marginBottom: 20,
  },
  clockModeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  clockModeBtnActive: {
    backgroundColor: '#4FC3F7',
  },
  clockModeText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  clockModeTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  clockActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 20,
  },
  clockCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  clockCancelText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '500',
  },
  clockOkBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  clockOkText: {
    color: '#4FC3F7',
    fontSize: 16,
    fontWeight: '600',
  },
});
