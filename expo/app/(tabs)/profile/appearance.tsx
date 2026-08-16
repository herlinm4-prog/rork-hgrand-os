import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Check, Sparkles } from 'lucide-react-native';
import { useTheme, ThemeMode, ThemeVariant } from '@/contexts/ThemeContext';
import Colors from '@/constants/colors';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSegment,
  SettingsSlider,
  SettingsPicker,
  SettingsButton,
} from '@/components/settings/SettingsRow';
import type {
  AccentColor,
  CardStyle,
  ShadowDensity,
  FontFamily,
  TextWeight,
  LineHeight,
  UIDensity,
  HapticLevel,
} from '@/types/settings';

export default function AppearanceScreen() {
  const { colors, mode, setThemeMode, isDark, variant, setThemeVariant } = useTheme();
  const { settings, updateAppearance, resetSection } = useSettings();
  const a = settings.appearance;

  const previewPalette = (v: ThemeVariant) => {
    const dark = isDark;
    if (v === 'neural') return dark ? Colors.neuralDark : Colors.neuralLight;
    return dark ? Colors.dark : Colors.light;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Appearance', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.themeStyleWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>VISUAL STYLE</Text>
          <View style={styles.themeCards}>
            {(['classic', 'neural'] as ThemeVariant[]).map((v) => {
              const p = previewPalette(v);
              const selected = variant === v;
              const title = v === 'neural' ? 'HGRAND Neural OS' : 'HGRAND Classic';
              const subtitle = v === 'neural' ? 'AI medical command center' : 'Original gold aesthetic';
              return (
                <Pressable
                  key={v}
                  onPress={() => setThemeVariant(v)}
                  style={({ pressed }) => [
                    styles.themeCard,
                    {
                      backgroundColor: p.card,
                      borderColor: selected ? p.primary : p.cardBorder,
                      borderWidth: selected ? 2 : 1,
                      opacity: pressed ? 0.85 : 1,
                      shadowColor: selected ? p.primary : '#000',
                      shadowOpacity: selected ? 0.25 : 0.08,
                      shadowRadius: selected ? 16 : 8,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: selected ? 8 : 2,
                    },
                  ]}
                  testID={`theme-card-${v}`}
                >
                  <View style={[styles.themePreview, { backgroundColor: p.background }]}> 
                    <View style={[styles.previewBar, { backgroundColor: p.primary, width: '55%' }]} />
                    <View style={[styles.previewBar, { backgroundColor: p.elevated, width: '80%' }]} />
                    <View style={[styles.previewBar, { backgroundColor: p.cardAlt, width: '40%' }]} />
                    <View style={styles.previewDots}>
                      <View style={[styles.dot, { backgroundColor: p.primary }]} />
                      <View style={[styles.dot, { backgroundColor: p.text, opacity: 0.4 }]} />
                      <View style={[styles.dot, { backgroundColor: p.text, opacity: 0.2 }]} />
                    </View>
                  </View>
                  <View style={styles.themeMeta}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        {v === 'neural' && <Sparkles size={12} color={p.primary} />}
                        <Text style={[styles.themeTitle, { color: p.text }]} numberOfLines={1}>{title}</Text>
                      </View>
                      <Text style={[styles.themeSubtitle, { color: p.textMuted }]} numberOfLines={1}>{subtitle}</Text>
                    </View>
                    {selected && (
                      <View style={[styles.checkBadge, { backgroundColor: p.primary }]}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <SettingsSection title="Theme">
          <SettingsSegment<ThemeMode>
            label="Theme Mode"
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            selected={mode}
            onSelect={setThemeMode}
          />
          <SettingsToggle
            label="True Black (OLED)"
            description="Pure black background for AMOLED screens"
            value={a.trueBlack}
            onValueChange={(v) => updateAppearance({ trueBlack: v })}
          />
          <SettingsPicker<AccentColor>
            label="Accent Color"
            options={[
              { value: 'gold', label: 'Gold' },
              { value: 'steelBlue', label: 'Steel Blue' },
              { value: 'emerald', label: 'Emerald' },
              { value: 'crimson', label: 'Crimson' },
            ]}
            selected={a.accentColor}
            onSelect={(v) => updateAppearance({ accentColor: v })}
          />
          <SettingsSegment<CardStyle>
            label="Card Style"
            options={[
              { value: 'soft', label: 'Soft' },
              { value: 'sharp', label: 'Sharp' },
            ]}
            selected={a.cardStyle}
            onSelect={(v) => updateAppearance({ cardStyle: v })}
          />
          <SettingsSlider
            label="Card Radius"
            value={a.cardRadius}
            min={4}
            max={24}
            step={2}
            unit="px"
            onValueChange={(v) => updateAppearance({ cardRadius: v })}
          />
          <SettingsSegment<ShadowDensity>
            label="Shadow Density"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            selected={a.shadowDensity}
            onSelect={(v) => updateAppearance({ shadowDensity: v })}
          />
          <SettingsToggle
            label="Reduce Motion"
            description="Limits animations throughout the app"
            value={a.reduceMotion}
            onValueChange={(v) => updateAppearance({ reduceMotion: v })}
          />
        </SettingsSection>

        <SettingsSection title="Typography">
          <SettingsPicker<FontFamily>
            label="Font Family"
            options={[
              { value: 'system', label: 'System' },
              { value: 'inter', label: 'Inter' },
              { value: 'sfpro', label: 'SF Pro' },
              { value: 'roboto', label: 'Roboto' },
            ]}
            selected={a.fontFamily}
            onSelect={(v) => updateAppearance({ fontFamily: v })}
          />
          <SettingsToggle
            label="Use OS Font"
            description="Override with system default font"
            value={a.useOSFont}
            onValueChange={(v) => updateAppearance({ useOSFont: v })}
          />
          <SettingsSlider
            label="Font Size Scale"
            value={a.fontScale}
            min={85}
            max={130}
            step={5}
            unit="%"
            onValueChange={(v) => updateAppearance({ fontScale: v })}
          />
          <SettingsSegment<TextWeight>
            label="Text Weight"
            options={[
              { value: 'regular', label: 'Regular' },
              { value: 'medium', label: 'Medium' },
              { value: 'bold', label: 'Bold' },
            ]}
            selected={a.textWeight}
            onSelect={(v) => updateAppearance({ textWeight: v })}
          />
          <SettingsSegment<LineHeight>
            label="Line Height"
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'standard', label: 'Standard' },
              { value: 'spacious', label: 'Spacious' },
            ]}
            selected={a.lineHeight}
            onSelect={(v) => updateAppearance({ lineHeight: v })}
          />
          <SettingsToggle
            label="Tabular Numbers"
            description="Align numbers in stats and tables"
            value={a.tabularNumbers}
            onValueChange={(v) => updateAppearance({ tabularNumbers: v })}
          />
        </SettingsSection>

        <SettingsSection title="UI Scale">
          <SettingsSegment<UIDensity>
            label="UI Density"
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'standard', label: 'Standard' },
              { value: 'spacious', label: 'Spacious' },
            ]}
            selected={a.uiDensity}
            onSelect={(v) => updateAppearance({ uiDensity: v })}
          />
          <SettingsSlider
            label="Interface Scale"
            value={a.uiScale}
            min={90}
            max={120}
            step={5}
            unit="%"
            onValueChange={(v) => updateAppearance({ uiScale: v })}
          />
          <SettingsToggle
            label="Large Touch Targets"
            description="Increase button and control sizes"
            value={a.largeTouchTargets}
            onValueChange={(v) => updateAppearance({ largeTouchTargets: v })}
          />
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <SettingsToggle
            label="High Contrast Mode"
            value={a.highContrast}
            onValueChange={(v) => updateAppearance({ highContrast: v })}
          />
          <SettingsToggle
            label="Color-blind Safe Mode"
            description="Adjust badge and status colors"
            value={a.colorBlindSafe}
            onValueChange={(v) => updateAppearance({ colorBlindSafe: v })}
          />
          <SettingsSegment<HapticLevel>
            label="Haptics"
            options={[
              { value: 'off', label: 'Off' },
              { value: 'light', label: 'Light' },
              { value: 'standard', label: 'Standard' },
            ]}
            selected={a.haptics}
            onSelect={(v) => updateAppearance({ haptics: v })}
          />
          <SettingsToggle
            label="Sound Effects"
            value={a.soundEffects}
            onValueChange={(v) => updateAppearance({ soundEffects: v })}
          />
        </SettingsSection>

        <SettingsButton
          label="Restore Defaults"
          onPress={() => {
            Alert.alert('Restore Defaults', 'Reset all appearance settings?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => resetSection('appearance') },
            ]);
          }}
          variant="danger"
        />

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  spacer: { height: 20 },
  themeStyleWrap: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  themeCards: { flexDirection: 'row', gap: 12 },
  themeCard: {
    flex: 1,
    borderRadius: 18,
    padding: 10,
    overflow: 'hidden',
  },
  themePreview: {
    height: 92,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  previewBar: { height: 6, borderRadius: 3, marginVertical: 2 },
  previewDots: { flexDirection: 'row', gap: 4, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  themeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 2, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  themeTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.2 },
  themeSubtitle: { fontSize: 11, marginTop: 2 },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
