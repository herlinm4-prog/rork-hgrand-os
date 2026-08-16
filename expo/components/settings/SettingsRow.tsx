import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  icon?: React.ReactNode;
}

export function SettingsToggle({ label, description, value, onValueChange, icon }: SettingsToggleProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.separator }]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <View style={styles.labelWrap}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description ? <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.tertiaryFill, true: colors.gold + '60' }}
        thumbColor={value ? colors.gold : colors.fill}
        ios_backgroundColor={colors.tertiaryFill}
      />
    </View>
  );
}

interface SettingsNavRowProps {
  label: string;
  description?: string;
  value?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
}

export function SettingsNavRow({ label, description, value, icon, onPress, danger }: SettingsNavRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.separator }]} onPress={onPress} activeOpacity={0.6}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <View style={styles.labelWrap}>
        <Text style={[styles.label, { color: danger ? colors.red : colors.text }]}>{label}</Text>
        {description ? <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text> : null}
      </View>
      {value ? <Text style={[styles.valueText, { color: colors.textMuted }]}>{value}</Text> : null}
      <ChevronRight size={16} color={colors.textQuaternary} />
    </TouchableOpacity>
  );
}

interface SettingsSegmentProps<T extends string> {
  label: string;
  description?: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (val: T) => void;
}

export function SettingsSegment<T extends string>({ label, description, options, selected, onSelect }: SettingsSegmentProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmentContainer, { borderBottomColor: colors.separator }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {description ? <Text style={[styles.desc, { color: colors.textMuted, marginBottom: 10 }]}>{description}</Text> : null}
      <View style={[styles.segmentRow, { backgroundColor: colors.elevated }]}>
        {options.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.segmentBtn,
                isActive && { backgroundColor: colors.gold },
              ]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.segmentText,
                { color: isActive ? '#000' : colors.textMuted },
                isActive && { fontWeight: '600' as const },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface SettingsSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onValueChange: (val: number) => void;
}

export function SettingsSlider({ label, description, value, min, max, step, unit, onValueChange }: SettingsSliderProps) {
  const { colors } = useTheme();
  const percentage = ((value - min) / (max - min)) * 100;

  const handlePress = (direction: 'minus' | 'plus') => {
    if (direction === 'minus' && value > min) {
      onValueChange(Math.max(min, value - step));
    } else if (direction === 'plus' && value < max) {
      onValueChange(Math.min(max, value + step));
    }
  };

  return (
    <View style={[styles.sliderContainer, { borderBottomColor: colors.separator }]}>
      <View style={styles.sliderHeader}>
        <View style={styles.labelWrap}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {description ? <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text> : null}
        </View>
        <Text style={[styles.sliderValue, { color: colors.gold }]}>{value}{unit ?? ''}</Text>
      </View>
      <View style={styles.sliderControls}>
        <TouchableOpacity
          onPress={() => handlePress('minus')}
          style={[styles.sliderBtn, { backgroundColor: colors.elevated }]}
          activeOpacity={0.6}
        >
          <Text style={[styles.sliderBtnText, { color: colors.text }]}>−</Text>
        </TouchableOpacity>
        <View style={[styles.sliderTrack, { backgroundColor: colors.elevated }]}>
          <View style={[styles.sliderFill, { width: `${percentage}%`, backgroundColor: colors.gold }]} />
        </View>
        <TouchableOpacity
          onPress={() => handlePress('plus')}
          style={[styles.sliderBtn, { backgroundColor: colors.elevated }]}
          activeOpacity={0.6}
        >
          <Text style={[styles.sliderBtnText, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface SettingsPickerProps<T extends string> {
  label: string;
  description?: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (val: T) => void;
}

export function SettingsPicker<T extends string>({ label, description, options, selected, onSelect }: SettingsPickerProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pickerContainer, { borderBottomColor: colors.separator }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {description ? <Text style={[styles.desc, { color: colors.textMuted, marginBottom: 8 }]}>{description}</Text> : null}
      <View style={styles.pickerGrid}>
        {options.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.pickerOption,
                { backgroundColor: colors.elevated, borderColor: 'transparent', borderWidth: 1.5 },
                isActive && { borderColor: colors.gold, backgroundColor: colors.gold + '15' },
              ]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.pickerText,
                { color: isActive ? colors.gold : colors.textSecondary },
                isActive && { fontWeight: '600' as const },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {children}
      </View>
    </View>
  );
}

export function SettingsButton({ label, onPress, variant = 'default' }: { label: string; onPress: () => void; variant?: 'default' | 'danger' | 'gold' }) {
  const { colors } = useTheme();
  const bgMap = {
    default: colors.elevated,
    danger: colors.red + '15',
    gold: colors.gold + '15',
  };
  const colorMap = {
    default: colors.text,
    danger: colors.red,
    gold: colors.gold,
  };
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: bgMap[variant] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.actionBtnText, { color: colorMap[variant] }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  desc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  valueText: {
    fontSize: 14,
    marginRight: 4,
  },
  segmentContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  segmentRow: {
    flexDirection: 'row' as const,
    borderRadius: 10,
    padding: 3,
    marginTop: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
  },
  sliderContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  sliderHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  sliderControls: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
  },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderBtnText: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase' as const,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  pickerContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  pickerGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 8,
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  pickerText: {
    fontSize: 13,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
