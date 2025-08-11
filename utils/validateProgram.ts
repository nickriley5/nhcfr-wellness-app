import type { ProgramDay } from '../utils/buildProgramFromGoals';
export function validateProgram(days: ProgramDay[]) {
  const errs: string[] = [];
  days.forEach((d, i) => {
    if (!d.exercises?.length) {errs.push(`Day ${i} empty`);}
    const names = d.exercises.map(x => x.name);
    const dupes = names.filter((n, idx) => names.indexOf(n) !== idx);
    if (dupes.length) {errs.push(`Day ${i} duplicates: ${Array.from(new Set(dupes)).join(', ')}`);}
  });
  return errs;
}
