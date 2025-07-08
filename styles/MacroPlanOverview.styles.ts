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
  toggleContainer: {
  flexDirection: 'row',
  backgroundColor: '#2b2b2b',
  borderRadius: 999,
  padding: 4,
  marginVertical: 20,
  },
  toggleButton: {
  flex: 1,
  paddingVertical: 10,
  borderRadius: 999,
  alignItems: 'center',
  justifyContent: 'center',
},
  toggleActive: {
  backgroundColor: '#4FC3F7',
},
toggleText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#aaa',
},
toggleTextActive: {
  color: '#fff',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summary: { color: '#bbb', fontSize: 14, lineHeight: 20 },
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
zoneLegend: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginBottom: 10,
},
legendRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginHorizontal: 8,
},
legendColorBox: {
  width: 14,
  height: 14,
  borderRadius: 3,
  marginRight: 6,
},
legendText: {
  color: '#ccc',
  fontSize: 13,
},
totalBlocks: {
  textAlign: 'center',
  color: '#888',
  fontSize: 14,
  marginBottom: 10,
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
  },

});

export default styles;
