import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { Exercise, ProgramDay } from '../types/Exercise';

export function useDashboardData(view: 'week' | 'month' | 'all') {
  const [moodData, setMoodData] = useState<number[]>([]);
  const [energyData, setEnergyData] = useState<number[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(true);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(180);
  const [programExists, setProgramExists] = useState(false);
  const [mealPlanExists, setMealPlanExists] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [todayInfo, setTodayInfo] = useState<{
    day: ProgramDay;
    weekIdx: number;
    dayIdx: number;
  } | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const user = auth.currentUser;
      if (!user) {return;}

      const progSnap = await getDoc(doc(db, 'users', user.uid, 'program', 'active'));
      setProgramExists(progSnap.exists());

      const mealSnap = await getDoc(doc(db, 'users', user.uid, 'mealPlan', 'active'));
      setMealPlanExists(mealSnap.exists());

      if (progSnap.exists()) {
        const prog: any = progSnap.data();
        const days: ProgramDay[] = prog.days || [];
        const curDay = prog.metadata?.currentDay ?? 1;
        const idx = Math.max(0, curDay - 1);

        if (days[idx]) {
          setTodayInfo({
            day: days[idx],
            weekIdx: days[idx].week - 1,
            dayIdx: days[idx].day - 1,
          });
        } else {
          setTodayInfo(null);
        }
      }

      const checkSnap = await getDocs(
        query(collection(db, 'users', user.uid, 'checkIns'), orderBy('timestamp', 'desc'))
      );
      const entries = checkSnap.docs.map((d) => d.data());
      const todayStr = new Date().toDateString();
      if (!entries[0] || new Date(entries[0].timestamp?.toDate()).toDateString() !== todayStr) {
        setHasCheckedInToday(false);
      }

      const limited =
        view === 'week' ? entries.slice(0, 7)
        : view === 'month' ? entries.slice(0, 30)
        : entries;
      limited.reverse();
      setMoodData(limited.map((e) => e.mood ?? 0));
      setEnergyData(limited.map((e) => e.energy ?? 0));

      const profile = (await getDoc(doc(db, 'users', user.uid))).data();
      if (profile) {
        const fields = [
          profile.fullName,
          profile.dob,
          profile.height,
          profile.weight,
          profile.profilePicture,
          profile.bodyFatPct,
        ];
        setCompletionPercent(
          Math.round((fields.filter(Boolean).length / fields.length) * 100)
        );
        setCurrentWeight(Number(profile.weight) || 180);
      }

      const libSnap = await getDocs(collection(db, 'exercises'));
      setExerciseLibrary(libSnap.docs.map((d) => d.data() as Exercise));
    };

    fetchAll();
  }, [view]);

  return {
    moodData,
    energyData,
    hasCheckedInToday,
    completionPercent,
    currentWeight,
    programExists,
    mealPlanExists,
    exerciseLibrary,
    todayInfo,
  };
}
