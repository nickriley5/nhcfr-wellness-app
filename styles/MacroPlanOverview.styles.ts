import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  headerContainer: {
  marginBottom: 20,
  alignItems: 'center',
},
greeting: {
  fontSize: 22,
  fontWeight: '700',
  color: '#fff',
  marginBottom: 6,
},
goalTag: {
  backgroundColor: '#2a2a2a',
  paddingHorizontal: 16,
  paddingVertical: 6,
  borderRadius: 20,
},
goalText: {
  color: '#ccc',
  fontWeight: '600',
  fontSize: 14,
},

  container: { flex: 1 },
  scroll: { padding: 20 },
  recapCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  recapText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartLabel: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  diffText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  over: { color: '#ff6b6b' },
  under: { color: '#81C784' },
  editCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  editTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sliderRow: { marginBottom: 12 },
  sliderLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  slider: { width: '100%', height: 40 },
  warning: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  editButtons: {
  flexDirection: 'column',
  gap: 10,
  marginTop: 16,
},
secondaryActionButton: {
  backgroundColor: '#1E2A38',
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#4FC3F7',
},

secondaryActionButtonText: {
  color: '#4FC3F7',
  fontSize: 16,
  fontWeight: '600',
},
  saveButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  centeredSvg: { alignSelf: 'center', marginBottom: 8 },
  dayDetailCard: {
  backgroundColor: '#1C1F26',
  borderRadius: 12,
  padding: 16,
  marginHorizontal: 16,
  marginBottom: 20,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 4,
},
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summary: {
  color: '#ccc',
  fontSize: 14,
  lineHeight: 20,
},
  button: {
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dayLabelsRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 2,
  paddingHorizontal: 10,
},
dayLabel: {
  color: 'white',
  fontSize: 12,
  textAlign: 'center',
  width: 40,
},
svg: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  noDataText: {
    color: '#ccc',
    textAlign: 'center',
    paddingVertical: 10,
  },
zoneSection: {
  marginVertical: 20,
  paddingHorizontal: 16,
  alignItems: 'center',
},

zonePieContainer: {
  backgroundColor: '#1C1F26',
  padding: 20,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 12,
  elevation: 8,
  marginBottom: 16,
},
zoneLegend: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 24,
  marginTop: 12,
  paddingHorizontal: 16,
},
legendRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
legendColorBox: {
  width: 14,
  height: 14,
  borderRadius: 4,
},
legendText: {
  color: '#EAEAEA',
  fontSize: 14,
  fontWeight: '600',
},
totalBlocks: {
  textAlign: 'center',
  color: '#4FC3F7',
  fontSize: 16,
  fontWeight: 'bold',
  marginVertical: 12,
},
  viewPlanButton: {
  backgroundColor: '#ff3b30',
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 24,
  marginBottom: 32,
},
viewPlanText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},

  infoText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  inputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 8,
  justifyContent: 'space-between',
},
numberInput: {
  width: 80,
  height: 40,
  backgroundColor: '#222',
  color: '#fff',
  textAlign: 'center',
  borderRadius: 6,
  borderWidth: 1,
  borderColor: '#444',
  marginHorizontal: 8,
},
adjustBtn: {
  paddingVertical: 6,
  paddingHorizontal: 10,
  backgroundColor: '#333',
  borderRadius: 6,
},
adjustTxt: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
},
macroRow: {
  marginBottom: 16,
},
adjustbtnActive: {
  backgroundColor: '#4FC3F7',
},
splitSeparator: {
  color: '#fff',
  marginHorizontal: 6,
  fontSize: 16,
  fontWeight: '600',
},
resultsPreview: {
  marginTop: 16,
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
},
resultsTxt: {
  fontSize: 14,
  color: 'white',
  fontWeight: '500',
  marginBottom: 12,
},
splitDivider: {
  color: '#fff',
  marginHorizontal: 6,
  fontSize: 16,
  fontWeight: '600',
},
dayLabelSelected: {
  color: '#FFD54F',
  fontWeight: 'bold',
},
dayUnderline: {
  height: 2,
  backgroundColor: '#FFD54F',
  width: '100%',
  position: 'absolute',
  bottom: 0,
  left: 0,
},

sectionBlock: {
  marginBottom: 16,
},
proteinColor: {
  color: '#4FC3F7',
},

carbColor: {
  color: '#81C784',
},

fatColor: {
  color: '#F06292',
},

darkActionButton: {
  backgroundColor: '#202124',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 16,
  shadowColor: '#FFD54F',
  shadowOpacity: 0.15,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 3,
},

darkActionButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
  letterSpacing: 0.5,
},
// === Toggle row (Standard vs Zone) ===
toggleContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 16,
  paddingBottom: 8,
},

toggleButton: {
  flex: 1,
  paddingVertical: 10,
  marginHorizontal: 4,
  borderRadius: 10,
  backgroundColor: '#1C1F26',  // dark base
  borderWidth: 1,
  borderColor: '#333',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 2,
},


toggleActive: {
  borderColor: '#4FC3F7',
  backgroundColor: '#2A2F3A',  // slightly lighter than inactive
  shadowColor: '#4FC3F7',      // same glow as low-carb active
  shadowOpacity: 0.5,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 10,
  elevation: 8,
},

toggleText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#bbb',                 // inactive text muted
},

toggleTextActive: {
  color: '#fff',                 // active text bright white
},

// === Preset row (Low-Carb / Balanced / High-Carb) ===
presetRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
},

presetBtn: {
  flex: 1,
  paddingVertical: 8,
  marginHorizontal: 4,
  borderRadius: 10,
  backgroundColor: '#202124',
  borderWidth: 1,
  borderColor: '#333',
  alignItems: 'center',
  justifyContent: 'center',

  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 2,
  elevation: 2,
},

presetBtnActive: {
  borderColor: '#4FC3F7',
  backgroundColor: '#252A34',
  shadowColor: '#4FC3F7',
  shadowOpacity: 0.4,
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 8,
  elevation: 6,
},

presetTxt: {
  fontSize: 14,
  fontWeight: '500',
  color: '#aaa',
},

presetTxtActive: {
  color: '#fff',
},





});

export default styles;
