import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface WeightPoint {
  date: string;
  weight: number;
}

interface WeightChartProps {
  checkIns: WeightPoint[];
  projections?: WeightPoint[];
  height?: number;
}

export default function WeightChart({ checkIns, projections = [], height = 160 }: WeightChartProps) {
  const { colors } = useTheme();

  const data = useMemo(() => {
    const sorted = [...checkIns].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sorted;
  }, [checkIns]);

  const allPoints = useMemo(() => [...data, ...projections], [data, projections]);

  if (data.length < 2) {
    return (
      <View style={[styles.container, { height, backgroundColor: colors.card }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Mínimo 2 check-ins para ver gráfica</Text>
      </View>
    );
  }

  const allWeights = allPoints.map(p => p.weight);
  const minW = Math.min(...allWeights) - 1;
  const maxW = Math.max(...allWeights) + 1;
  const range = maxW - minW || 1;

  const chartWidth = 280;
  const chartHeight = height - 40;
  const paddingLeft = 40;
  const paddingRight = 16;
  const usableWidth = chartWidth - paddingLeft - paddingRight;

  const totalPoints = allPoints.length;
  const stepX = totalPoints > 1 ? usableWidth / (totalPoints - 1) : 0;

  const getY = (w: number) => chartHeight - ((w - minW) / range) * (chartHeight - 20) - 10;

  const gridLines = 4;
  const gridWeights = Array.from({ length: gridLines }, (_, i) => {
    return Math.round((minW + (range / (gridLines - 1)) * i) * 10) / 10;
  });

  return (
    <View style={[styles.container, { height, backgroundColor: colors.card }]}>
      <View style={styles.chart}>
        {gridWeights.map((gw, i) => (
          <View key={i} style={[styles.gridLine, { top: getY(gw) }]}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>{Math.round(gw)}</Text>
            <View style={[styles.gridDash, { backgroundColor: colors.separator }]} />
          </View>
        ))}

        {data.map((point, i) => {
          const x = paddingLeft + i * stepX;
          const y = getY(point.weight);

          return (
            <React.Fragment key={`real-${i}`}>
              {i > 0 && (
                <View
                  style={[
                    styles.line,
                    {
                      left: paddingLeft + (i - 1) * stepX + 4,
                      top: Math.min(getY(data[i - 1].weight), y),
                      width: stepX,
                      height: Math.abs(getY(data[i - 1].weight) - y) || 1,
                      backgroundColor: colors.tint,
                    },
                  ]}
                />
              )}
              <View style={[styles.dot, { left: x - 4, top: y - 4, backgroundColor: colors.tint, borderColor: colors.card }]} />
            </React.Fragment>
          );
        })}

        {projections.map((point, i) => {
          const actualIndex = data.length + i;
          const x = paddingLeft + actualIndex * stepX;
          const y = getY(point.weight);
          const prevIndex = actualIndex - 1;
          const prevPoint = allPoints[prevIndex];

          return (
            <React.Fragment key={`proj-${i}`}>
              <View
                style={[
                  styles.line,
                  {
                    left: paddingLeft + prevIndex * stepX + 4,
                    top: Math.min(getY(prevPoint.weight), y),
                    width: stepX,
                    height: Math.abs(getY(prevPoint.weight) - y) || 1,
                    backgroundColor: colors.orange,
                    opacity: 0.4,
                  },
                ]}
              />
              <View style={[styles.dotProjection, { left: x - 3, top: y - 3, backgroundColor: colors.orange }]} />
            </React.Fragment>
          );
        })}

        <View style={styles.dateRow}>
          {data.length > 0 && (
            <Text style={[styles.dateLabel, { left: paddingLeft - 10, color: colors.textMuted }]}>
              {formatShortDate(data[0].date)}
            </Text>
          )}
          {data.length > 1 && (
            <Text style={[styles.dateLabel, { left: paddingLeft + (data.length - 1) * stepX - 10, color: colors.textMuted }]}>
              {formatShortDate(data[data.length - 1].date)}
            </Text>
          )}
          {projections.length > 0 && (
            <Text style={[styles.dateLabelProj, { left: paddingLeft + (totalPoints - 1) * stepX - 10, color: colors.orange }]}>
              {formatShortDate(projections[projections.length - 1].date)}
            </Text>
          )}
        </View>
      </View>

      {projections.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Real</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.orange }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Proyección</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden' as const,
  },
  chart: {
    flex: 1,
    position: 'relative' as const,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center' as const,
    marginTop: 40,
  },
  gridLine: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 10,
    width: 34,
    textAlign: 'right' as const,
    marginRight: 4,
  },
  gridDash: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dot: {
    position: 'absolute' as const,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  dotProjection: {
    position: 'absolute' as const,
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  line: {
    position: 'absolute' as const,
    borderRadius: 1,
  },
  dateRow: {
    position: 'absolute' as const,
    bottom: -2,
    left: 0,
    right: 0,
  },
  dateLabel: {
    position: 'absolute' as const,
    fontSize: 9,
  },
  dateLabelProj: {
    position: 'absolute' as const,
    fontSize: 9,
  },
  legend: {
    flexDirection: 'row' as const,
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
  },
});
