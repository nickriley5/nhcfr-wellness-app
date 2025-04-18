import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentProgram,
  saveAdaptedWorkout,
  generateProgram,
  Program,
  Exercise,
} from '../services/programService';

export function useProgram() {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load current program
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getCurrentProgram();
      setProgram(p);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Save adapted workout
  const saveAdaptations = useCallback(
    async (dayIndex: number, adapted: Exercise[]) => {
      setLoading(true);
      try {
        await saveAdaptedWorkout(dayIndex, adapted);
        await load();
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [load]
  );

  // Generate a fresh program
  const createProgram = useCallback(async () => {
    setLoading(true);
    try {
      await generateProgram();
      await load();
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [load]);

  return {
    program,
    loading,
    error,
    reload: load,
    saveAdaptedWorkout: saveAdaptations,
    generateProgram: createProgram,
  };
}
