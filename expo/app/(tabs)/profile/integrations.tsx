import React from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  SettingsSection,
  SettingsToggle,
  SettingsNavRow,
} from '@/components/settings/SettingsRow';
import {
  CreditCard,
  Cloud,
  MessageCircle,
  Mail,
  Heart,
  Apple,
} from 'lucide-react-native';

export default function IntegrationsScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Integrations', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SettingsSection title="Payments">
          <SettingsNavRow
            label="Stripe"
            description="Connect payment processing"
            icon={<CreditCard size={18} color="#6366F1" />}
            value="Not connected"
            onPress={() => Alert.alert('Stripe', 'Connect your Stripe account to manage billing and payments.')}
          />
        </SettingsSection>

        <SettingsSection title="Cloud Storage">
          <SettingsNavRow
            label="Google Drive"
            description="Sync exports and backups"
            icon={<Cloud size={18} color="#4285F4" />}
            value="Not connected"
            onPress={() => Alert.alert('Google Drive', 'Connect your Google Drive for automatic cloud backups.')}
          />
          <SettingsNavRow
            label="iCloud"
            description="Apple cloud storage"
            icon={<Apple size={18} color={colors.text} />}
            value="Not connected"
            onPress={() => Alert.alert('iCloud', 'Connect iCloud for seamless Apple ecosystem integration.')}
          />
          <SettingsNavRow
            label="Dropbox"
            description="File storage and sharing"
            icon={<Cloud size={18} color="#0061FF" />}
            value="Not connected"
            onPress={() => Alert.alert('Dropbox', 'Connect your Dropbox account for file storage.')}
          />
        </SettingsSection>

        <SettingsSection title="Health & Fitness">
          <SettingsNavRow
            label="Apple Health"
            description="Steps, sleep, heart rate data"
            icon={<Heart size={18} color="#FF2D55" />}
            value="Not connected"
            onPress={() => Alert.alert('Apple Health', 'Connect to import athlete health metrics automatically.')}
          />
          <SettingsNavRow
            label="Google Fit"
            description="Activity and wellness tracking"
            icon={<Heart size={18} color="#4285F4" />}
            value="Not connected"
            onPress={() => Alert.alert('Google Fit', 'Connect to import athlete fitness data.')}
          />
        </SettingsSection>

        <SettingsSection title="Calendar">
          <SettingsToggle
            label="Competition Date Reminders"
            description="Add competition dates to your calendar"
            value={false}
            onValueChange={() => Alert.alert('Calendar', 'Calendar integration will be enabled.')}
          />
          <SettingsToggle
            label="Check-in Schedule Sync"
            description="Sync check-in schedules to calendar"
            value={false}
            onValueChange={() => Alert.alert('Calendar', 'Check-in sync will be enabled.')}
          />
        </SettingsSection>

        <SettingsSection title="Messaging">
          <SettingsNavRow
            label="WhatsApp"
            description="Share plans and documents via WhatsApp"
            icon={<MessageCircle size={18} color="#25D366" />}
            value="Available"
            onPress={() => Alert.alert('WhatsApp', 'WhatsApp sharing is available for all exports.')}
          />
          <SettingsNavRow
            label="Email Provider"
            description="Configure email sending preferences"
            icon={<Mail size={18} color={colors.blue} />}
            value="Default"
            onPress={() => Alert.alert('Email', 'Email provider configured using device default.')}
          />
        </SettingsSection>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Integrations connect HGRAND OS with external services. Some integrations may require additional setup or subscriptions.
          </Text>
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
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
