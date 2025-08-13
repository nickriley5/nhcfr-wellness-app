// utils/performanceMonitor.ts
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const checkAndAdjustRestDays = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {return;}

    const data = userSnap.data();
    const logs = data.workoutLogs || {};
    const checkIns = data.checkIns || {};

    // Sort workouts by date and grab last 7 days
    const recentWorkouts = Object.entries(logs)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 7);

    // Count completed workouts and recent energy ratings
    const workoutCount = recentWorkouts.length;
    let lowEnergyCount = 0;

    for (const [date, _workout] of recentWorkouts) {
      const checkIn = checkIns[date];
      if (checkIn && checkIn.energy <= 3) {lowEnergyCount++;}
    }

    // Check if low energy + high volume
    const needsMoreRest = workoutCount >= 6 && lowEnergyCount >= 3;

    if (needsMoreRest) {
      const currentMap = data.schedule?.environmentMap || {};
      const newMap = { ...currentMap };

      // Automatically add an extra off day if needed
      const offDays = Object.entries(newMap).filter(([, v]) => v === 'off');
      if (offDays.length < 3) {
        for (const day of ['Wed', 'Sun', 'Thu']) {
          if (newMap[day] !== 'off') {
            newMap[day] = 'off';
            break;
          }
        }
      }

      await updateDoc(userRef, {
        'schedule.environmentMap': newMap,
        'schedule.lastRestAdjustment': new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Rest day adjustment failed:', err);
  }
};
