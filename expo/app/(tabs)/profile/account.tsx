import React from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  SettingsSection,
  SettingsNavRow,
  SettingsButton,
} from '@/components/settings/SettingsRow';
import { Crown, Camera, Users, Link, CreditCard, FileText } from 'lucide-react-native';
import { SubscriptionTier } from '@/types';

const PLANS: { tier: SubscriptionTier; label: string; price: string; features: string }[] = [
  { tier: 'free', label: 'Free', price: '$0/mo', features: 'Up to 3 athletes' },
  { tier: 'weekly', label: 'Weekly', price: '$9.99/wk', features: 'Unlimited athletes' },
  { tier: 'monthly', label: 'Monthly', price: '$29.99/mo', features: 'Unlimited + AI' },
  { tier: 'annual', label: 'Annual', price: '$249.99/yr', features: 'All features + priority' },
];

export default function AccountScreen() {
  const { colors } = useTheme();
  const { coach, updateSubscription } = useAuth();

  const currentTier = coach?.subscription ?? 'free';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Account & Subscription', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SettingsSection title="Profile">
          <View style={styles.profileRow}>
            <View style={[styles.avatarWrap, { backgroundColor: colors.gold }]}>
              <Text style={styles.avatarText}>{coach?.name?.charAt(0) ?? 'C'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.changePhotoBtn, { backgroundColor: colors.elevated }]}
              onPress={() => Alert.alert('Photo', 'Upload a new profile photo.')}
              activeOpacity={0.7}
            >
              <Camera size={16} color={colors.gold} />
              <Text style={[styles.changePhotoText, { color: colors.gold }]}>Change Photo</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.fieldRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Name</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{coach?.name ?? 'Coach'}</Text>
          </View>
          <View style={[styles.fieldRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{coach?.email ?? ''}</Text>
          </View>
          <View style={[styles.fieldRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Brand Name</Text>
            <Text style={[styles.fieldValue, { color: colors.textSecondary }]}>HGRAND OS</Text>
          </View>
          <SettingsNavRow
            label="Social Links"
            description="Instagram, website, etc."
            icon={<Link size={18} color={colors.blue} />}
            onPress={() => Alert.alert('Social', 'Configure your social media links.')}
          />
        </SettingsSection>

        <SettingsSection title="Subscription">
          <View style={styles.plansGrid}>
            {PLANS.map((plan) => {
              const isActive = currentTier === plan.tier;
              return (
                <TouchableOpacity
                  key={plan.tier}
                  style={[
                    styles.planCard,
                    { backgroundColor: colors.elevated, borderColor: 'transparent', borderWidth: 1.5 },
                    isActive && { borderColor: colors.gold, backgroundColor: colors.gold + '12' },
                  ]}
                  onPress={() => updateSubscription(plan.tier)}
                  activeOpacity={0.7}
                >
                  {isActive && (
                    <View style={[styles.currentBadge, { backgroundColor: colors.gold }]}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                  <Crown size={20} color={isActive ? colors.gold : colors.textMuted} />
                  <Text style={[styles.planName, { color: isActive ? colors.gold : colors.text }]}>{plan.label}</Text>
                  <Text style={[styles.planPrice, { color: isActive ? colors.gold : colors.textSecondary }]}>{plan.price}</Text>
                  <Text style={[styles.planFeatures, { color: colors.textMuted }]}>{plan.features}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SettingsSection>

        <SettingsSection title="Billing">
          <SettingsNavRow
            label="Payment Method"
            description="Manage your payment method"
            icon={<CreditCard size={18} color={colors.green} />}
            value="•••• 4242"
            onPress={() => Alert.alert('Payment', 'Manage your payment methods.')}
          />
          <SettingsNavRow
            label="Billing History"
            description="View past invoices and receipts"
            icon={<FileText size={18} color={colors.blue} />}
            onPress={() => Alert.alert('History', 'View your complete billing history.')}
          />
        </SettingsSection>

        <SettingsSection title="Team">
          <SettingsNavRow
            label="Invite Assistant Coach"
            description="Add team members to help manage athletes"
            icon={<Users size={18} color={colors.purple} />}
            onPress={() => Alert.alert('Team', 'Send an invitation to an assistant coach.')}
          />
          <SettingsButton
            label="Manage Permissions"
            onPress={() => Alert.alert('Permissions', 'Configure read-only vs editor access for team members.')}
            variant="gold"
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
  profileRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 0.5,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  changePhotoBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  fieldRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  fieldLabel: {
    fontSize: 14,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  plansGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: 12,
    gap: 10,
  },
  planCard: {
    width: '47%' as any,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
    position: 'relative' as const,
  },
  currentBadge: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#000',
  },
  planName: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  planPrice: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  planFeatures: {
    fontSize: 11,
    textAlign: 'center' as const,
  },
});
