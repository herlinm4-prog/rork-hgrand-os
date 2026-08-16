import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSegment,
} from '@/components/settings/SettingsRow';
import type { NotifFrequency, MessageNotifLevel } from '@/types/settings';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { settings, updateNotifications } = useSettings();
  const n = settings.notifications;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Notifications', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SettingsSection title="Check-in Reminders">
          <SettingsSegment<NotifFrequency>
            label="Reminder Frequency"
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
            selected={n.checkinFrequency}
            onSelect={(v) => updateNotifications({ checkinFrequency: v })}
          />
          <SettingsToggle
            label="Missed Check-in Alerts"
            description="Notify when an athlete misses a check-in"
            value={n.missedCheckinAlerts}
            onValueChange={(v) => updateNotifications({ missedCheckinAlerts: v })}
          />
        </SettingsSection>

        <SettingsSection title="Smart Alerts">
          <SettingsToggle
            label="Plateau Alerts"
            description="Notify when an athlete hits a plateau"
            value={n.plateauAlerts}
            onValueChange={(v) => updateNotifications({ plateauAlerts: v })}
          />
          <SettingsToggle
            label="Peak Week Critical Alerts"
            description="Important notifications during peak week"
            value={n.peakWeekAlerts}
            onValueChange={(v) => updateNotifications({ peakWeekAlerts: v })}
          />
        </SettingsSection>

        <SettingsSection title="Messages">
          <SettingsSegment<MessageNotifLevel>
            label="Message Notifications"
            options={[
              { value: 'all', label: 'All' },
              { value: 'important', label: 'Important' },
              { value: 'off', label: 'Off' },
            ]}
            selected={n.messageNotifLevel}
            onSelect={(v) => updateNotifications({ messageNotifLevel: v })}
          />
        </SettingsSection>

        <SettingsSection title="Silent Hours">
          <SettingsToggle
            label="Enable Silent Hours"
            description="Mute notifications during specified hours"
            value={n.silentHoursEnabled}
            onValueChange={(v) => updateNotifications({ silentHoursEnabled: v })}
          />
        </SettingsSection>

        <SettingsSection title="Channels">
          <SettingsToggle
            label="Push Notifications"
            value={n.pushEnabled}
            onValueChange={(v) => updateNotifications({ pushEnabled: v })}
          />
          <SettingsToggle
            label="Email Notifications"
            value={n.emailEnabled}
            onValueChange={(v) => updateNotifications({ emailEnabled: v })}
          />
          <SettingsToggle
            label="High Priority Only"
            description="Only receive critical notifications"
            value={n.highPriorityOnly}
            onValueChange={(v) => updateNotifications({ highPriorityOnly: v })}
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
