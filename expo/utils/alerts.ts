import { Student, SmartAlert, AlertType, AlertSeverity } from '@/types';

export function generateAlerts(students: Student[]): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = Date.now();

  for (const student of students) {
    const sorted = [...student.checkIns].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sorted.length === 0) {
      const daysSinceCreated = Math.floor(
        (now - new Date(student.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated > 3) {
        alerts.push(createAlert(student, 'no_checkin', 'warning',
          'Sin check-ins registrados',
          `${student.name} fue agregado hace ${daysSinceCreated} días y aún no tiene check-ins.`,
          'Programa su primer check-in para establecer línea base.'
        ));
      }
      continue;
    }

    const lastCheckIn = sorted[0];
    const daysSinceLast = Math.floor(
      (now - new Date(lastCheckIn.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLast > 14) {
      alerts.push(createAlert(student, 'no_checkin', 'critical',
        'Check-in muy atrasado',
        `Hace ${daysSinceLast} días sin check-in.`,
        'Contacta al alumno para retomar el seguimiento.'
      ));
    } else if (daysSinceLast > 7) {
      alerts.push(createAlert(student, 'no_checkin', 'warning',
        'Check-in pendiente',
        `Hace ${daysSinceLast} días sin check-in.`,
        'Recuerda agendar el check-in semanal.'
      ));
    }

    if (sorted.length >= 3) {
      const recent3 = sorted.slice(0, 3);
      const weights = recent3.map(c => c.weight);
      const maxDiff = Math.max(...weights) - Math.min(...weights);

      if (maxDiff < 0.3 && student.goal !== 'maintain') {
        alerts.push(createAlert(student, 'stagnation', 'warning',
          'Posible estancamiento de peso',
          `El peso se mantiene en ~${weights[0]} kg en los últimos 3 check-ins.`,
          student.goal === 'lose_fat'
            ? 'Considera ajustar déficit calórico o aumentar NEAT.'
            : 'Revisa superávit calórico y progresión de cargas.'
        ));
      }

      if (student.goal === 'lose_fat') {
        const weeklyLoss = (recent3[recent3.length - 1].weight - recent3[0].weight) / recent3.length;
        if (weeklyLoss < -1.2) {
          alerts.push(createAlert(student, 'goal_risk', 'critical',
            'Pérdida de peso muy rápida',
            `Perdiendo ~${Math.abs(Math.round(weeklyLoss * 10) / 10)} kg/check-in.`,
            'Riesgo de pérdida muscular. Reduce el déficit y aumenta proteína.'
          ));
        }
      }

      if (student.goal === 'build_muscle') {
        const weeklyGain = (recent3[0].weight - recent3[recent3.length - 1].weight) / recent3.length;
        if (weeklyGain > 1.0) {
          alerts.push(createAlert(student, 'goal_risk', 'warning',
            'Ganancia de peso acelerada',
            `Subiendo ~${Math.round(weeklyGain * 10) / 10} kg/check-in.`,
            'Posible exceso de grasa. Ajusta superávit calórico.'
          ));
        }
      }
    }

    if (sorted.length >= 2) {
      const recentMoods = sorted.slice(0, 3).filter(c => c.mood != null).map(c => c.mood!);
      const recentSleep = sorted.slice(0, 3).filter(c => c.sleepHours != null).map(c => c.sleepHours!);
      const recentEnergy = sorted.slice(0, 3).filter(c => c.energyLevel != null).map(c => c.energyLevel!);
      const recentStress = sorted.slice(0, 3).filter(c => c.stressLevel != null).map(c => c.stressLevel!);

      const avgMood = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : null;
      const avgSleep = recentSleep.length > 0 ? recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length : null;
      const avgEnergy = recentEnergy.length > 0 ? recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length : null;
      const avgStress = recentStress.length > 0 ? recentStress.reduce((a, b) => a + b, 0) / recentStress.length : null;

      if (avgMood !== null && avgMood <= 2) {
        alerts.push(createAlert(student, 'low_adherence', 'warning',
          'Ánimo bajo',
          `Promedio de ánimo: ${avgMood.toFixed(1)}/5 en últimos check-ins.`,
          'Habla con el alumno sobre motivación y ajustes al plan.'
        ));
      }

      if (avgSleep !== null && avgSleep < 6) {
        alerts.push(createAlert(student, 'overtraining', 'warning',
          'Sueño insuficiente',
          `Promedio: ${avgSleep.toFixed(1)}h de sueño.`,
          'La recuperación es clave. Sugiere higiene del sueño.'
        ));
      }

      if (avgEnergy !== null && avgEnergy <= 2) {
        alerts.push(createAlert(student, 'overtraining', 'critical',
          'Energía muy baja',
          `Nivel de energía promedio: ${avgEnergy.toFixed(1)}/5.`,
          'Posible sobreentrenamiento o déficit excesivo. Considera deload.'
        ));
      }

      if (avgStress !== null && avgStress >= 4) {
        alerts.push(createAlert(student, 'overtraining', 'warning',
          'Estrés elevado',
          `Nivel de estrés promedio: ${avgStress.toFixed(1)}/5.`,
          'El estrés afecta la recuperación. Ajusta volumen de entrenamiento.'
        ));
      }

      const recentPerf = sorted.slice(0, 2).filter(c => c.trainingPerformance != null).map(c => c.trainingPerformance!);
      if (recentPerf.length >= 2 && recentPerf[0] < recentPerf[1] - 1) {
        alerts.push(createAlert(student, 'performance_drop', 'warning',
          'Caída en rendimiento',
          `Rendimiento bajó de ${recentPerf[1]}/5 a ${recentPerf[0]}/5.`,
          'Revisa recuperación, nutrición y carga de entrenamiento.'
        ));
      }
    }
  }

  return alerts.sort((a, b) => {
    const sevOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}

function createAlert(
  student: Student,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  suggestion: string
): SmartAlert {
  return {
    id: `${student.id}_${type}_${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    type,
    severity,
    title,
    message,
    suggestion,
    createdAt: new Date().toISOString(),
  };
}

export function getStudentRiskScore(student: Student): { score: number; level: 'low' | 'medium' | 'high' } {
  let risk = 0;

  if (student.checkIns.length === 0) {
    risk += 30;
  } else {
    const sorted = [...student.checkIns].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLast > 14) risk += 40;
    else if (daysSinceLast > 7) risk += 20;

    if (sorted.length >= 3) {
      const weights = sorted.slice(0, 3).map(c => c.weight);
      const maxDiff = Math.max(...weights) - Math.min(...weights);
      if (maxDiff < 0.3 && student.goal !== 'maintain') risk += 20;
    }

    const lastMood = sorted[0].mood;
    if (lastMood != null && lastMood <= 2) risk += 15;

    const lastSleep = sorted[0].sleepHours;
    if (lastSleep != null && lastSleep < 6) risk += 10;

    const lastEnergy = sorted[0].energyLevel;
    if (lastEnergy != null && lastEnergy <= 2) risk += 15;
  }

  const level = risk >= 50 ? 'high' : risk >= 25 ? 'medium' : 'low';
  return { score: Math.min(risk, 100), level };
}

export function getWeightProjection(
  checkIns: { date: string; weight: number }[],
  weeks: number = 4
): { date: string; weight: number }[] {
  if (checkIns.length < 2) return [];

  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recentCount = Math.min(sorted.length, 6);
  const recent = sorted.slice(-recentCount);

  const totalDays = (new Date(recent[recent.length - 1].date).getTime() - new Date(recent[0].date).getTime()) / (1000 * 60 * 60 * 24);
  const totalChange = recent[recent.length - 1].weight - recent[0].weight;
  const dailyRate = totalDays > 0 ? totalChange / totalDays : 0;

  const projections: { date: string; weight: number }[] = [];
  const lastDate = new Date(recent[recent.length - 1].date);
  const lastWeight = recent[recent.length - 1].weight;

  for (let w = 1; w <= weeks; w++) {
    const projDate = new Date(lastDate);
    projDate.setDate(projDate.getDate() + w * 7);
    const projWeight = Math.round((lastWeight + dailyRate * w * 7) * 10) / 10;
    projections.push({
      date: projDate.toISOString().split('T')[0],
      weight: Math.max(projWeight, 30),
    });
  }

  return projections;
}
