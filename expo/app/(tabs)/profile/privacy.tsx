import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSegment,
  SettingsPicker,
  SettingsButton,
} from '@/components/settings/SettingsRow';
import type { AppLockType, AutoLockTimer, DataRetention } from '@/types/settings';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const { settings, updatePrivacy } = useSettings();
  const p = settings.privacy;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Privacy & Security', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SettingsSection title="App Lock">
          <SettingsSegment<AppLockType>
            label="Lock Method"
            options={[
              { value: 'off', label: 'Off' },
              { value: 'pin', label: 'PIN' },
              { value: 'biometric', label: 'Face/Touch ID' },
            ]}
            selected={p.appLock}
            onSelect={(v) => updatePrivacy({ appLock: v })}
          />
          <SettingsPicker<AutoLockTimer>
            label="Auto-lock Timer"
            description="Lock app after inactivity"
            options={[
              { value: 'immediately', label: 'Immediately' },
              { value: '1min', label: '1 minute' },
              { value: '5min', label: '5 minutes' },
              { value: '15min', label: '15 minutes' },
            ]}
            selected={p.autoLockTimer}
            onSelect={(v) => updatePrivacy({ autoLockTimer: v })}
          />
        </SettingsSection>

        <SettingsSection title="Protection">
          <SettingsToggle
            label="Hide Sensitive Previews"
            description="Hide content in notification previews"
            value={p.hideSensitivePreviews}
            onValueChange={(v) => updatePrivacy({ hideSensitivePreviews: v })}
          />
          <SettingsToggle
            label="Screenshot Protection"
            description="Block screenshots in sensitive areas"
            value={p.screenshotProtection}
            onValueChange={(v) => updatePrivacy({ screenshotProtection: v })}
          />
        </SettingsSection>

        <SettingsSection title="Sessions">
          <SettingsButton
            label="Log Out All Devices"
            onPress={() => {
              Alert.alert('Log Out All', 'This will sign you out of all other devices.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out All', style: 'destructive', onPress: () => console.log('Logged out all devices') },
              ]);
            }}
            variant="danger"
          />
        </SettingsSection>

        <SettingsSection title="Data Retention">
          <SettingsPicker<DataRetention>
            label="Retention Policy"
            description="How long to keep athlete data"
            options={[
              { value: '3months', label: '3 months' },
              { value: '6months', label: '6 months' },
              { value: '1year', label: '1 year' },
              { value: 'forever', label: 'Forever' },
            ]}
            selected={p.dataRetention}
            onSelect={(v) => updatePrivacy({ dataRetention: v })}
          />
        </SettingsSection>

        <SettingsSection title="Consent Management">
          <SettingsToggle
            label="Photo Analysis Consent"
            description="Athletes must consent to AI photo analysis"
            value={true}
            onValueChange={() => Alert.alert('Consent', 'This setting is managed per athlete.')}
          />
          <SettingsToggle
            label="Health Data Consent"
            description="Athletes must consent to health data collection"
            value={true}
            onValueChange={() => Alert.alert('Consent', 'This setting is managed per athlete.')}
          />
        </SettingsSection>

        <SettingsButton
          label="Delete Account & All Data"
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'This action is irreversible. All your data, athletes, plans, and documents will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Are you absolutely sure?', 'Type DELETE to confirm', [
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  },
                },
              ]
            );
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
});
