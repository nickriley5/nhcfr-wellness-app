// utils/backfillExerciseFields.ts
import type { ExerciseLite } from './selectExercises';

// Infer movement patterns from common tags/keywords
export function inferPatternsFromTags(tags: string[] = []): ExerciseLite['patterns'] {
  const t = tags.map(x => x.toLowerCase());
  const p: string[] = [];
  if (t.some(x => /squat|lunge|split|step-?up/.test(x))) {p.push('squat');}
  if (t.some(x => /deadlift|hinge|rdl|kb swing|hip thrust/.test(x))) {p.push('hinge');}
  if (t.some(x => /press|ohp|shoulder|push-up|bench|dip/.test(x))) {p.push('push_v','push_h');}
  if (t.some(x => /row|pull-up|chin-up|lat|face ?pull/.test(x))) {p.push('pull_v','pull_h');}
  if (t.some(x => /carry|farmer|suitcase|yoke/.test(x))) {p.push('carry');}
  if (t.some(x => /core|abs|plank|hollow|sit-?up|anti-?rotation|anti-?extension/.test(x))) {p.push('core');}
  if (t.some(x => /run|bike|row|ski|double under|jump rope|burpee|metcon|conditioning/.test(x))) {p.push('mono');}
  return Array.from(new Set(p)) as any;
}

// Infer equipment tokens from your category string (e.g. "Dumbbell Only")
export function inferEquipmentFromCategory(cat?: string): ExerciseLite['equipment'] {
  const c = (cat || '').toLowerCase();
  const eq: string[] = [];
  if (c.includes('bodyweight')) {eq.push('none');}
  if (c.includes('dumbbell')) {eq.push('db');}
  if (c.includes('kettlebell')) {eq.push('kb');}
  if (c.includes('barbell')) {eq.push('barbell');}
  if (c.includes('pull') || c.includes('rig')) {eq.push('pullup_bar');}
  if (c.includes('medball') || c.includes('wall ball')) {eq.push('medball');}
  if (c.includes('ghd')) {eq.push('ghd');}
  if (c.includes('sled')) {eq.push('sled');}
  if (c.includes('jump') && c.includes('rope')) {eq.push('jumprope');}
  return (eq.length ? eq : undefined) as any;
}
