import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  CreditCard,
  ChevronRight,
  ListChecks,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useTasks } from '@/contexts/TasksContext';
import { CoachTaskCategory, TASK_CATEGORY_LABELS } from '@/types';

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const CATEGORY_ICONS: Record<CoachTaskCategory, typeof ClipboardList> = {
  checkin: ClipboardList,
  plan_update: RefreshCw,
  message: MessageSquare,
  subscription: CreditCard,
  alert: AlertTriangle,
};

type FilterType = 'all' | 'pending' | 'completed';

export default function TasksScreen() {
  const { colors } = useTheme();
  const { tasks, pendingTasks, completedTasks, completeTask, uncompleteTask } = useTasks();
  const [filter, setFilter] = useState<FilterType>('pending');
  const [categoryFilter, setCategoryFilter] = useState<CoachTaskCategory | 'all'>('all');

  const filteredTasks = useMemo(() => {
    let list = filter === 'pending' ? pendingTasks : filter === 'completed' ? completedTasks : tasks;
    if (categoryFilter !== 'all') {
      list = list.filter((t) => t.category === categoryFilter);
    }
    list.sort((a, b) => {
      const po = { critical: 0, high: 1, medium: 2, low: 3 };
      return po[a.priority] - po[b.priority];
    });
    return list;
  }, [tasks, pendingTasks, completedTasks, filter, categoryFilter]);

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'pending', label: 'Pendientes', count: pendingTasks.length },
    { id: 'completed', label: 'Completadas', count: completedTasks.length },
    { id: 'all', label: 'Todas', count: tasks.length },
  ];

  const categories: { id: CoachTaskCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'checkin', label: 'Check-ins' },
    { id: 'plan_update', label: 'Planes' },
    { id: 'alert', label: 'Alertas' },
    { id: 'message', label: 'Mensajes' },
    { id: 'subscription', label: 'Suscripción' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Panel de Tareas' }} />

      <View style={[styles.summaryBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {filters.map((f) => {
          const isActive = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.summaryItem,
                isActive && { backgroundColor: colors.gold + '18' },
              ]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.summaryCount, { color: isActive ? colors.gold : colors.text }]}>
                {f.count}
              </Text>
              <Text style={[styles.summaryLabel, { color: isActive ? colors.gold : colors.textMuted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catBar}
        contentContainerStyle={styles.catBarContent}
      >
        {categories.map((c) => {
          const isActive = categoryFilter === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.catChip,
                {
                  backgroundColor: isActive ? colors.gold : colors.card,
                  borderColor: isActive ? colors.gold : colors.cardBorder,
                },
              ]}
              onPress={() => setCategoryFilter(c.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catChipText, { color: isActive ? '#000' : colors.textSecondary }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <ListChecks size={48} color={colors.textQuaternary} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>Sin tareas</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textQuaternary }]}>
              {filter === 'pending' ? 'No hay tareas pendientes' : 'No hay tareas en esta categoría'}
            </Text>
          </View>
        )}

        {filteredTasks.map((task) => {
          const IconComp = CATEGORY_ICONS[task.category] || ClipboardList;
          const priorityColor = PRIORITY_COLORS[task.priority];

          return (
            <View
              key={task.id}
              style={[
                styles.taskCard,
                {
                  backgroundColor: colors.card,
                  borderColor: task.completed ? colors.cardBorder : priorityColor + '25',
                  opacity: task.completed ? 0.6 : 1,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.taskCheckbox}
                onPress={() => task.completed ? uncompleteTask(task.id) : completeTask(task.id)}
                activeOpacity={0.6}
              >
                {task.completed ? (
                  <CheckCircle2 size={22} color={colors.success} />
                ) : (
                  <Circle size={22} color={priorityColor} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.taskContent}
                onPress={() => router.push(`/student/${task.studentId}`)}
                activeOpacity={0.7}
              >
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleRow}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: colors.text },
                        task.completed && styles.taskTitleCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
                      <Text style={[styles.priorityText, { color: priorityColor }]}>
                        {PRIORITY_LABELS[task.priority]}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.taskDesc, { color: colors.textTertiary }]} numberOfLines={2}>
                    {task.description}
                  </Text>
                </View>

                <View style={styles.taskFooter}>
                  <View style={styles.taskStudent}>
                    {task.studentAvatar ? (
                      <Image source={{ uri: task.studentAvatar }} style={styles.taskAvatar} contentFit="cover" />
                    ) : (
                      <View style={[styles.taskAvatarFallback, { backgroundColor: colors.elevated }]}>
                        <Text style={[styles.taskAvatarLetter, { color: colors.gold }]}>
                          {task.studentName.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.taskStudentName, { color: colors.textSecondary }]}>
                      {task.studentName}
                    </Text>
                  </View>
                  <View style={styles.taskActions}>
                    <View style={[styles.catBadge, { backgroundColor: colors.elevated }]}>
                      <IconComp size={11} color={colors.textMuted} />
                      <Text style={[styles.catBadgeText, { color: colors.textMuted }]}>
                        {TASK_CATEGORY_LABELS[task.category]}
                      </Text>
                    </View>
                    <ChevronRight size={14} color={colors.textQuaternary} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
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
  summaryBar: {
    flexDirection: 'row' as const,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 14,
  },
  summaryCount: {
    fontSize: 22,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  catBar: {
    maxHeight: 48,
    marginTop: 8,
  },
  catBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
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
  taskCard: {
    flexDirection: 'row' as const,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  taskCheckbox: {
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    marginBottom: 10,
  },
  taskTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
    marginRight: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through' as const,
    opacity: 0.6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  taskDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskStudent: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
  },
  taskAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  taskAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskAvatarLetter: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  taskStudentName: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  taskActions: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
  },
  catBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
});
