import React, { useMemo } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, G } from 'react-native-svg';

interface MiniSparklineProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  fillOpacity?: number;
  /** Show median baseline (scientific reference line). Default true. */
  showBaseline?: boolean;
  /** Show terminal value dot. Default true. */
  showEndDot?: boolean;
  /** Show min/max tick whiskers on the left axis. Default true when width >= 60. */
  showAxisTicks?: boolean;
}

/**
 * Clinical-grade sparkline: rendered line + soft area fill, with a dashed
 * median baseline, axis tick whiskers (min/max) and a highlighted terminal
 * point. Reads like a medical chart strip rather than a decorative spark.
 */
function MiniSparklineBase({
  data,
  width,
  height,
  color,
  fillOpacity = 0.18,
  showBaseline = true,
  showEndDot = true,
  showAxisTicks,
}: MiniSparklineProps) {
  const ticksVisible = showAxisTicks ?? width >= 60;

  const { line, area, pts, minY, maxY, midY, endX, endY } = useMemo(() => {
    if (data.length < 2) {
      return { line: '', area: '', pts: [] as readonly (readonly [number, number])[], minY: 0, maxY: 0, midY: 0, endX: 0, endY: 0 };
    }
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const padTop = 3;
    const padBot = 3;
    const innerH = height - padTop - padBot;
    const points = data.map((v, i) => {
      const x = i * step;
      const y = padTop + innerH - ((v - min) / range) * innerH;
      return [x, y] as const;
    });
    const lineStr = points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ');
    const areaStr = `${lineStr} L ${width} ${height} L 0 ${height} Z`;
    const median = (min + max) / 2;
    const mid = padTop + innerH - ((median - min) / range) * innerH;
    const last = points[points.length - 1];
    return {
      line: lineStr,
      area: areaStr,
      pts: points,
      minY: padTop + innerH,
      maxY: padTop,
      midY: mid,
      endX: last[0],
      endY: last[1],
    };
  }, [data, width, height]);

  const gradId = useMemo(() => `g-${color.replace('#', '')}-${width}-${height}`, [color, width, height]);

  if (!line) return <Svg width={width} height={height} />;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Scientific median baseline */}
      {showBaseline && (
        <Line
          x1={0}
          y1={midY}
          x2={width}
          y2={midY}
          stroke={color}
          strokeOpacity={0.22}
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />
      )}

      {/* Left-axis tick whiskers (min / max) */}
      {ticksVisible && (
        <G>
          <Line x1={0} y1={maxY} x2={2.5} y2={maxY} stroke={color} strokeOpacity={0.55} strokeWidth={0.8} />
          <Line x1={0} y1={minY} x2={2.5} y2={minY} stroke={color} strokeOpacity={0.35} strokeWidth={0.8} />
        </G>
      )}

      <Path d={area} fill={`url(#${gradId})`} />
      <Path d={line} stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Terminal point marker */}
      {showEndDot && (
        <G>
          <Circle cx={endX} cy={endY} r={2.6} fill={color} opacity={0.22} />
          <Circle cx={endX} cy={endY} r={1.4} fill={color} />
        </G>
      )}
    </Svg>
  );
}

export const MiniSparkline = React.memo(MiniSparklineBase);
