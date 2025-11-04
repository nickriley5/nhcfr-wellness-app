import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
export const SECTION_WIDTH = screenWidth - 32; // Account for padding

export const dashboardStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  content: {
    paddingBottom: 100,
    flexGrow: 1,
  },

  // Header Styles
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerScheduleButton: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  headerScheduleText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    textAlign: 'center',
  },
  calendarIcon: {
    fontSize: 20,
  },

  // Section Styles
  sectionContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Card/Tile Styles
  tile: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  tileHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  tileHeaderClean: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Horizontal Scroll Styles
  horizontalScroll: {
    marginBottom: 16,
  },
  horizontalContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  horizontalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: SECTION_WIDTH * 0.85,
    borderWidth: 1,
    borderColor: '#333',
  },

  // Button Styles
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnPrimary: {
    backgroundColor: '#d32f2f',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnSecondary: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  btnSecondaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnWeeklyPlan: {
    backgroundColor: 'rgba(51, 214, 166, 0.2)',
    borderWidth: 1,
    borderColor: '#33d6a6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnWeeklyPlanText: {
    color: '#33d6a6',
    fontSize: 12,
    fontWeight: '600',
  },
  btnWeightLog: {
    backgroundColor: '#33d6a6',
    marginBottom: 16,
  },
  btnWeightLogText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnPreview: {
    backgroundColor: '#33d6a6',
    flex: 1,
  },
  btnPreviewText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  btnPreviewSecondary: {
    backgroundColor: 'rgba(51, 214, 166, 0.2)',
    flex: 1,
    borderWidth: 1,
    borderColor: '#33d6a6',
  },
  btnPreviewSecondaryText: {
    color: '#33d6a6',
    fontSize: 12,
    fontWeight: '600',
  },

  // Row Layouts
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryActions: {
    marginBottom: 16,
  },

  // Check-in Button
  checkInButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Readiness Styles
  readinessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  readinessMain: {
    flex: 1,
  },
  readinessScore: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  readinessLevel: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  readinessStatLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  readinessMessageCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  readinessMessage: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  embeddedChart: {
    marginTop: 8,
  },

  // No Check-in State
  noCheckInState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noCheckInIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  // Workout Styles
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  workoutMeta: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    lineHeight: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#0f0f0f',
    padding: 16,
    borderRadius: 12,
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#33d6a6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
    textAlign: 'center',
  },
  prSection: {
    backgroundColor: 'rgba(255, 165, 2, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffa502',
  },
  prTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffa502',
    marginBottom: 8,
  },
  prText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },

  // No Program State
  noProgramState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noProgramIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  // Text Styles
  mutedText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  linkWrap: {
    alignSelf: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#33d6a6',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Coming Up Section
  comingUpGradient: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  comingUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  comingUpHeaderLeft: {
    flex: 1,
  },
  comingUpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  comingUpSubtitle: {
    fontSize: 12,
    color: '#4FC3F7',
    marginTop: 4,
    fontWeight: '500',
  },
  dayIndicator: {
    backgroundColor: 'rgba(51, 214, 166, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#33d6a6',
  },
  dayIndicatorText: {
    color: '#33d6a6',
    fontSize: 12,
    fontWeight: '600',
  },
  comingUpActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Rest Preview
  restPreview: {
    marginBottom: 16,
  },
  restPreviewNew: {
    marginBottom: 16,
  },
  restTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FC3F7',
    marginBottom: 4,
  },
  restTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FC3F7',
  },
  restSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  restSubtitleNew: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  restHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restBadge: {
    backgroundColor: 'rgba(76, 195, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  restBadgeText: {
    color: '#4FC3F7',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  restTips: {
    gap: 4,
  },
  tipItem: {
    fontSize: 12,
    color: '#aaa',
  },
  restActivities: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  restActivity: {
    alignItems: 'center',
    flex: 1,
  },
  restActivityIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  restActivityText: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '500',
  },

  // Workout Preview
  workoutPreview: {
    marginBottom: 16,
  },
  workoutPreviewNew: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#33d6a6',
    marginBottom: 4,
  },
  previewTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#33d6a6',
    marginBottom: 4,
  },
  previewMeta: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  previewMetaNew: {
    fontSize: 13,
    color: '#888',
  },
  previewHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  intensityBadge: {
    backgroundColor: 'rgba(51, 214, 166, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  intensityBadgeText: {
    color: '#33d6a6',
    fontSize: 10,
    fontWeight: '600',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewStatsNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewStat: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatNew: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  previewStatNumberNew: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  previewStatLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  previewStatLabelNew: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  previewStatIconNew: {
    fontSize: 16,
    marginBottom: 4,
  },
  highlightExercise: {
    backgroundColor: 'rgba(51, 214, 166, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#33d6a6',
  },
  highlightTitle: {
    fontSize: 11,
    color: '#33d6a6',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  highlightExerciseName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },

  // No Preview State
  noPreviewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPreviewText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
  },
  noPreviewSubtext: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },

  // Consistency Styles
  consistencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  consistencyItem: {
    alignItems: 'center',
    flex: 1,
  },
  consistencyEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  consistencyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  consistencyLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  prHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffa502',
    marginBottom: 8,
  },
  prItem: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 3,
  },

  // Weight Tracking
  weeklyAverageContainer: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  weeklyAverageLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  weeklyAverageValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#33d6a6',
    marginBottom: 6,
  },
  weeklyAverageChange: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  weightTrackingFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },

  // Hydration Styles
  hydrationSection: {
    marginTop: 20,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hydrationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FC3F7',
  },
  hydrationProgress: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  dropletsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  waterDroplet: {
    padding: 4,
  },
  dropletIcon: {
    fontSize: 24,
    opacity: 0.3,
  },
  dropletFilled: {
    opacity: 1,
  },
  setGoalButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  setGoalText: {
    color: '#4FC3F7',
    fontSize: 12,
    fontWeight: '600',
  },
  changeGoalButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeGoalText: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  hydrationModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  goalOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  goalOption: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOptionSelected: {
    backgroundColor: '#4FC3F7',
    borderColor: '#4FC3F7',
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  goalOptionTextSelected: {
    color: '#000',
  },
  goalOptionSubtext: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  goalOptionSubtextSelected: {
    color: '#000',
  },
  modalButtons: {
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },

  // Additional styles missing from original
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakBadge: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  streakNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  streakLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  logFoodSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  logFoodButtonCentered: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  logFoodButtonCenteredText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  devSection: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  devLabel: {
    color: '#ffa502',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  resetProgramText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Container selection styles
  modalSection: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  containerOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  containerOption: {
    width: '30%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 8,
  },
  containerOptionSelected: {
    backgroundColor: '#33d6a6',
    borderColor: '#33d6a6',
  },
  containerOptionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  containerOptionTextSelected: {
    color: '#000',
  },
  containerOptionLabel: {
    color: '#aaa',
    fontSize: 10,
    textAlign: 'center',
  },
  containerOptionLabelSelected: {
    color: '#000',
  },
  // Modal scroll styles
  modalScrollContent: {
    maxHeight: 400,
  },
  modalScrollContainer: {
    paddingBottom: 20,
  },

  // Header with icon styles
  headerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
});
