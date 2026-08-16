import { ActivityLevel, ACTIVITY_MULTIPLIERS } from '@/types';

export function calculateBMR(
  weight: number,
  bodyFatPercentage: number
): number {
  const leanMass = weight * (1 - bodyFatPercentage / 100);
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
  const fatCals = Math.round(calories * 0.25);
  const fats = Math.round(fatCals / 9);
  const carbsCals = calories - proteinCals - fatCals;
  const carbs = Math.round(carbsCals / 4);

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
