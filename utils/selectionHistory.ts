import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function loadHistory(uid: string): Promise<string[]> {
  const ref = doc(db, 'users', uid, 'meta', 'selectionHistory');
  const snap = await getDoc(ref);
  return (snap.exists() && Array.isArray(snap.data().ids)) ? snap.data().ids as string[] : [];
}

export async function saveHistory(uid: string, ids: string[]) {
  const ref = doc(db, 'users', uid, 'meta', 'selectionHistory');
  const capped = ids.slice(-30);
  await setDoc(ref, { ids: capped }, { merge: true });
}
