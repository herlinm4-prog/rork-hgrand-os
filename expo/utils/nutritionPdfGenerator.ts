import { NutritionPlan, NutritionDay, Student, Meal, FoodItem, CardioSection, MealObjective, MEAL_OBJECTIVE_LABELS } from '@/types';
import { DocumentSettings } from '@/types/settings';

// ── Unit conversion ───────────────────────────────────────────
const G_TO_OZ = 1 / 28.3495;

function formatQuantity(grams: number, isImperial: boolean): string {
  if (isImperial) {
    const oz = grams * G_TO_OZ;
    return `${oz.toFixed(1)} oz`;
  }
  return `${grams} g`;
}

function getWeightLabel(food: FoodItem, isImperial: boolean): string {
  const qty = formatQuantity(food.quantity, isImperial);
  if (food.weightType === 'dry') {
    return `${qty} en seco`;
  }
  return `${qty} cocido`;
}

// ── Logo HTML ──────────────────────────────────────────────────
function getLogoSizePx(size: string): number {
  switch (size) {
    case 'small': return 48;
    case 'medium': return 72;
    case 'large': return 110;
    default: return 72;
  }
}

function getLogoAlignment(position: string): string {
  if (position.includes('left')) return 'flex-start';
  if (position.includes('right')) return 'flex-end';
  return 'center';
}

function buildLogoHtml(settings: DocumentSettings): string {
  if (!settings.includeLogo || !settings.logoUri) return '';
  const sizePx = getLogoSizePx(settings.logoSize);
  const align = getLogoAlignment(settings.logoPosition);
  const opacity = (settings.logoOpacity ?? 100) / 100;
  const shape = settings.logoShape === 'circle' ? '50%' : settings.logoShape === 'rounded' ? '12px' : '0';

  return `
    <div style="text-align:${align};margin-bottom:20px;">
      <img src="${settings.logoUri}" style="width:${sizePx}px;height:${sizePx}px;object-fit:contain;opacity:${opacity};border-radius:${shape};" />
    </div>
  `;
}

// ── Meal objective descriptions ────────────────────────────────
function getObjectiveDescription(objective?: MealObjective, customText?: string): string {
  if (customText) return customText;
  if (!objective) return '';
  const descriptions: Record<MealObjective, string> = {
    pre_entreno: 'Maximizar rendimiento y disponibilidad energética durante el entrenamiento.',
    post_entreno: 'Maximizar recuperación y utilización de glucosa post entrenamiento.',
    recuperacion: 'Optimizar la síntesis proteica y la reposición de glucógeno.',
    sensibilidad_insulina: 'Mejorar la sensibilidad a la insulina y la partición de nutrientes.',
    estabilidad_glucemica: 'Mantener niveles estables de glucosa en sangre durante el día.',
    rendimiento: 'Proveer energía sostenida para máximo rendimiento físico y mental.',
    soporte_anabolico: 'Mantener un balance nitrogenado positivo y ambiente anabólico.',
    saciedad: 'Controlar el apetito y mantener la adherencia al déficit calórico.',
    control_inflamatorio: 'Reducir inflamación sistémica y mejorar la recuperación celular.',
    densidad_calorica: 'Alta densidad de nutrientes en volumen reducido para facilitar el superávit.',
    ayuno: 'Respetar el período de ayuno para optimizar la sensibilidad a la insulina matutina.',
    recarga_glucogeno: 'Reponer reservas de glucógeno muscular y hepático para la siguiente sesión.',
    equilibrio_hormonal: 'Proveer ácidos grasos esenciales para la producción hormonal óptima.',
    sueno: 'Facilitar la recuperación nocturna y la producción de hormona de crecimiento.',
  };
  return descriptions[objective] || '';
}

// ── Cardio HTML ─────────────────────────────────────────────────
function buildCardioHtml(cardio: CardioSection): string {
  if (!cardio.enabled) return '';
  const timingLabels: Record<string, string> = {
    post_entreno: 'post entrenamiento',
    ayunas: 'en ayunas',
    any: 'cualquier momento',
  };

  const lines: string[] = [];
  lines.push(`<span class="food-qty">• ${cardio.durationMinutes} minutos</span><span class="food-name">${cardio.type || 'Cardio'}</span>`);

  if (cardio.heartRateMin && cardio.heartRateMax) {
    lines.push(`<span class="food-qty">• ${cardio.heartRateMin}–${cardio.heartRateMax} bpm</span><span class="food-name">Zona de frecuencia cardíaca</span>`);
  }
  lines.push(`<span class="food-qty">• ${cardio.frequencyPerWeek}x semana</span><span class="food-name">Frecuencia — ${timingLabels[cardio.timing] || cardio.timing}</span>`);
  if (cardio.notes) {
    lines.push(`<span class="food-qty">•</span><span class="food-name" style="font-style:italic;">${cardio.notes}</span>`);
  }

  return `
    <div class="section-block">
      <div class="section-title section-title-cardio">CARDIO</div>
      ${lines.map(l => `<div class="food-line">${l}</div>`).join('')}
    </div>
  `;
}

// ── MAIN GENERATOR ──────────────────────────────────────────────
export function generateHgrandNutritionPdfHtml(
  student: Student,
  plan: NutritionPlan,
  docSettings: DocumentSettings
): string {
  const isImperial = plan.unitSystem === 'imperial';
  const unitLabel = isImperial ? 'oz' : 'g';

  // ── Use days if provided, otherwise build from plan directly ──
  const planDays: NutritionDay[] = plan.days && plan.days.length > 0
    ? plan.days
    : [{
        id: '1',
        dayNumber: 1,
        title: '',
        subtitle: '',
        objectives: {
          calories: plan.calories,
          protein: plan.protein,
          carbs: plan.carbs,
          fats: plan.fats,
        },
        hydration: {
          waterLiters: plan.waterTarget ? `${plan.waterTarget}` : '',
          salt: plan.sodiumTarget ? `${plan.sodiumTarget}mg` : '',
        },
        meals: plan.meals,
      }];

  // ── Settings-derived values ──
  const margin = docSettings.pdfMargin === 'compact' ? '32px 24px' : '48px 40px';
  const pageBg = docSettings.pageBgColor === 'light-gray' ? '#F5F5F7' : docSettings.pageBgColor === 'warm-white' ? '#FAF8F5' : '#FFFFFF';
  const fontScale = (docSettings.docFontScale ?? 100) / 100;
  const headingScale = (docSettings.headingScale ?? 100) / 100;

  // ── HGRAND color palette ──
  const deepBlack = '#1A1A1A';
  const softBlack = '#2D2D2D';
  const mealGreen = '#1B5E38';
  const mealGreenLight = '#2D8C5A';
  const sectionGray = '#8A8A8E';
  const objectiveGray = '#9A9A9E';
  const dividerGray = '#E5E5EA';
  const headerBg = '#F3F3F5';
  const cardioAccent = '#4A4A4E';

  // ── Logo ──
  const logoHtml = buildLogoHtml(docSettings);

  // ── Date ──
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ── HEADER ────────────────────────────────────────────────────
  const titleText = plan.title || 'PLAN NUTRICIONAL';
  const weightLine = plan.currentWeight
    ? `${plan.currentWeight} ${isImperial ? 'lb' : 'kg'}`
    : student.weight
      ? `${student.weight} ${isImperial ? 'lb' : 'kg'}`
      : '';
  const goalLine = plan.weeklyGoal || '';
  const strategyLine = plan.metabolicStrategy || '';

  // ── Live-calculated totals across all days/meals (mirrors the draft card) ──
  const allMeals = planDays.flatMap(d => d.meals);
  const liveTotals = allMeals.reduce((acc, m) => {
    m.foods.forEach(f => {
      acc.calories += (f.calories || 0);
      acc.protein += (f.protein || 0);
      acc.carbs += (f.carbs || 0);
      acc.fats += (f.fats || 0);
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  const liveCal = Math.round(liveTotals.calories);
  const livePro = Math.round(liveTotals.protein * 10) / 10;
  const liveCarb = Math.round(liveTotals.carbs * 10) / 10;
  const liveFat = Math.round(liveTotals.fats * 10) / 10;

  // ── Global macro summary (target vs actual) ──
  const targetCal = plan.calories || 0;
  const targetPro = plan.protein || 0;
  const targetCarb = plan.carbs || 0;
  const targetFat = plan.fats || 0;
  const deltaColor = (delta: number) => Math.abs(delta) < 5 ? '#1B5E38' : delta > 0 ? '#B85C00' : '#8B1A1A';
  const fmtDelta = (d: number) => `${d > 0 ? '+' : ''}${Math.round(d * 10) / 10}`;

  const macroSummaryHtml = (targetCal || targetPro || targetCarb || targetFat) ? `
    <div class="global-macros">
      <div class="gm-row">
        <div class="gm-cell"><div class="gm-label">CALORÍAS</div><div class="gm-actual">${liveCal}</div><div class="gm-target">/ ${targetCal}</div><div class="gm-delta" style="color:${deltaColor(liveCal - targetCal)};">${fmtDelta(liveCal - targetCal)}</div></div>
        <div class="gm-cell"><div class="gm-label">PROTEÍNA ${unitLabel.toUpperCase()}</div><div class="gm-actual">${livePro}</div><div class="gm-target">/ ${targetPro}</div><div class="gm-delta" style="color:${deltaColor(livePro - targetPro)};">${fmtDelta(livePro - targetPro)}</div></div>
        <div class="gm-cell"><div class="gm-label">CARBS ${unitLabel.toUpperCase()}</div><div class="gm-actual">${liveCarb}</div><div class="gm-target">/ ${targetCarb}</div><div class="gm-delta" style="color:${deltaColor(liveCarb - targetCarb)};">${fmtDelta(liveCarb - targetCarb)}</div></div>
        <div class="gm-cell"><div class="gm-label">GRASAS ${unitLabel.toUpperCase()}</div><div class="gm-actual">${liveFat}</div><div class="gm-target">/ ${targetFat}</div><div class="gm-delta" style="color:${deltaColor(liveFat - targetFat)};">${fmtDelta(liveFat - targetFat)}</div></div>
      </div>
      <div class="gm-subtitle">Totales calculados del plan editado · objetivo diario</div>
    </div>
  ` : '';

  const headerHtml = `
    <div class="doc-header">
      ${logoHtml}
      <h1 class="doc-title">${titleText}</h1>
      <div class="header-divider"></div>
      ${weightLine ? `<div class="doc-weight">${weightLine} — Peso actual</div>` : ''}
      ${goalLine ? `<div class="doc-goal">${goalLine}</div>` : ''}
      ${strategyLine ? `<div class="doc-strategy">Estrategia: ${strategyLine}</div>` : ''}
      <div class="doc-date">${dateStr}</div>
    </div>
    ${macroSummaryHtml}
  `;

  // ── DAYS ──────────────────────────────────────────────────────
  const daysHtml = planDays.map((day, dayIdx) => {
    const dayTitleHtml = planDays.length > 1 ? `
      <div class="day-divider">
        <h2 class="day-title">${day.title || `DÍA ${day.dayNumber}`}${day.subtitle ? ` — ${day.subtitle}` : ''}</h2>
      </div>
    ` : '';

    // ── Macro summary ──
    const hasMacros = day.objectives.calories || day.objectives.protein || day.objectives.carbs || day.objectives.fats;
    const macrosHtml = hasMacros ? `
      <div class="macro-summary">
        <div class="macro-label">OBJETIVO DIARIO</div>
        <div class="macro-values">
          ${day.objectives.calories ? `<span class="macro-chip">${day.objectives.calories} kcal</span>` : ''}
          ${day.objectives.protein ? `<span class="macro-chip macro-chip-p">P: ${day.objectives.protein}${unitLabel}</span>` : ''}
          ${day.objectives.carbs ? `<span class="macro-chip macro-chip-c">C: ${day.objectives.carbs}${unitLabel}</span>` : ''}
          ${day.objectives.fats ? `<span class="macro-chip macro-chip-f">G: ${day.objectives.fats}${unitLabel}</span>` : ''}
        </div>
      </div>
    ` : '';

    // ── Hydration ──
    const hydrationHtml = (day.hydration.waterLiters || day.hydration.salt) ? `
      <div class="hydration-row">
        ${day.hydration.waterLiters ? `<span class="hydration-item">${day.hydration.waterLiters} L agua</span>` : ''}
        ${day.hydration.salt ? `<span class="hydration-item">Sal: ${day.hydration.salt}</span>` : ''}
        ${day.hydration.notes ? `<span class="hydration-note">${day.hydration.notes}</span>` : ''}
      </div>
    ` : '';

    // ── MEALS ──────────────────────────────────────────────────
    const mealsHtml = day.meals.map((meal, mi) => {
      // Per-meal totals (live-calculated, mirrors the draft card)
      const mTotals = meal.foods.reduce((acc, f) => ({
        calories: acc.calories + (f.calories || 0),
        protein: acc.protein + (f.protein || 0),
        carbs: acc.carbs + (f.carbs || 0),
        fats: acc.fats + (f.fats || 0),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

      const foodsHtml = meal.foods.map(f => {
        const qtyText = getWeightLabel(f, isImperial);
        const macrosLine = `${f.calories || 0} kcal · ${Math.round((f.protein || 0) * 10) / 10}p · ${Math.round((f.carbs || 0) * 10) / 10}c · ${Math.round((f.fats || 0) * 10) / 10}g`;
        return `<div class="food-line"><span class="food-bullet">•</span><span class="food-qty">${qtyText}</span><span class="food-name">${f.name}</span><span class="food-macros">${macrosLine}</span></div>`;
      }).join('');

      const objectiveDesc = getObjectiveDescription(meal.objective, meal.objectiveText);
      const objectiveHtml = objectiveDesc ? `<div class="meal-objective"><span class="obj-label">Objetivo:</span> ${objectiveDesc}</div>` : '';

      const mealTotalsHtml = meal.foods.length > 0 ? `
        <div class="meal-totals">
          <span class="totals-label">TOTAL COMIDA</span>
          <span class="totals-chip totals-kcal">${Math.round(mTotals.calories)} kcal</span>
          <span class="totals-chip totals-p">P ${Math.round(mTotals.protein * 10) / 10}${unitLabel}</span>
          <span class="totals-chip totals-c">C ${Math.round(mTotals.carbs * 10) / 10}${unitLabel}</span>
          <span class="totals-chip totals-g">G ${Math.round(mTotals.fats * 10) / 10}${unitLabel}</span>
        </div>
      ` : '';

      return `
        <div class="meal-block">
          <div class="meal-title">${meal.name || `COMIDA ${mi + 1}`}${meal.time ? ` — ${meal.time}` : ''}</div>
          <div class="meal-foods">
            ${foodsHtml}
          </div>
          ${mealTotalsHtml}
          ${objectiveHtml}
        </div>
      `;
    }).join('');

    return `
      <div class="day-section">
        ${dayTitleHtml}
        ${macrosHtml}
        ${hydrationHtml}
        <div class="meals-container">
          ${mealsHtml}
        </div>
      </div>
    `;
  }).join('');

  // ── CARDIO ────────────────────────────────────────────────────
  const cardioHtml = plan.cardio?.enabled ? buildCardioHtml(plan.cardio) : '';

  // ── SUPPLEMENTS ───────────────────────────────────────────────
  const supplementsHtml = plan.supplements.length > 0 ? `
    <div class="section-block">
      <div class="section-title section-title-supp">SUPLEMENTACIÓN</div>
      ${plan.supplements.map(s => `
        <div class="food-line">
          <span class="food-bullet">•</span>
          <span class="food-qty">${s.dosage || ''}</span>
          <span class="food-name">${s.name}${s.timing ? ` — ${s.timing}` : ''}</span>
        </div>
        ${s.notes ? `<div class="supplement-note">${s.notes}</div>` : ''}
      `).join('')}
    </div>
  ` : '';

  // ── NOTES ─────────────────────────────────────────────────────
  const notesLines = plan.notes ? plan.notes.split('\n').filter(l => l.trim()) : [];
  const notesHtml = notesLines.length > 0 ? `
    <div class="section-block">
      <div class="section-title section-title-notes">INDICACIONES ADICIONALES</div>
      ${notesLines.map(line => `<div class="food-line"><span class="food-bullet">•</span><span class="food-name">${line.trim()}</span></div>`).join('')}
    </div>
  ` : '';

  // ── DISCLAIMER ────────────────────────────────────────────────
  const disclaimerHtml = docSettings.includeDisclaimer ? `
    <div class="disclaimer">
      Este plan nutricional es personalizado y ha sido diseñado bajo criterios profesionales. Ante cualquier condición médica, consulte con su profesional de la salud.
    </div>
  ` : '';

  // ── SIGNATURE ─────────────────────────────────────────────────
  const signatureHtml = docSettings.addSignatureBlock ? `
    <div class="signature-block">
      <div class="sig-line"><div class="sig-rule"></div><span>${docSettings.coachName || 'Preparador'}</span></div>
      <div class="sig-line"><div class="sig-rule"></div><span>Fecha</span></div>
    </div>
  ` : '';

  // ── FOOTER ────────────────────────────────────────────────────
  const footerHtml = docSettings.footerEnabled && docSettings.footerText ? `
    <div class="custom-footer">${docSettings.footerText}</div>
  ` : '';

  const fullTitleSize = Math.round(22 * fontScale * headingScale);
  const mealTitleSize = Math.round(14 * fontScale * headingScale);
  const bodySize = Math.round(13 * fontScale);
  const smallSize = Math.round(10 * fontScale);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif;
      padding: ${margin};
      color: ${softBlack};
      line-height: 1.6;
      background: ${pageBg};
      font-size: ${bodySize}px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      -webkit-font-smoothing: antialiased;
    }

    /* ── HEADER ────────────────────────────────────────── */
    .doc-header {
      text-align: center;
      margin-bottom: 36px;
      padding: 36px 32px 28px;
      background: ${headerBg};
      border-radius: 12px;
    }
    .doc-title {
      font-size: ${fullTitleSize}px;
      font-weight: 800;
      color: ${deepBlack};
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 14px;
      line-height: 1.2;
    }
    .header-divider {
      width: 40px;
      height: 3px;
      background: ${mealGreen};
      margin: 0 auto 14px;
      border-radius: 2px;
    }
    .doc-weight {
      font-size: ${bodySize}px;
      font-weight: 600;
      color: ${softBlack};
      margin-bottom: 4px;
    }
    .doc-goal {
      font-size: ${Math.round(12 * fontScale)}px;
      font-weight: 500;
      color: #666;
      margin-bottom: 4px;
    }
    .doc-strategy {
      font-size: ${smallSize}px;
      font-weight: 400;
      color: #999;
      font-style: italic;
      margin-bottom: 8px;
    }
    .doc-date {
      font-size: ${smallSize}px;
      color: #AAA;
      margin-top: 6px;
    }

    /* ── GLOBAL MACRO SUMMARY ───────────────────────────── */
    .global-macros {
      margin-bottom: 32px;
      padding: 18px 22px;
      background: #F8F8FA;
      border-radius: 10px;
      border: 1px solid #ECECEF;
    }
    .gm-row {
      display: flex;
      gap: 10px;
    }
    .gm-cell {
      flex: 1;
      text-align: center;
      padding: 8px 6px;
      border-radius: 8px;
      background: #FFFFFF;
      border: 1px solid #ECECEF;
    }
    .gm-label {
      font-size: ${Math.round(9 * fontScale)}px;
      font-weight: 700;
      color: ${sectionGray};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .gm-actual {
      font-size: ${Math.round(20 * fontScale)}px;
      font-weight: 800;
      color: ${deepBlack};
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .gm-target {
      font-size: ${Math.round(10 * fontScale)}px;
      color: #AAA;
      font-weight: 500;
      margin-top: 4px;
    }
    .gm-delta {
      font-size: ${Math.round(10 * fontScale)}px;
      font-weight: 700;
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .gm-subtitle {
      margin-top: 10px;
      font-size: ${Math.round(9.5 * fontScale)}px;
      color: #B0B0B5;
      text-align: center;
      font-style: italic;
      letter-spacing: 0.3px;
    }

    /* ── DAY ────────────────────────────────────────────── */
    .day-section {
      margin-bottom: 8px;
    }
    .day-divider {
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${dividerGray};
    }
    .day-title {
      font-size: ${Math.round(16 * fontScale * headingScale)}px;
      font-weight: 700;
      color: ${deepBlack};
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── MACRO SUMMARY ──────────────────────────────────── */
    .macro-summary {
      margin-bottom: 24px;
      padding: 16px 20px;
      background: #F8F8FA;
      border-radius: 8px;
      border-left: 3px solid ${mealGreenLight};
    }
    .macro-label {
      font-size: ${smallSize}px;
      font-weight: 700;
      color: ${sectionGray};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    .macro-values {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .macro-chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: ${Math.round(12 * fontScale)}px;
      font-weight: 700;
      color: ${softBlack};
      background: #EBEBF0;
    }
    .macro-chip-p { color: #1B5E38; background: #E8F5EC; }
    .macro-chip-c { color: #B85C00; background: #FFF4E6; }
    .macro-chip-f { color: #8B1A1A; background: #FDE8E8; }

    /* ── HYDRATION ──────────────────────────────────────── */
    .hydration-row {
      margin-bottom: 20px;
      padding: 10px 16px;
      background: #F0FAF5;
      border-radius: 6px;
      border-left: 2px solid #14614A;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: ${Math.round(12 * fontScale)}px;
      color: #14614A;
    }
    .hydration-item { font-weight: 600; }
    .hydration-note { font-style: italic; color: #888; }

    /* ── MEALS ──────────────────────────────────────────── */
    .meals-container {
      /* dynamic spacing */
    }
    .meal-block {
      margin-bottom: 26px;
      page-break-inside: avoid;
    }
    .meal-title {
      font-size: ${mealTitleSize}px;
      font-weight: 800;
      color: ${mealGreen};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
      padding-bottom: 6px;
    }
    .meal-foods {
      padding-left: 4px;
    }
    .food-line {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 4px 0;
      font-size: ${bodySize}px;
      color: ${softBlack};
    }
    .food-bullet {
      color: ${mealGreen};
      font-weight: 600;
      font-size: ${Math.round(18 * fontScale)}px;
      line-height: 1;
      flex-shrink: 0;
      width: 14px;
      text-align: center;
    }
    .food-qty {
      color: #555;
      font-size: ${Math.round(12 * fontScale)}px;
      font-weight: 600;
      min-width: 70px;
      flex-shrink: 0;
    }
    .food-name {
      color: ${deepBlack};
      font-weight: 600;
      flex: 1;
    }
    .food-macros {
      font-size: ${Math.round(10.5 * fontScale)}px;
      color: ${objectiveGray};
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.2px;
      flex-shrink: 0;
      text-align: right;
      min-width: 130px;
    }

    /* ── MEAL TOTALS BAR ────────────────────────────────── */
    .meal-totals {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 10px;
      padding: 8px 14px;
      background: #F6F6F8;
      border-radius: 6px;
      border-left: 3px solid ${mealGreenLight};
    }
    .totals-label {
      font-size: ${Math.round(9 * fontScale)}px;
      font-weight: 700;
      color: ${sectionGray};
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-right: auto;
    }
    .totals-chip {
      font-size: ${Math.round(11 * fontScale)}px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      font-variant-numeric: tabular-nums;
    }
    .totals-kcal { color: #B85C00; background: #FFF4E6; }
    .totals-p    { color: #1B5E38; background: #E8F5EC; }
    .totals-c    { color: #1B5E38; background: #E8F5EC; }
    .totals-g    { color: #8B1A1A; background: #FDE8E8; }

    /* ── MEAL OBJECTIVE ─────────────────────────────────── */
    .meal-objective {
      margin-top: 8px;
      padding: 8px 14px;
      background: #F9F9FB;
      border-radius: 6px;
      font-size: ${smallSize}px;
      color: ${objectiveGray};
      font-style: italic;
      line-height: 1.5;
      border-left: 2px solid #E0E0E5;
    }
    .obj-label {
      font-style: normal;
      font-weight: 700;
      color: ${sectionGray};
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-size: ${Math.round(9 * fontScale)}px;
    }

    /* ── SECTION TITLES ─────────────────────────────────── */
    .section-block {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: ${Math.round(12 * fontScale * headingScale)}px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${deepBlack};
      color: ${deepBlack};
    }
    .section-title-cardio {
      color: ${cardioAccent};
    }
    .section-title-supp {
      color: ${mealGreen};
    }
    .section-title-notes {
      color: ${softBlack};
    }

    .supplement-note {
      font-size: ${smallSize}px;
      color: #888;
      font-style: italic;
      margin-left: 22px;
      margin-top: 2px;
      margin-bottom: 6px;
    }

    /* ── SIGNATURE ──────────────────────────────────────── */
    .signature-block {
      margin-top: 44px;
      padding-top: 20px;
      border-top: 1px solid ${dividerGray};
      display: flex;
      justify-content: space-between;
      gap: 48px;
    }
    .sig-line { flex: 1; text-align: center; }
    .sig-rule {
      border-bottom: 1px solid #999;
      height: 36px;
      margin-bottom: 6px;
    }
    .sig-line span {
      font-size: ${smallSize}px;
      color: #999;
      font-weight: 500;
    }

    /* ── DISCLAIMER ─────────────────────────────────────── */
    .disclaimer {
      margin-top: 28px;
      padding: 12px 16px;
      background: #FAFAFA;
      border-radius: 6px;
      border: 1px solid #EBEBEB;
      font-size: ${smallSize}px;
      color: #BBB;
      line-height: 1.6;
      text-align: center;
    }

    /* ── FOOTER ─────────────────────────────────────────── */
    .custom-footer {
      margin-top: 24px;
      text-align: center;
      font-size: ${smallSize}px;
      color: #BBB;
    }
  </style>
</head>
<body>
  ${headerHtml}
  ${daysHtml}
  ${supplementsHtml}
  ${notesHtml}
  ${cardioHtml}
  ${signatureHtml}
  ${disclaimerHtml}
  ${footerHtml}
</body>
</html>`;
}
