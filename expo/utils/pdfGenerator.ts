import { NutritionPlan, NutritionDay, Student, TrainingPlan } from '@/types';
import { DocumentSettings, LogoPosition, LogoSize, LogoShape, LogoBorderStyle, RequiredTip } from '@/types/settings';

function getLogoSizePx(size: LogoSize): number {
  switch (size) {
    case 'small': return 48;
    case 'medium': return 72;
    case 'large': return 110;
  }
}

function getLogoAlignment(position: LogoPosition): string {
  if (position.includes('left')) return 'flex-start';
  if (position.includes('right')) return 'flex-end';
  return 'center';
}

function isLogoOnTop(position: LogoPosition): boolean {
  return position.startsWith('top');
}

function getLogoShapeStyles(shape: LogoShape, sizePx: number): string {
  switch (shape) {
    case 'circle': return `border-radius:${sizePx / 2}px;`;
    case 'rounded': return 'border-radius:12px;';
    case 'square': return 'border-radius:0;';
  }
}

function getLogoBorderStyles(border: LogoBorderStyle): string {
  switch (border) {
    case 'thin': return 'border:1px solid #D0D0D0;';
    case 'shadow': return 'box-shadow:0 2px 12px rgba(0,0,0,0.10);';
    case 'none': return '';
  }
}

function buildLogoHtml(settings: DocumentSettings): string {
  if (!settings.includeLogo || !settings.logoUri) return '';
  const sizePx = getLogoSizePx(settings.logoSize);
  const align = getLogoAlignment(settings.logoPosition);
  const opacity = settings.logoOpacity / 100;
  const shape = getLogoShapeStyles(settings.logoShape ?? 'square', sizePx);
  const border = getLogoBorderStyles(settings.logoBorder ?? 'none');
  const mb = settings.logoMarginBottom ?? 16;

  return `
    <div style="display:flex;justify-content:${align};align-items:center;margin-bottom:${mb}px;">
      <img src="${settings.logoUri}" style="width:${sizePx}px;height:${sizePx}px;object-fit:contain;opacity:${opacity};${shape}${border}" />
    </div>
  `;
}

function getFontStack(family: string): string {
  switch (family) {
    case 'inter': return "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";
    case 'roboto': return "'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif";
    default: return "'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif";
  }
}

function getLineHeight(spacing: string): string {
  switch (spacing) {
    case 'compact': return '1.35';
    case 'spacious': return '1.85';
    default: return '1.6';
  }
}

function getActiveTips(tips: RequiredTip[], planType?: string): RequiredTip[] {
  return tips.filter(t => {
    if (!t.enabled) return false;
    if (t.planTypes.length === 0 || t.planTypes.includes('all')) return true;
    if (planType) {
      const typeMap: Record<string, string> = {
        'cutting': 'cutting',
        'lose_fat': 'cutting',
        'bulking': 'bulking',
        'build_muscle': 'bulking',
        'peak_week': 'peak_week',
        'competition': 'peak_week',
        'carb_load': 'carb_load',
        'maintain': 'maintenance',
        'maintenance': 'maintenance',
        'recomp': 'maintenance',
      };
      const mapped = typeMap[planType] || planType;
      return t.planTypes.includes(mapped as RequiredTip['planTypes'][number]);
    }
    return true;
  });
}

export function generateNutritionPlanPdfHtml(
  student: Student,
  plan: NutritionPlan,
  docSettings: DocumentSettings
): string {
  const planDays = plan.days && plan.days.length > 0 ? plan.days : [{
    id: '1',
    dayNumber: 1,
    title: 'Día 1',
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

  const margin = docSettings.pdfMargin === 'compact' ? '24px 20px' : '40px 36px';
  const isColor = docSettings.pdfColorMode === 'color';
  const fontStack = getFontStack(docSettings.docFontFamily || 'system');
  const fontScale = (docSettings.docFontScale || 100) / 100;
  const lineH = getLineHeight(docSettings.docLineSpacing || 'standard');

  const greenAccent = isColor ? '#1B6B3A' : '#222';

  const redAccent = isColor ? '#9B1C1C' : '#222';
  const blueAccent = isColor ? '#1A4F7A' : '#222';
  const blueBg = isColor ? '#EBF5FB' : '#F6F6F6';
  const hydrationAccent = isColor ? '#14614A' : '#333';
  const hydrationBg = isColor ? '#F0FAF5' : '#F6F6F6';

  const topLogo = isLogoOnTop(docSettings.logoPosition) ? buildLogoHtml(docSettings) : '';
  const bottomLogo = !isLogoOnTop(docSettings.logoPosition) ? buildLogoHtml(docSettings) : '';

  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const showHeader = docSettings.headerStyle !== 'hidden';
  const showAthleteInfo = docSettings.showAthleteInfo !== false;
  const showCoachInfo = docSettings.showCoachInfo && docSettings.coachName;

  const headerHtml = showHeader ? `
    <div class="doc-header">
      ${topLogo}
      <h1 class="doc-title">${plan.title || 'PLAN NUTRICIONAL'}</h1>
      ${showAthleteInfo ? `<div class="doc-athlete">${student.name}</div>` : ''}
      ${showCoachInfo ? `<div class="doc-coach">Coach: ${docSettings.coachName}</div>` : ''}
      ${docSettings.headerStyle === 'full' ? `<div class="doc-date">${dateStr}</div>` : ''}
    </div>
  ` : `${topLogo}`;

  const daysHtml = planDays.map((day: NutritionDay) => {
    const hasMacros = day.objectives.calories || day.objectives.protein || day.objectives.carbs || day.objectives.fats;

    const dayTitleHtml = planDays.length > 1 ? `
      <div class="day-divider">
        <h2 class="day-title">${day.title}${day.subtitle ? ` — ${day.subtitle}` : ''}</h2>
      </div>
    ` : (day.subtitle ? `
      <div class="day-divider">
        <h2 class="day-title">${day.subtitle}</h2>
      </div>
    ` : '');

    const macrosHtml = hasMacros ? `
      <div class="section-block">
        <div class="section-title" style="color:${greenAccent};">OBJETIVO NUTRICIONAL</div>
        <div class="macros-row">
          ${day.objectives.carbs ? `<div class="macro-item"><span class="macro-bullet" style="background:${greenAccent};"></span>Carbohidratos totales: <strong>${day.objectives.carbs} g</strong></div>` : ''}
          ${day.objectives.protein ? `<div class="macro-item"><span class="macro-bullet" style="background:${greenAccent};"></span>Proteína: <strong>${day.objectives.protein} g</strong></div>` : ''}
          ${day.objectives.fats ? `<div class="macro-item"><span class="macro-bullet" style="background:${greenAccent};"></span>Grasas: <strong>${day.objectives.fats} g</strong></div>` : ''}
          ${day.objectives.calories ? `<div class="macro-item"><span class="macro-bullet" style="background:${greenAccent};"></span>Calorías: <strong>${day.objectives.calories} kcal</strong></div>` : ''}
        </div>
      </div>
    ` : '';

    const hydrationHtml = (day.hydration.waterLiters || day.hydration.salt) ? `
      <div class="section-block">
        <div class="section-title" style="color:${greenAccent};">HIDRATACIÓN Y ELECTROLITOS</div>
        <div class="hydration-content" style="background:${hydrationBg};border-left:3px solid ${hydrationAccent};">
          ${day.hydration.waterLiters ? `<div class="hydration-item"><span class="macro-bullet" style="background:${hydrationAccent};"></span>Litros de agua durante el día: <strong>${day.hydration.waterLiters} L</strong></div>` : ''}
          ${day.hydration.salt ? `<div class="hydration-item"><span class="macro-bullet" style="background:${hydrationAccent};"></span>Sal: <strong>${day.hydration.salt}</strong></div>` : ''}
          ${day.hydration.notes ? `<div class="hydration-note">${day.hydration.notes}</div>` : ''}
        </div>
      </div>
    ` : '';

    const mealsHtml = day.meals.length > 0 ? `
      <div class="section-block">
        <div class="section-title" style="color:${redAccent};">DISTRIBUCIÓN DE COMIDAS</div>
        ${day.meals.map((meal, mi) => {
          const foodLines = meal.foods.map(f => {
            const qty = f.quantity ? `${f.quantity} ${f.unit}` : '';
            return `<div class="food-line">${qty ? `<span class="food-qty">${qty}</span>` : ''}<span class="food-name">${f.name}</span></div>`;
          }).join('');

          return `
            <div class="meal-block">
              <div class="meal-title">${meal.name || `COMIDA ${mi + 1}`}${meal.time ? ` – ${meal.time}` : ''}</div>
              ${foodLines}
            </div>
          `;
        }).join('')}
      </div>
    ` : '';

    return `
      <div class="day-section">
        ${dayTitleHtml}
        ${macrosHtml}
        ${hydrationHtml}
        ${mealsHtml}
      </div>
    `;
  }).join('');

  const supplementsHtml = plan.supplements.length > 0 ? `
    <div class="section-block">
      <div class="section-title" style="color:${greenAccent};">SUPLEMENTACIÓN</div>
      ${plan.supplements.map(s => `
        <div class="supplement-item">
          <span class="macro-bullet" style="background:${greenAccent};"></span>
          <strong>${s.name}</strong>${s.dosage ? ` — ${s.dosage}` : ''}${s.timing ? ` (${s.timing})` : ''}
          ${s.notes ? `<div class="supplement-note">${s.notes}</div>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const notesLines = plan.notes ? plan.notes.split('\n').filter(l => l.trim()) : [];
  const notesHtml = notesLines.length > 0 ? `
    <div class="section-block">
      <div class="section-title" style="color:${blueAccent};">INDICACIONES Y MONITOREO</div>
      <div class="notes-content" style="background:${blueBg};border-left:3px solid ${blueAccent};">
        ${notesLines.map(line => `<div class="note-item"><span class="macro-bullet" style="background:${blueAccent};"></span>${line.trim()}</div>`).join('')}
      </div>
    </div>
  ` : '';

  const activeTips = docSettings.includeRequiredTips
    ? getActiveTips(docSettings.requiredTips || [], student.goal).filter(t => !t.excludedStudentIds.includes(student.id))
    : [];

  const tipsHtml = activeTips.length > 0 ? `
    <div class="section-block tips-section">
      <div class="section-title" style="color:${blueAccent};">CONSEJOS REQUERIDOS</div>
      <div class="tips-content" style="background:${blueBg};border-left:3px solid ${blueAccent};">
        ${activeTips.map(t => `<div class="tip-item"><span class="macro-bullet" style="background:${blueAccent};"></span>${t.text}</div>`).join('')}
      </div>
    </div>
  ` : '';

  const signatureHtml = docSettings.addSignatureBlock ? `
    <div class="signature-block">
      <div class="sig-line">
        <div class="sig-rule"></div>
        <span>Firma del Preparador</span>
      </div>
      <div class="sig-line">
        <div class="sig-rule"></div>
        <span>Fecha</span>
      </div>
    </div>
  ` : '';

  const disclaimerHtml = docSettings.includeDisclaimer ? `
    <div class="disclaimer">
      Este plan nutricional es orientativo y ha sido diseñado de forma personalizada.
      Ante cualquier duda o condición médica, consultar con un profesional de la salud.
    </div>
  ` : '';

  const footerHtml = docSettings.footerEnabled && docSettings.footerText ? `
    <div class="custom-footer">${docSettings.footerText}</div>
  ` : '';

  const pageNumberHtml = docSettings.showPageNumbers ? `
    <div class="page-number-hint">${dateStr}</div>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${fontStack};
      padding: ${margin};
      color: #2D2D2D;
      line-height: ${lineH};
      background: #fff;
      font-size: ${Math.round(13 * fontScale)}px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .doc-header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 2px solid #222;
    }
    .doc-title {
      font-size: ${Math.round(20 * fontScale)}px;
      font-weight: 800;
      color: #111;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .doc-athlete {
      font-size: ${Math.round(13 * fontScale)}px;
      font-weight: 500;
      color: #555;
      margin-bottom: 2px;
    }
    .doc-coach {
      font-size: ${Math.round(11 * fontScale)}px;
      font-weight: 400;
      color: #888;
      margin-bottom: 2px;
    }
    .doc-date {
      font-size: ${Math.round(10 * fontScale)}px;
      color: #AAA;
      margin-top: 4px;
    }

    .day-section {
      margin-bottom: 8px;
    }
    .day-divider {
      margin-bottom: 16px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #DDD;
    }
    .day-title {
      font-size: ${Math.round(15 * fontScale)}px;
      font-weight: 700;
      color: #222;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .section-block {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: ${Math.round(12 * fontScale)}px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #D0D0D0;
    }

    .macros-row {
      padding: 0 4px;
    }
    .macro-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: ${Math.round(13 * fontScale)}px;
      color: #222;
      padding: 5px 0;
    }
    .macro-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .hydration-content {
      padding: 12px 16px;
      border-radius: 6px;
    }
    .hydration-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: ${Math.round(13 * fontScale)}px;
      color: #222;
      padding: 4px 0;
    }
    .hydration-note {
      font-size: ${Math.round(11 * fontScale)}px;
      color: #777;
      font-style: italic;
      margin-top: 6px;
      padding-left: 14px;
    }

    .meal-block {
      margin-bottom: 14px;
      padding-left: 2px;
    }
    .meal-title {
      font-size: ${Math.round(13 * fontScale)}px;
      font-weight: 800;
      color: #1A1A1A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px dashed #E0E0E0;
    }
    .food-line {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 3px 0 3px 12px;
      font-size: ${Math.round(13 * fontScale)}px;
      color: #333;
    }
    .food-qty {
      color: #555;
      font-size: ${Math.round(12 * fontScale)}px;
      min-width: 60px;
      flex-shrink: 0;
    }
    .food-name {
      color: #1A1A1A;
      font-weight: 600;
    }

    .supplement-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: ${Math.round(13 * fontScale)}px;
      color: #222;
      padding: 4px 0;
    }
    .supplement-note {
      font-size: ${Math.round(11 * fontScale)}px;
      color: #666;
      margin-left: 14px;
      margin-top: 2px;
    }

    .notes-content {
      padding: 12px 16px;
      border-radius: 6px;
    }
    .note-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: ${Math.round(13 * fontScale)}px;
      color: #222;
      padding: 4px 0;
    }

    .tips-section {
      margin-top: 8px;
    }
    .tips-content {
      padding: 12px 16px;
      border-radius: 6px;
    }
    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: ${Math.round(12 * fontScale)}px;
      color: #333;
      padding: 4px 0;
      line-height: 1.5;
    }
    .tip-item .macro-bullet {
      margin-top: 6px;
    }

    .signature-block {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #DDD;
      display: flex;
      justify-content: space-between;
      gap: 48px;
    }
    .sig-line {
      flex: 1;
      text-align: center;
    }
    .sig-rule {
      border-bottom: 1px solid #999;
      height: 40px;
      margin-bottom: 6px;
    }
    .sig-line span {
      font-size: ${Math.round(9 * fontScale)}px;
      color: #999;
    }

    .disclaimer {
      margin-top: 24px;
      padding: 10px 14px;
      background: #FAFAFA;
      border-radius: 4px;
      border: 1px solid #EBEBEB;
      font-size: ${Math.round(9 * fontScale)}px;
      color: #BBB;
      line-height: 1.6;
      text-align: center;
    }

    .custom-footer {
      margin-top: 20px;
      text-align: center;
      font-size: ${Math.round(9 * fontScale)}px;
      color: #BBB;
    }

    .page-number-hint {
      text-align: center;
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid #EBEBEB;
      font-size: ${Math.round(9 * fontScale)}px;
      color: #CCC;
    }
  </style>
</head>
<body>
  ${headerHtml}
  ${daysHtml}
  ${supplementsHtml}
  ${notesHtml}
  ${tipsHtml}
  ${signatureHtml}
  ${disclaimerHtml}
  ${footerHtml}
  ${bottomLogo}
  ${pageNumberHtml}
</body>
</html>`;
}

export function generateTrainingPlanPdfHtml(
  student: Student,
  plan: TrainingPlan,
  docSettings: DocumentSettings
): string {
  const margin = docSettings.pdfMargin === 'compact' ? '24px 20px' : '40px 36px';
  const isColor = docSettings.pdfColorMode === 'color';
  const fontStack = getFontStack(docSettings.docFontFamily || 'system');
  const fontScale = (docSettings.docFontScale || 100) / 100;
  const lineH = getLineHeight(docSettings.docLineSpacing || 'standard');

  const blueAccent = isColor ? '#1A4F7A' : '#222';
  const cyanAccent = isColor ? '#126B5E' : '#222';

  const topLogo = isLogoOnTop(docSettings.logoPosition) ? buildLogoHtml(docSettings) : '';
  const bottomLogo = !isLogoOnTop(docSettings.logoPosition) ? buildLogoHtml(docSettings) : '';

  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const showHeader = docSettings.headerStyle !== 'hidden';
  const showAthleteInfo = docSettings.showAthleteInfo !== false;
  const showCoachInfo = docSettings.showCoachInfo && docSettings.coachName;

  const phaseLabels: Record<string, string> = {
    hypertrophy: 'Hipertrofia',
    strength: 'Fuerza',
    peaking: 'Pico',
    deload: 'Descarga',
    maintenance: 'Mantenimiento',
  };

  const headerHtml = showHeader ? `
    <div class="doc-header">
      ${topLogo}
      <h1 class="doc-title">${plan.name || 'PLAN DE ENTRENAMIENTO'}</h1>
      ${plan.phase ? `<div class="doc-phase">${phaseLabels[plan.phase] || plan.phase}</div>` : ''}
      ${showAthleteInfo ? `<div class="doc-athlete">${student.name}</div>` : ''}
      ${showCoachInfo ? `<div class="doc-coach">Coach: ${docSettings.coachName}</div>` : ''}
      ${docSettings.headerStyle === 'full' ? `<div class="doc-date">${dateStr}</div>` : ''}
    </div>
  ` : `${topLogo}`;

  const daysHtml = plan.weekDays.map((day) => {
    const muscleGroupsHtml = day.muscleGroups.length > 0 ? `
      <div class="muscle-groups">
        ${day.muscleGroups.map(mg => `<span class="muscle-chip">${mg}</span>`).join('')}
      </div>
    ` : '';

    const exercisesHtml = day.exercises.map((ex, i) => {
      const details: string[] = [];
      details.push(`${ex.sets} × ${ex.reps}`);
      if (ex.weight != null) details.push(`${ex.weight} kg`);
      if (ex.rir != null) details.push(`RIR ${ex.rir}`);
      if (ex.rpe != null) details.push(`RPE ${ex.rpe}`);
      if (ex.restSeconds != null) details.push(`Descanso: ${ex.restSeconds}s`);

      return `
        <div class="exercise-row">
          <div class="exercise-num">${i + 1}</div>
          <div class="exercise-info">
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-details">${details.join(' · ')}</div>
            ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="day-section">
        <div class="day-header">
          <div class="day-title">${day.dayName}</div>
          ${muscleGroupsHtml}
        </div>
        ${exercisesHtml}
      </div>
    `;
  }).join('');

  const notesHtml = plan.notes ? `
    <div class="section-block">
      <div class="section-title" style="color:${blueAccent};">NOTAS DEL PLAN</div>
      <div class="notes-content">
        ${plan.notes.split('\n').filter(l => l.trim()).map(line => `<div class="note-item"><span class="macro-bullet" style="background:${blueAccent};"></span>${line.trim()}</div>`).join('')}
      </div>
    </div>
  ` : '';

  const activeTips = docSettings.includeRequiredTips
    ? getActiveTips(docSettings.requiredTips || [], 'training').filter(t => !t.excludedStudentIds.includes(student.id))
    : [];

  const tipsHtml = activeTips.length > 0 ? `
    <div class="section-block">
      <div class="section-title" style="color:${blueAccent};">INDICACIONES</div>
      <div class="notes-content">
        ${activeTips.map(t => `<div class="note-item"><span class="macro-bullet" style="background:${blueAccent};"></span>${t.text}</div>`).join('')}
      </div>
    </div>
  ` : '';

  const signatureHtml = docSettings.addSignatureBlock ? `
    <div class="signature-block">
      <div class="sig-line"><div class="sig-rule"></div><span>Firma del Preparador</span></div>
      <div class="sig-line"><div class="sig-rule"></div><span>Fecha</span></div>
    </div>
  ` : '';

  const disclaimerHtml = docSettings.includeDisclaimer ? `
    <div class="disclaimer">
      Este plan de entrenamiento es orientativo y ha sido diseñado de forma personalizada.
      Ante cualquier duda o condición médica, consultar con un profesional de la salud.
    </div>
  ` : '';

  const footerHtml = docSettings.footerEnabled && docSettings.footerText ? `
    <div class="custom-footer">${docSettings.footerText}</div>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${fontStack};
      padding: ${margin};
      color: #2D2D2D;
      line-height: ${lineH};
      background: #fff;
      font-size: ${Math.round(13 * fontScale)}px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc-header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 2px solid #222;
    }
    .doc-title {
      font-size: ${Math.round(20 * fontScale)}px;
      font-weight: 800;
      color: #111;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .doc-phase {
      display: inline-block;
      background: ${cyanAccent}18;
      color: ${cyanAccent};
      font-size: ${Math.round(11 * fontScale)}px;
      font-weight: 600;
      padding: 3px 12px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .doc-athlete {
      font-size: ${Math.round(13 * fontScale)}px;
      font-weight: 500;
      color: #555;
      margin-bottom: 2px;
    }
    .doc-coach {
      font-size: ${Math.round(11 * fontScale)}px;
      color: #888;
      margin-bottom: 2px;
    }
    .doc-date {
      font-size: ${Math.round(10 * fontScale)}px;
      color: #AAA;
      margin-top: 4px;
    }
    .day-section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .day-header {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1.5px solid #DDD;
    }
    .day-title {
      font-size: ${Math.round(15 * fontScale)}px;
      font-weight: 700;
      color: #222;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .muscle-groups {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .muscle-chip {
      display: inline-block;
      background: ${cyanAccent}14;
      color: ${cyanAccent};
      font-size: ${Math.round(10 * fontScale)}px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .exercise-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px dashed #E8E8E8;
    }
    .exercise-num {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: ${blueAccent}14;
      color: ${blueAccent};
      font-size: ${Math.round(11 * fontScale)}px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .exercise-info {
      flex: 1;
    }
    .exercise-name {
      font-size: ${Math.round(13 * fontScale)}px;
      font-weight: 700;
      color: #1A1A1A;
      margin-bottom: 2px;
    }
    .exercise-details {
      font-size: ${Math.round(12 * fontScale)}px;
      color: #444;
    }
    .exercise-notes {
      font-size: ${Math.round(11 * fontScale)}px;
      color: #666;
      font-style: italic;
      margin-top: 2px;
    }
    .section-block {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: ${Math.round(11 * fontScale)}px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #E8E8E8;
    }
    .notes-content {
      padding: 12px 16px;
      background: #F8FAFE;
      border-radius: 6px;
      border-left: 3px solid ${blueAccent};
    }
    .note-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: ${Math.round(13 * fontScale)}px;
      color: #333;
      padding: 4px 0;
    }
    .macro-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .signature-block {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #DDD;
      display: flex;
      justify-content: space-between;
      gap: 48px;
    }
    .sig-line { flex: 1; text-align: center; }
    .sig-rule { border-bottom: 1px solid #999; height: 40px; margin-bottom: 6px; }
    .sig-line span { font-size: ${Math.round(9 * fontScale)}px; color: #999; }
    .disclaimer {
      margin-top: 24px;
      padding: 10px 14px;
      background: #FAFAFA;
      border-radius: 4px;
      border: 1px solid #EBEBEB;
      font-size: ${Math.round(9 * fontScale)}px;
      color: #BBB;
      line-height: 1.6;
      text-align: center;
    }
    .custom-footer {
      margin-top: 20px;
      text-align: center;
      font-size: ${Math.round(9 * fontScale)}px;
      color: #BBB;
    }
  </style>
</head>
<body>
  ${headerHtml}
  ${daysHtml}
  ${notesHtml}
  ${tipsHtml}
  ${signatureHtml}
  ${disclaimerHtml}
  ${footerHtml}
  ${bottomLogo}
</body>
</html>`;
}

export function generateDocumentPdfHtml(
  doc: { name: string; category: string; content?: string; notes?: string; htmlContent?: string; createdAt: string },
  docSettings: DocumentSettings
): string {
  const margin = docSettings.pdfMargin === 'compact' ? '24px 20px' : '40px 36px';
  const isColor = docSettings.pdfColorMode === 'color';
  const accent = isColor ? '#2D8C5A' : '#333';

  const fontStack = getFontStack(docSettings.docFontFamily || 'system');
  const fontScale = (docSettings.docFontScale || 100) / 100;
  const lineH = getLineHeight(docSettings.docLineSpacing || 'standard');

  const topLogo = isLogoOnTop(docSettings.logoPosition) ? buildLogoHtml(docSettings) : '';
  const bottomLogo = !isLogoOnTop(docSettings.logoPosition) ? buildLogoHtml(docSettings) : '';

  const dateStr = new Date(doc.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const categoryLabels: Record<string, string> = {
    nutrition: 'Nutrición',
    training: 'Entrenamiento',
    medical: 'Médico',
    progress: 'Progreso',
    other: 'Documento',
  };

  if (doc.htmlContent) {
    return doc.htmlContent;
  }

  const rawContent = doc.content || doc.notes || 'Sin contenido';
  const contentHtml = rawContent.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '<br/>';
    if (trimmed.startsWith('══') || trimmed.startsWith('──')) {
      return '<hr style="border:none;border-top:1px solid #E0E0E0;margin:16px 0;"/>';
    }
    if (trimmed.match(/^[A-ZÀ-ÿ\s]{5,}$/) || trimmed.match(/^(PLAN|OBJETIVOS|SUPLEMENTACI|NOTAS|COMIDA)/i)) {
      return `<h2 style="font-size:${Math.round(15 * fontScale)}px;font-weight:700;color:${accent};margin:20px 0 8px;letter-spacing:1px;text-transform:uppercase;">${trimmed}</h2>`;
    }
    return `<p style="margin:4px 0;color:#444;font-size:${Math.round(13 * fontScale)}px;line-height:${lineH};">${trimmed}</p>`;
  }).join('');

  const signatureHtml = docSettings.addSignatureBlock ? `
    <div style="margin-top:40px;padding-top:16px;border-top:1px solid #DDD;display:flex;justify-content:space-between;gap:48px;">
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:1px solid #999;height:40px;margin-bottom:6px;"></div>
        <span style="font-size:9px;color:#999;">Firma del Preparador</span>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:1px solid #999;height:40px;margin-bottom:6px;"></div>
        <span style="font-size:9px;color:#999;">Fecha</span>
      </div>
    </div>
  ` : '';

  const disclaimerHtml = docSettings.includeDisclaimer ? `
    <div style="margin-top:24px;padding:10px 14px;background:#FAFAFA;border-radius:4px;border:1px solid #EBEBEB;font-size:9px;color:#BBB;line-height:1.6;text-align:center;">
      Documento confidencial. Uso exclusivo del destinatario indicado.
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: ${fontStack};
      padding: ${margin};
      color: #2D2D2D;
      line-height: ${lineH};
      background: #fff;
      font-size: ${Math.round(13 * fontScale)}px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  ${topLogo}
  <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #222;">
    <h1 style="margin:0;font-size:${Math.round(20 * fontScale)}px;font-weight:800;color:#111;letter-spacing:1.5px;text-transform:uppercase;">${doc.name}</h1>
    <p style="margin:6px 0 0;font-size:${Math.round(12 * fontScale)}px;font-weight:500;color:${accent};">${categoryLabels[doc.category] || 'Documento'}</p>
    <p style="margin:4px 0 0;color:#AAA;font-size:${Math.round(10 * fontScale)}px;">${dateStr}</p>
  </div>
  ${contentHtml}
  ${signatureHtml}
  ${disclaimerHtml}
  ${bottomLogo}
  <div style="text-align:center;margin-top:28px;padding-top:10px;border-top:1px solid #EBEBEB;font-size:9px;color:#CCC;">${dateStr}</div>
</body>
</html>`;
}
