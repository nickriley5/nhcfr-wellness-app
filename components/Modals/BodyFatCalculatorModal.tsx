import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

interface BodyFatCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (value: number) => void;
}

const BodyFatCalculatorModal = ({ visible, onClose, onSaved }: BodyFatCalculatorModalProps) => {
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const [height, setHeight] = useState('');
  const [manualBfInput, setManualBfInput] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSex = async () => {
      const auth = getAuth(getApp());
      const db = getFirestore(getApp());
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.sex) {
          setSex(data.sex.toLowerCase());
        }
      }
    };

    if (visible) {
      fetchSex();
      setBodyFat(null);
      setManualBfInput('');
      setManualMode(false);
    }
  }, [visible]);

  const calculateBodyFat = () => {
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const h = parseFloat(height);
    const hp = parseFloat(hip);

    if (!sex || !w || !n || !h || (sex === 'female' && !hp)) {
      setBodyFat(null);
      return;
    }

    let bf: number;
    if (sex === 'male') {
      bf = 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
    } else {
      bf = 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
    }

    const rounded = parseFloat(bf.toFixed(1));
    setBodyFat(rounded);
  };

  const handleSave = async () => {
  const auth = getAuth(getApp());
  const db = getFirestore(getApp());
  const uid = auth.currentUser?.uid;
  if (!uid) {return;}

  let valueToSave: number;

  if (manualMode) {
    const manualValue = parseFloat(manualBfInput);
    if (isNaN(manualValue) || manualValue <= 0 || manualValue > 70) {
      Alert.alert('Invalid body fat % entered.');
      return;
    }
    valueToSave = parseFloat(manualValue.toFixed(1));
  } else {
    if (bodyFat === null) {
      Alert.alert('Please calculate your body fat first.');
      return;
    }
    valueToSave = bodyFat;
  }

  const timestamp = new Date();
  const logId = timestamp.toISOString().replace(/[:.]/g, '-'); // Firestore-safe ID

  setSaving(true);
  try {
    // Update current bodyFatPct field
    await updateDoc(doc(db, 'users', uid), {
      bodyFatPct: valueToSave,
    });

    // Add historical log
    await setDoc(doc(db, 'users', uid, 'bodyFatLogs', logId), {
  value: valueToSave,
  savedAt: timestamp,
});

    if (onSaved) {onSaved(valueToSave);}
    onClose();
  } catch (err) {
    console.error('Error saving body fat:', err);
    Alert.alert('Error saving data');
  } finally {
    setSaving(false);
  }
};


  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Body Fat Entry</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.label}>Manual Input</Text>
              <Switch value={manualMode} onValueChange={setManualMode} />
            </View>

            {manualMode ? (
              <>
                <Text style={styles.label}>Body Fat %</Text>
                <TextInput
                  value={manualBfInput}
                  onChangeText={setManualBfInput}
                  keyboardType="numeric"
                  placeholder="e.g. 18.5"
                  style={styles.input}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Waist (in)</Text>
                <TextInput value={waist} onChangeText={setWaist} keyboardType="numeric" style={styles.input} />

                <Text style={styles.label}>Neck (in)</Text>
                <TextInput value={neck} onChangeText={setNeck} keyboardType="numeric" style={styles.input} />

                {sex === 'female' && (
                  <>
                    <Text style={styles.label}>Hip (in)</Text>
                    <TextInput value={hip} onChangeText={setHip} keyboardType="numeric" style={styles.input} />
                  </>
                )}

                <Text style={styles.label}>Height (in)</Text>
                <TextInput value={height} onChangeText={setHeight} keyboardType="numeric" style={styles.input} />

                <Pressable style={styles.button} onPress={calculateBodyFat}>
                  <Text style={styles.buttonText}>Calculate</Text>
                </Pressable>

                {bodyFat !== null && (
                  <Text style={styles.result}>Estimated Body Fat: {bodyFat}%</Text>
                )}
              </>
            )}

            <Pressable style={[styles.button, styles.redButton]} onPress={handleSave} disabled={saving}>
              <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save to Profile'}</Text>
            </Pressable>

            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  redButton: {
    backgroundColor: '#d32f2f',
  },
  result: {
    color: '#4fc3f7',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 12,
  },
  closeText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
});

export default BodyFatCalculatorModal;
