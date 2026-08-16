import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Search,
  Palette,
  Globe,
  FileText,
  Brain,
  Bell,
  Shield,
  Database,
  Plug,
  User,
  Code,
  ChevronRight,
  LogOut,
  Crown,
  Radio,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SubscriptionTier } from '@/types';

const SUBSCRIPTION_INFO: Record<SubscriptionTier, { label: string; price: string }> = {
  free: { label: 'Free', price: '$0/mo' },
  weekly: { label: 'Weekly', price: '$9.99/wk' },
  monthly: { label: 'Monthly', price: '$29.99/mo' },
  annual: { label: 'Annual', price: '$249.99/yr' },
};

interface SettingsCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  route: string;
  keywords: string[];
}

export default function ProfileScreen() {
  const { coach, logout } = useAuth();
  const { stats } = useStudents();
  const { colors } = useTheme();
  const [search, setSearch] = useState<string>('');

  const categories: SettingsCategory[] = useMemo(() => [
    {
      id: 'automation',
      title: 'Automation Center',
      subtitle: 'Broadcast, automations, templates, AI assist',
      icon: <Radio size={20} color="#F97316" />,
      iconBg: '#F9731615',
      route: '/(tabs)/profile/automation-center',
      keywords: ['automation', 'broadcast', 'trigger', 'template', 'message', 'notification', 'automatizacion', 'plantilla', 'mensaje'],
    },
    {
      id: 'appearance',
      title: 'Appearance & Accessibility',
      subtitle: 'Theme, typography, UI scale, accessibility',
      icon: <Palette size={20} color="#E2C36C" />,
      iconBg: '#E2C36C15',
      route: '/(tabs)/profile/appearance',
      keywords: ['theme', 'dark', 'light', 'font', 'color', 'accent', 'haptic', 'motion', 'scale', 'accessibility', 'contrast', 'apariencia'],
    },
    {
      id: 'language',
      title: 'Language & Region',
      subtitle: 'Language, units, date format, currency',
      icon: <Globe size={20} color="#3B82F6" />,
      iconBg: '#3B82F615',
      route: '/(tabs)/profile/language',
      keywords: ['language', 'idioma', 'region', 'units', 'date', 'time', 'currency', 'kg', 'lb', 'formato'],
    },
    {
      id: 'brand',
      title: 'Brand Studio',
      subtitle: 'Plantillas, colores, logo, tipografía de marca',
      icon: <Sparkles size={20} color="#E2C36C" />,
      iconBg: '#E2C36C15',
      route: '/(tabs)/profile/brand-studio',
      keywords: ['brand', 'marca', 'logo', 'color', 'plantilla', 'template', 'diseño', 'design', 'tipografia', 'font', 'estilo'],
    },
    {
      id: 'documents',
      title: 'Documents & Export',
      subtitle: 'PDF, templates, export preferences',
      icon: <FileText size={20} color="#10B981" />,
      iconBg: '#10B98115',
      route: '/(tabs)/profile/documents',
      keywords: ['export', 'pdf', 'document', 'template', 'share', 'word', 'csv', 'backup', 'documento', 'exportar'],
    },
    {
      id: 'ai',
      title: 'AI Assistant Configuration',
      subtitle: 'Personality, behavior, memory, privacy',
      icon: <Brain size={20} color="#8B5CF6" />,
      iconBg: '#8B5CF615',
      route: '/(tabs)/profile/ai-config',
      keywords: ['ai', 'assistant', 'personality', 'memory', 'model', 'asistente', 'inteligencia'],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Alerts, reminders, silent hours',
      icon: <Bell size={20} color="#EF4444" />,
      iconBg: '#EF444415',
      route: '/(tabs)/profile/notifications',
      keywords: ['notification', 'alert', 'reminder', 'push', 'email', 'silent', 'notificacion', 'alerta'],
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'App lock, data retention, consent',
      icon: <Shield size={20} color="#14B8A6" />,
      iconBg: '#14B8A615',
      route: '/(tabs)/profile/privacy',
      keywords: ['privacy', 'security', 'lock', 'pin', 'biometric', 'data', 'delete', 'privacidad', 'seguridad'],
    },
    {
      id: 'data',
      title: 'Data & Storage',
      subtitle: 'Cache, backups, import data',
      icon: <Database size={20} color="#F59E0B" />,
      iconBg: '#F59E0B15',
      route: '/(tabs)/profile/data-storage',
      keywords: ['data', 'storage', 'cache', 'backup', 'import', 'restore', 'datos', 'almacenamiento'],
    },
    {
      id: 'integrations',
      title: 'Integrations',
      subtitle: 'Cloud storage, calendar, messaging',
      icon: <Plug size={20} color="#EC4899" />,
      iconBg: '#EC489915',
      route: '/(tabs)/profile/integrations',
      keywords: ['integration', 'stripe', 'google', 'apple', 'calendar', 'whatsapp', 'drive', 'integracion'],
    },
    {
      id: 'account',
      title: 'Account & Subscription',
      subtitle: 'Profile, plan, team management',
      icon: <User size={20} color="#6366F1" />,
      iconBg: '#6366F115',
      route: '/(tabs)/profile/account',
      keywords: ['account', 'subscription', 'profile', 'plan', 'billing', 'team', 'cuenta', 'suscripcion'],
    },
    {
      id: 'advanced',
      title: 'Advanced / Developer',
      subtitle: 'Debug, performance, feature flags',
      icon: <Code size={20} color="#6B7280" />,
      iconBg: '#6B728015',
      route: '/(tabs)/profile/advanced',
      keywords: ['advanced', 'debug', 'developer', 'performance', 'reset', 'flags', 'avanzado'],
    },
  ], []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.keywords.some(k => k.includes(q))
    );
  }, [search, categories]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const subInfo = SUBSCRIPTION_INFO[coach?.subscription ?? 'free'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        title: 'Settings',
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.gold,
        headerTitleStyle: { color: colors.text, fontWeight: '700' as const, fontSize: 18 },
        headerShadowVisible: false,
      }} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
            <Text style={styles.avatarText}>{coach?.name?.charAt(0) ?? 'C'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{coach?.name ?? 'Coach'}</Text>
            <Text style={[styles.email, { color: colors.textMuted }]}>{coach?.email ?? ''}</Text>
          </View>
          <TouchableOpacity
            style={[styles.planBadge, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '30' }]}
            onPress={() => router.push('/(tabs)/profile/account')}
            activeOpacity={0.7}
          >
            <Crown size={14} color={colors.gold} />
            <Text style={[styles.planBadgeText, { color: colors.gold }]}>{subInfo.label}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.gold }]}>{stats.totalStudents}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Clients</Text>
          </View>
          <View style={[styles.statSep, { backgroundColor: colors.separator }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.gold }]}>{stats.totalCheckIns}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Check-ins</Text>
          </View>
          <View style={[styles.statSep, { backgroundColor: colors.separator }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.gold }]}>{stats.activeStudents}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active</Text>
          </View>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search settings..."
            placeholderTextColor={colors.textQuaternary}
            value={search}
            onChangeText={setSearch}
            testID="settings-search"
          />
        </View>

        <View style={styles.categoriesWrap}>
          {filtered.map((cat, idx) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryRow,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                idx === 0 && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
                idx === filtered.length - 1 && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderBottomWidth: 0 },
              ]}
              onPress={() => router.push(cat.route as any)}
              activeOpacity={0.6}
              testID={`settings-${cat.id}`}
            >
              <View style={[styles.catIcon, { backgroundColor: cat.iconBg }]}>
                {cat.icon}
              </View>
              <View style={styles.catInfo}>
                <Text style={[styles.catTitle, { color: colors.text }]}>{cat.title}</Text>
                <Text style={[styles.catSubtitle, { color: colors.textMuted }]}>{cat.subtitle}</Text>
              </View>
              <ChevronRight size={16} color={colors.textQuaternary} />
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No settings found for &ldquo;{search}&rdquo;</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.logoutCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={handleLogout}
          activeOpacity={0.6}
        >
          <LogOut size={20} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textQuaternary }]}>HGRAND OS v1.0.0</Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  email: {
    fontSize: 14,
    marginTop: 2,
  },
  planBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500' as const,
  },
  statSep: {
    width: 0.5,
    height: 28,
    alignSelf: 'center' as const,
  },
  searchWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 24,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  categoriesWrap: {
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    gap: 14,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catInfo: {
    flex: 1,
  },
  catTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  catSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  logoutCard: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  version: {
    textAlign: 'center' as const,
    fontSize: 13,
    marginBottom: 10,
  },
});
