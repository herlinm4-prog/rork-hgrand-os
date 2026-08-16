import React, { useRef, useEffect, useMemo } from 'react';
import { Text, Animated, StyleSheet, type TextStyle } from 'react-native';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  baseStyle?: TextStyle;
  boldColor?: string;
  headerColor?: string;
  accentColor?: string;
}

interface ParsedSegment {
  type: 'text' | 'bold' | 'header' | 'list' | 'code' | 'break';
  content: string;
}

function parseMarkdown(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line && segments.length > 0) {
      segments.push({ type: 'break', content: '\n' });
      continue;
    }
    if (!line) continue;

    // Header: ## Title or # Title
    if (/^#{1,3}\s/.test(line)) {
      const content = line.replace(/^#{1,3}\s+/, '');
      segments.push({ type: 'header', content: `${content}\n` });
      continue;
    }

    // List item: - item or • item or 1. item
    if (/^[\-\•\*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const prefix = line.match(/^([\-\•\*\d+\.]+)\s/)![0];
      const content = line.substring(prefix.length);
      segments.push({ type: 'list', content: `${content}\n` });
      continue;
    }

    // Regular line with inline bold (**text**)
    if (/\*\*[^*]+\*\*/.test(line)) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      for (const part of parts) {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          segments.push({ type: 'bold', content: part.slice(2, -2) });
        } else if (part) {
          segments.push({ type: 'text', content: part });
        }
      }
      segments.push({ type: 'break', content: '\n' });
      continue;
    }

    // Regular text line
    segments.push({ type: 'text', content: line + '\n' });
  }

  return segments;
}

function StreamingTextComponent({
  text,
  isStreaming,
  baseStyle,
  boldColor = '#1A1A2E',
  headerColor = '#1A1A2E',
  accentColor = '#3B82F6',
}: StreamingTextProps) {
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isStreaming) {
      // Blinking cursor
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, { toValue: 0.15, duration: 400, useNativeDriver: true }),
          Animated.timing(cursorOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      // Fade cursor out when streaming ends
      Animated.timing(cursorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isStreaming, cursorOpacity]);

  // Subtle fade-in for completed messages
  useEffect(() => {
    if (!isStreaming && text) {
      fadeAnim.setValue(0.6);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isStreaming, text, fadeAnim]);

  const segments = useMemo(() => parseMarkdown(text), [text]);

  if (segments.length === 0) {
    // Show just the cursor when empty but streaming
    if (isStreaming) {
      return (
        <Animated.Text style={{ opacity: cursorOpacity, fontWeight: '300' as const, color: accentColor, fontSize: (baseStyle?.fontSize ?? 15) + 2 }}>
          {'▎'}
        </Animated.Text>
      );
    }
    return null;
  }

  const defaultBaseStyle: TextStyle = {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  };

  const mergedBase = { ...defaultBaseStyle, ...baseStyle };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={mergedBase}>
        {segments.map((seg, idx) => {
          const key = `${idx}-${seg.type}`;
          switch (seg.type) {
            case 'bold':
              return (
                <Text key={key} style={{ fontWeight: '700' as const, color: boldColor, letterSpacing: 0.15 }}>
                  {seg.content}
                </Text>
              );
            case 'header':
              return (
                <Text key={key} style={{
                  fontWeight: '800' as const,
                  fontSize: (mergedBase.fontSize ?? 15) + 2,
                  color: headerColor,
                  letterSpacing: -0.2,
                  lineHeight: (mergedBase.lineHeight ?? 23) + 4,
                }}>
                  {seg.content}
                </Text>
              );
            case 'list':
              return (
                <Text key={key} style={{ color: accentColor, fontWeight: '500' as const }}>
                  {'  • '}
                  <Text style={{ color: mergedBase.color ?? '#1A1A2E', fontWeight: '400' as const }}>
                    {seg.content}
                  </Text>
                </Text>
              );
            case 'code':
              return (
                <Text key={key} style={{
                  fontFamily: 'Courier',
                  fontSize: (mergedBase.fontSize ?? 15) - 1,
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  paddingHorizontal: 4,
                  borderRadius: 3,
                }}>
                  {seg.content}
                </Text>
              );
            case 'break':
              return <Text key={key}>{'\n'}</Text>;
            default:
              return <Text key={key}>{seg.content}</Text>;
          }
        })}
        {isStreaming && (
          <Animated.Text
            style={{
              opacity: cursorOpacity,
              fontWeight: '300' as const,
              color: accentColor,
              fontSize: (mergedBase.fontSize ?? 15) + 2,
            }}
          >
            {' ▎'}
          </Animated.Text>
        )}
      </Text>
    </Animated.View>
  );
}

export const StreamingText = React.memo(StreamingTextComponent);

const styles = StyleSheet.create({});
