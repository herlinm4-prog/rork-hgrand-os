import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ClipboardList,
  Images,
  Apple,
  Dumbbell,
  TrendingUp,
  Trophy,
  FileText,
  ScanLine,
  Activity,
  Pill,
  ShieldAlert,
  Brain,
  Droplets,
  Stethoscope,
} from 'lucide-react-native';
import { QUICK_AI_TOOLS, QuickTool } from '@/types/ai';
import { ThemeColors } from '@/constants/colors';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  scan: ScanLine,
  clipboard: ClipboardList,
  images: Images,
  apple: Apple,
  dumbbell: Dumbbell,
  'trending-up': TrendingUp,
  trophy: Trophy,
  'file-text': FileText,
  activity: Activity,
  pill: Pill,
  'shield-alert': ShieldAlert,
  brain: Brain,
  droplets: Droplets,
  stethoscope: Stethoscope,
};

interface QuickToolsBarProps {
  colors: ThemeColors;
  onSelectTool: (tool: QuickTool) => void;
  disabled?: boolean;
}

function QuickToolsBarComponent({ onSelectTool, disabled }: QuickToolsBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {QUICK_AI_TOOLS.map((tool) => {
          const IconComp = ICON_MAP[tool.icon] || FileText;
          return (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolChip, { backgroundColor: tool.color + '12', borderColor: tool.color + '25' }]}
              onPress={() => onSelectTool(tool)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <IconComp size={14} color={tool.color} />
              <Text style={[styles.toolLabel, { color: tool.color }]} numberOfLines={1}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const QuickToolsBar = React.memo(QuickToolsBarComponent);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  scroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
