// scripts/setCoreFields.ts
import { collection, getDocs, writeBatch, doc} from 'firebase/firestore';
import { db } from '../firebase'; // ✅ use your existing db instance

// Set these to what you want as the default baseline
const DEFAULTS = {
  coreSet: false as boolean,
  status: 'extended' as 'core' | 'extended' | 'deprecated',
};

async function run() {
  console.log('🔧 Updating exercise documents with coreSet/status…');

  const snap = await getDocs(collection(db, 'exercises'));
  console.log(`📦 Found ${snap.size} exercises.`);

  // Firestore batch limit = 500 writes
  const CHUNK = 400;
  let processed = 0;

  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    const slice = docs.slice(i, i + CHUNK);

    slice.forEach((d) => {
      const data = d.data() as any;
      // Only set fields if missing so we don't overwrite manual edits
      const payload: any = {};
      if (typeof data.coreSet === 'undefined') {payload.coreSet = DEFAULTS.coreSet;}
      if (typeof data.status === 'undefined') {payload.status = DEFAULTS.status;}

      // nothing to write? skip
      if (Object.keys(payload).length === 0) {return;}

      batch.set(doc(db, 'exercises', d.id), payload, { merge: true });
    });

    await batch.commit();
    processed += slice.length;
    console.log(`✅ Committed ${Math.min(processed, docs.length)} / ${docs.length}`);
  }

  console.log('🎉 Done.');
}

run().catch((e) => {
  console.error('❌ Script failed:', e);
  process.exit(1);
});
