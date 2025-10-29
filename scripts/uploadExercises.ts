import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Load your service account key
const serviceAccount = require('./serviceAccountKey.json'); // Ensure this path is correct

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Correct path to your JSON file
const filePath = path.join(__dirname, 'src', 'data', 'exercise_library_with_goalTags.json');
const exercises = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Upload all exercises to the 'exercises' collection
async function uploadExercises() {
  for (const ex of exercises) {
    try {
      await db.collection('exercises').doc(ex.id).set(ex);
      console.log(`✅ Uploaded: ${ex.name}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${ex.name}:`, err);
    }
  }
  console.log('🏁 Upload complete.');
}

uploadExercises();
