import { Skinfolds9 } from '@/types';

export const PARRILLO_VERSION = 'parrillo_9_v1';

export interface ParrilloCoefficients {
  male: number;
  female: number;
}

const DEFAULT_COEFFICIENTS: ParrilloCoefficients = {
  male: 27,
  female: 27,
};

export interface ParrilloResult {
  sum9: number;
  bodyFatPercent: number;
  version: string;
}

export function calculateParrillo9(
  sex: 'male' | 'female',
  skinfolds: Skinfolds9,
  customCoefficients?: ParrilloCoefficients
): ParrilloResult {
  const coefficients = customCoefficients ?? DEFAULT_COEFFICIENTS;
  const divisor = coefficients[sex];

  const sum9 =
    skinfolds.chest +
    skinfolds.abdomen +
    skinfolds.thigh +
    skinfolds.triceps +
    skinfolds.subscapular +
    skinfolds.suprailiac +
    skinfolds.lowerBack +
    skinfolds.calf +
    skinfolds.biceps;

  const bodyFatPercent = Math.round((sum9 / divisor) * 100) / 100;

  console.log('[Parrillo] sex:', sex, 'sum9:', sum9, 'divisor:', divisor, 'bf%:', bodyFatPercent);

  return {
    sum9,
    bodyFatPercent,
    version: PARRILLO_VERSION,
  };
}

export const SKINFOLD_LABELS: Record<keyof Skinfolds9, { es: string; en: string; hint: string }> = {
  chest: {
    es: 'Pectoral',
    en: 'Chest',
    hint: 'Pliegue diagonal entre axila y pezón',
  },
  abdomen: {
    es: 'Abdomen',
    en: 'Abdomen',
    hint: 'Pliegue vertical a 2cm del ombligo',
  },
  thigh: {
    es: 'Muslo',
    en: 'Thigh',
    hint: 'Pliegue vertical en la parte frontal del muslo',
  },
  triceps: {
    es: 'Tríceps',
    en: 'Triceps',
    hint: 'Pliegue vertical en la parte posterior del brazo',
  },
  subscapular: {
    es: 'Subescapular',
    en: 'Subscapular',
    hint: 'Pliegue diagonal debajo de la escápula',
  },
  suprailiac: {
    es: 'Suprailíaco',
    en: 'Suprailiac',
    hint: 'Pliegue diagonal sobre la cresta ilíaca',
  },
  lowerBack: {
    es: 'Espalda baja',
    en: 'Lower Back',
    hint: 'Pliegue horizontal en la zona lumbar',
  },
  calf: {
    es: 'Pantorrilla',
    en: 'Calf',
    hint: 'Pliegue vertical en la parte medial de la pantorrilla',
  },
  biceps: {
    es: 'Bíceps',
    en: 'Biceps',
    hint: 'Pliegue vertical en la parte frontal del brazo',
  },
};

export const SKINFOLD_KEYS: (keyof Skinfolds9)[] = [
  'chest',
  'abdomen',
  'thigh',
  'triceps',
  'subscapular',
  'suprailiac',
  'lowerBack',
  'calf',
  'biceps',
];

export function validateSkinfold(value: number): { valid: boolean; warning: string | null } {
  if (value < 1) return { valid: true, warning: 'Valor muy bajo (<1mm)' };
  if (value > 80) return { valid: true, warning: 'Valor muy alto (>80mm)' };
  return { valid: true, warning: null };
}
