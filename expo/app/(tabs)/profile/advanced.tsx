import React from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSegment,
  SettingsButton,
} from '@/components/settings/SettingsRow';
import type { PerformanceMode } from '@/types/settings';

export default function AdvancedScreen() {
  const { colors } = useTheme();
  const { settings, updateAdvanced, resetAll } = useSettings();
  const adv = settings.advanced;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Advanced', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SettingsSection title="Debugging">
          <SettingsToggle
            label="Debug Logs"
            description="Enable verbose logging for troubleshooting"
            value={adv.debugLogs}
            onValueChange={(v) => updateAdvanced({ debugLogs: v })}
          />
        </SettingsSection>

        <SettingsSection title="Performance">
          <SettingsSegment<PerformanceMode>
            label="Performance Mode"
            description="Reduce visual effects for better performance"
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'reduced', label: 'Reduced' },
            ]}
            selected={adv.performanceMode}
            onSelect={(v) => updateAdvanced({ performanceMode: v })}
          />
          <SettingsToggle
            label="Lower Image Resolution"
            description="Use lower resolution images in feeds"
            value={adv.lowResImages}
            onValueChange={(v) => updateAdvanced({ lowResImages: v })}
          />
        </SettingsSection>

        <SettingsSection title="Feature Flags">
          <View style={styles.flagsInfo}>
            <Text style={[styles.flagsText, { color: colors.textMuted }]}>
              No experimental features available at this time. New features will appear here before general release.
            </Text>
          </View>
        </SettingsSection>

        <SettingsButton
          label="Export App Configuration (JSON)"
          onPress={() => Alert.alert('Export', 'App configuration exported as JSON file.')}
          variant="gold"
        />

        <View style={{ height: 12 }} />

        <SettingsButton
          label="Reset All App Settings"
          onPress={() => {
            Alert.alert(
              'Reset All Settings',
              'This will restore every setting to its default value. Your data will not be affected.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset All', style: 'destructive', onPress: resetAll },
              ]
            );
          }}
          variant="danger"
        />

        <View style={[styles.buildInfo, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.buildLabel, { color: colors.textMuted }]}>Build</Text>
          <Text style={[styles.buildValue, { color: colors.textQuaternary }]}>v1.0.0 (1)</Text>
          <Text style={[styles.buildLabel, { color: colors.textMuted, marginTop: 6 }]}>SDK</Text>
          <Text style={[styles.buildValue, { color: colors.textQuaternary }]}>Expo 54</Text>
          <Text style={[styles.buildLabel, { color: colors.textMuted, marginTop: 6 }]}>Environment</Text>
          <Text style={[styles.buildValue, { color: colors.textQuaternary }]}>Production</Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  spacer: { height: 20 },
  flagsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  flagsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  buildInfo: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  buildLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  buildValue: {
    fontSize: 14,
    marginTop: 2,
  },
});
