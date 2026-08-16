import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  MessageSquare,
  CreditCard,
  Settings,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationCategory } from '@/types';

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
};

const CATEGORY_ICONS: Record<NotificationCategory, typeof Bell> = {
  checkin: ClipboardList,
  plan_update: Settings,
  message: MessageSquare,
  billing: CreditCard,
  alert: AlertTriangle,
  system: Bell,
};

type FilterType = 'all' | NotificationCategory;

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [notifications, filter]);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'checkin', label: 'Check-ins' },
    { id: 'alert', label: 'Alertas' },
    { id: 'message', label: 'Mensajes' },
    { id: 'billing', label: 'Billing' },
    { id: 'system', label: 'Sistema' },
  ];

  const handleNotifPress = useCallback((notif: typeof notifications[0]) => {
    markAsRead(notif.id);
    if (notif.actionRoute) {
      router.push(notif.actionRoute as never);
    }
  }, [markAsRead]);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Ayer';
    return `${days}d`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Notificaciones',
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                <CheckCircle size={18} color={colors.gold} />
                <Text style={[styles.markAllText, { color: colors.gold }]}>Leer todo</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {filters.map((f) => {
          const isActive = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterChip,
                { backgroundColor: isActive ? colors.gold : colors.card, borderColor: isActive ? colors.gold : colors.cardBorder },
              ]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? '#000' : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <BellOff size={48} color={colors.textQuaternary} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>Sin notificaciones</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textQuaternary }]}>
              Aquí aparecerán las alertas y actualizaciones
            </Text>
          </View>
        )}

        {filteredNotifications.map((notif) => {
          const IconComp = CATEGORY_ICONS[notif.category] || Bell;
          const priorityColor = PRIORITY_COLORS[notif.priority];

          return (
            <TouchableOpacity
              key={notif.id}
              style={[
                styles.notifCard,
                {
                  backgroundColor: notif.read ? colors.card : colors.cardAlt,
                  borderColor: notif.read ? colors.cardBorder : priorityColor + '30',
                  borderLeftColor: priorityColor,
                  borderLeftWidth: 3,
                },
              ]}
              onPress={() => handleNotifPress(notif)}
              activeOpacity={0.7}
            >
              <View style={styles.notifTop}>
                <View style={[styles.notifIconWrap, { backgroundColor: priorityColor + '15' }]}>
                  <IconComp size={16} color={priorityColor} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <View style={styles.notifMeta}>
                      {!notif.read && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.gold }]} />
                      )}
                      <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                        {getTimeAgo(notif.date)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.notifBody, { color: colors.textTertiary }]} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  {notif.studentName && (
                    <View style={styles.notifStudent}>
                      <Text style={[styles.notifStudentName, { color: colors.gold }]}>
                        {notif.studentName}
                      </Text>
                      <ChevronRight size={12} color={colors.textQuaternary} />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markAllBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  filterBar: {
    maxHeight: 48,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  notifCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  notifTop: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  notifIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
    marginRight: 8,
  },
  notifMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  notifTime: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  notifStudent: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
  },
  notifStudentName: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
