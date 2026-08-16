// utils/healthMonitoring.ts
// Client-side health monitoring utilities for athletes.
// Backend engine runs server-side; this provides local analysis helpers.

import type {
  Student,
  BloodPanelCategory,
  BloodPanelUrgency,
  HealthAlertType,
  Supplement,
} from "@/types";
import { SUPPLEMENT_MONITORING_MAP } from "@/types";

/** Detects if an athlete needs blood work based on local data snapshot. */
export function getPendingHealthChecks(
  student: Student
): {
  category: BloodPanelCategory;
  reason: string;
  urgency: BloodPanelUrgency;
  basedOn: string[];
}[] {
  const checks: {
    category: BloodPanelCategory;
    reason: string;
    urgency: BloodPanelUrgency;
    basedOn: string[];
  }[] = [];

  const ciCount = student.checkIns.length;
  const goal = student.goal;

  // 1. Supplement-driven
  const supps: Supplement[] = student.nutritionPlan?.supplements ?? [];
  for (const supp of supps) {
    const suppName = (supp.name ?? "").toLowerCase();
    const monitoring = findSupplementMonitoring(suppName);
    if (!monitoring) continue;
    for (const panel of monitoring.panels as BloodPanelCategory[]) {
      checks.push({
        category: panel,
        reason: monitoring.reason,
        urgency: "recommended",
        basedOn: [`Suplemento: ${suppName}`],
      });
    }
  }

  // 2. Prolonged plan without blood work
  if (ciCount >= 8 && student.nutritionPlan) {
    checks.push({
      category: "metabolic_panel",
      reason: `Plan activo durante ${ciCount}+ semanas sin perfil metabólico registrado.`,
      urgency: goal === "competition" ? "urgent" : "recommended",
      basedOn: [`${ciCount} semanas con plan`, `Objetivo: ${goal}`],
    });
  }

  // 3. Prolonged cutting
  if (goal === "lose_fat" && ciCount >= 12) {
    checks.push({
      category: "thyroid_panel",
      reason:
        "Déficit calórico prolongado (>12 semanas). Monitoreo tiroideo para descartar supresión metabólica.",
      urgency: "urgent",
      basedOn: ["Déficit >12 semanas", "Riesgo de supresión tiroidea"],
    });
  }

  // 4. Competition prep
  if (goal === "competition" && ciCount >= 8) {
    checks.push({
      category: "hormonal_panel",
      reason:
        "Fase de competición: perfil hormonal completo recomendado para peak week.",
      urgency: "urgent",
      basedOn: ["Competición", "Peak week"],
    });
  }

  return checks;
}

/** Analyzes check-in trends for metabolic concern signals. */
export function getMetabolicConcernSignals(
  student: Student
): {
  type: HealthAlertType;
  title: string;
  description: string;
  recommendation: string;
}[] {
  const signals: {
    type: HealthAlertType;
    title: string;
    description: string;
    recommendation: string;
  }[] = [];
  const checkIns = student.checkIns;
  if (checkIns.length < 3) return signals;

  const recent6 = checkIns.slice(-6);

  // Low energy
  const energies = recent6
    .filter((c) => c.energyLevel != null)
    .map((c) => c.energyLevel!);
  if (
    energies.length >= 3 &&
    energies.reduce((a, b) => a + b, 0) / energies.length < 4
  ) {
    signals.push({
      type: "metabolic_concern",
      title: "Energía persistentemente baja",
      description: `${student.name} reporta niveles de energía por debajo de 4/10. Posible déficit excesivo, deficiencia de micronutrientes o disrupción tiroidea.`,
      recommendation:
        "Perfil tiroideo (TSH, T3, T4) + perfil metabólico completo recomendado.",
    });
  }

  // Poor sleep
  const sleeps = recent6
    .filter((c) => c.sleepHours != null)
    .map((c) => c.sleepHours!);
  if (
    sleeps.length >= 3 &&
    sleeps.reduce((a, b) => a + b, 0) / sleeps.length < 6
  ) {
    signals.push({
      type: "hormonal_imbalance",
      title: "Sueño insuficiente",
      description: `${student.name} promedia <6h de sueño. Cortisol elevado y reducción de GH/testosterona comprometen resultados.`,
      recommendation:
        "Cortisol salival (4 puntos) + DHEA-S. Implementar higiene del sueño.",
    });
  }

  // Poor digestion
  const digestives = recent6
    .filter((c) => c.digestiveHealth != null)
    .map((c) => c.digestiveHealth!);
  if (
    digestives.length >= 3 &&
    digestives.reduce((a, b) => a + b, 0) / digestives.length < 4
  ) {
    signals.push({
      type: "organ_stress",
      title: "Salud digestiva baja",
      description: `${student.name} reporta digestión consistentemente deteriorada. Posible disbiosis o intolerancia alimentaria.`,
      recommendation:
        "Microbiota intestinal (PCR) + zonulina. Eliminación de lácteos/gluten 14 días.",
    });
  }

  return signals;
}

/** Lightweight local supplement-to-monitoring lookup for client-side use. */
function findSupplementMonitoring(
  name: string
): { panels: string[]; intervalWeeks: number; reason: string } | null {
  for (const [key, value] of Object.entries(SUPPLEMENT_MONITORING_MAP)) {
    if (name.includes(key)) return value;
  }
  return null;
}
