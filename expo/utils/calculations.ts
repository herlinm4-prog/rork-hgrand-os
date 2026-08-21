import { ActivityLevel, ACTIVITY_MULTIPLIERS } from '@/types';

export function calculateBMR(
  weight: number,
  bodyFatPercentage: number
): number {
  // Katch-McArdle needs a sane body-fat reading. An undefined or out-of-range
  // value used to produce NaN (or a wildly inflated BMR at 0%), which then
  // propagated into TDEE and the whole macro plan.
  const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 0;
  const bf =
    Number.isFinite(bodyFatPercentage) && bodyFatPercentage > 0 && bodyFatPercentage < 75
      ? bodyFatPercentage
      : 20;
  const leanMass = safeWeight * (1 - bf / 100);
  return Math.round(370 + 21.6 * leanMass);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateMacros(
  tdee: number,
  goal: string,
  weight: number
): { protein: number; carbs: number; fats: number; calories: number } {
  let calories = tdee;
  let proteinMultiplier = 2.0;

  switch (goal) {
    case 'lose_fat':
      calories = Math.round(tdee * 0.8);
      proteinMultiplier = 2.2;
      break;
    case 'build_muscle':
      calories = Math.round(tdee * 1.15);
      proteinMultiplier = 2.0;
      break;
    case 'maintain':
      calories = tdee;
      proteinMultiplier = 1.8;
      break;
    case 'recomp':
      calories = tdee;
      proteinMultiplier = 2.2;
      break;
    case 'competition':
      calories = Math.round(tdee * 0.75);
      proteinMultiplier = 2.5;
      break;
  }

  const protein = Math.round(weight * proteinMultiplier);
  const proteinCals = protein * 4;

  // Aggressive protocols (heavy athlete + competition deficit) can push
  // protein + fat past the whole calorie budget, which used to yield zero or
  // negative carbs. Trim fat down toward a 15% floor before letting carbs
  // collapse, then clamp so the plan is never negative.
  const MIN_FAT_RATIO = 0.15;
  let fatCals = Math.round(calories * 0.25);
  const carbFloorCals = Math.round(calories * 0.05);
  const available = calories - proteinCals - carbFloorCals;
  if (fatCals > available) {
    fatCals = Math.max(Math.round(calories * MIN_FAT_RATIO), Math.max(0, available));
  }
  const fats = Math.max(0, Math.round(fatCals / 9));
  const carbsCals = calories - proteinCals - fatCals;
  const carbs = Math.max(0, Math.round(carbsCals / 4));

  return { protein, carbs, fats, calories };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getWeightChange(checkIns: { date: string; weight: number }[]): number | null {
  if (checkIns.length < 2) return null;
  const sorted = [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return Math.round((sorted[0].weight - sorted[1].weight) * 10) / 10;
}

/**
 * Parse a user-typed number, tolerating the comma decimal separator used
 * across es-ES / es-MX locales. `parseFloat("72,5")` silently returns 72,
 * which quietly dropped half a kilo out of every weight, macro and TMB
 * calculation. Also strips thousands separators and stray whitespace.
 */
export function parseNum(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (value == null) return NaN;
  const normalized = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}\b)/g, '') // 1.234,5 -> 1234,5
    .replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

/** Same as parseNum but returns a fallback instead of NaN. */
export function parseNumOr(value: string | number | null | undefined, fallback: number): number {
  const n = parseNum(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Resolve a student by a name spoken or typed by the coach / the AI.
 * A bare `.find(s => s.name.includes(query))` returns whichever student
 * happens to sit first in the array, so with both "Ana" and "Ana Maria"
 * on the roster a plan could be written to the wrong athlete.
 *
 * Priority: exact match -> unique prefix -> unique substring.
 * Returns null when the query is genuinely ambiguous, so the caller can
 * ask the coach to disambiguate instead of guessing.
 */
export function resolveStudentByName<T extends { id: string; name: string }>(
  query: string,
  students: T[]
): { match: T | null; ambiguous: T[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { match: null, ambiguous: [] };

  const exact = students.filter((s) => s.name.trim().toLowerCase() === q);
  if (exact.length === 1) return { match: exact[0], ambiguous: [] };
  if (exact.length > 1) return { match: null, ambiguous: exact };

  const prefix = students.filter((s) => s.name.trim().toLowerCase().startsWith(q));
  if (prefix.length === 1) return { match: prefix[0], ambiguous: [] };
  if (prefix.length > 1) return { match: null, ambiguous: prefix };

  const partial = students.filter((s) => s.name.toLowerCase().includes(q));
  if (partial.length === 1) return { match: partial[0], ambiguous: [] };
  return { match: null, ambiguous: partial };
}
