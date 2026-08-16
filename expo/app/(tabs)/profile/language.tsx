import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSegment,
  SettingsPicker,
} from '@/components/settings/SettingsRow';
import type {
  AppLanguage,
  Region,
  WeightUnit,
  HeightUnit,
  DateFormat,
  TimeFormat,
  WeekStart,
  Currency,
} from '@/types/settings';

export default function LanguageScreen() {
  const { colors } = useTheme();
  const { settings, updateLanguage } = useSettings();
  const l = settings.language;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Language & Region', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SettingsSection title="Language">
          <SettingsPicker<AppLanguage>
            label="App Language"
            options={[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
              { value: 'pt', label: 'Português' },
              { value: 'fr', label: 'Français' },
            ]}
            selected={l.language}
            onSelect={(v) => updateLanguage({ language: v })}
          />
          <SettingsToggle
            label="Follow Device Language"
            description="Use system language automatically"
            value={l.followDevice}
            onValueChange={(v) => updateLanguage({ followDevice: v })}
          />
        </SettingsSection>

        <SettingsSection title="Region">
          <SettingsSegment<Region>
            label="Region"
            options={[
              { value: 'US', label: 'US' },
              { value: 'EU', label: 'EU' },
              { value: 'LATAM', label: 'LATAM' },
            ]}
            selected={l.region}
            onSelect={(v) => updateLanguage({ region: v })}
          />
        </SettingsSection>

        <SettingsSection title="Units">
          <SettingsSegment<WeightUnit>
            label="Weight"
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lb', label: 'lb' },
            ]}
            selected={l.weightUnit}
            onSelect={(v) => updateLanguage({ weightUnit: v })}
          />
          <SettingsSegment<HeightUnit>
            label="Height"
            options={[
              { value: 'cm', label: 'cm' },
              { value: 'ft-in', label: 'ft / in' },
            ]}
            selected={l.heightUnit}
            onSelect={(v) => updateLanguage({ heightUnit: v })}
          />
        </SettingsSection>

        <SettingsSection title="Date & Time">
          <SettingsSegment<DateFormat>
            label="Date Format"
            options={[
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            ]}
            selected={l.dateFormat}
            onSelect={(v) => updateLanguage({ dateFormat: v })}
          />
          <SettingsSegment<TimeFormat>
            label="Time Format"
            options={[
              { value: '24h', label: '24h' },
              { value: '12h', label: '12h' },
            ]}
            selected={l.timeFormat}
            onSelect={(v) => updateLanguage({ timeFormat: v })}
          />
          <SettingsSegment<WeekStart>
            label="Week Starts On"
            options={[
              { value: 'monday', label: 'Monday' },
              { value: 'sunday', label: 'Sunday' },
            ]}
            selected={l.weekStart}
            onSelect={(v) => updateLanguage({ weekStart: v })}
          />
        </SettingsSection>

        <SettingsSection title="Currency">
          <SettingsPicker<Currency>
            label="Billing Currency"
            options={[
              { value: 'USD', label: 'USD $' },
              { value: 'EUR', label: 'EUR €' },
              { value: 'GBP', label: 'GBP £' },
              { value: 'MXN', label: 'MXN $' },
            ]}
            selected={l.currency}
            onSelect={(v) => updateLanguage({ currency: v })}
          />
        </SettingsSection>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  spacer: { height: 20 },
});
