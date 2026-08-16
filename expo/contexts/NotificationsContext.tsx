import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { CoachNotification, NotificationCategory, DailyDigest } from '@/types';
import { useStudents } from '@/contexts/StudentsContext';
import * as api from '@/utils/api';

const STORAGE_KEY = 'coach_notifications';

function generateNotificationsFromStudents(
  students: {
    id: string;
    name: string;
    checkIns: { date: string; weight?: number; bodyFatPercentage?: number }[];
    goal: string;
    createdAt: string;
  }[]
): CoachNotification[] {
  const notifs: CoachNotification[] = [];
  const now = Date.now();

  students.forEach((s) => {
    if (s.checkIns.length >= 1) {
      const recent = s.checkIns[s.checkIns.length - 1];
      const recentDays = Math.floor((now - new Date(recent.date).getTime()) / (1000 * 60 * 60 * 24));
      if (recentDays <= 2) {
        notifs.push({
          id: `notif_checkin_${s.id}_${recent.date}`,
          category: 'checkin',
          title: 'Nuevo check-in recibido',
          body: `${s.name} ha enviado su check-in semanal.`,
          priority: 'medium',
          read: false,
          studentId: s.id,
          studentName: s.name,
          date: recent.date,
          actionRoute: `/student/${s.id}`,
        });
      }
    }

    if (s.checkIns.length === 0) {
      const daysSinceCreated = Math.floor((now - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreated > 7) {
        notifs.push({
          id: `notif_noci_${s.id}`,
          category: 'alert',
          title: 'Sin check-ins',
          body: `${s.name} no ha enviado ningún check-in desde que se registró.`,
          priority: 'high',
          read: false,
          studentId: s.id,
          studentName: s.name,
          date: new Date().toISOString(),
          actionRoute: `/student/${s.id}`,
        });
      }
    } else {
      const lastCheckIn = s.checkIns[s.checkIns.length - 1];
      const daysSince = Math.floor((now - new Date(lastCheckIn.date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 7 && daysSince <= 10) {
        notifs.push({
          id: `notif_missed_${s.id}_${lastCheckIn.date}`,
          category: 'checkin',
          title: 'Check-in no enviado',
          body: `${s.name} no ha enviado su check-in semanal. (${daysSince} días)`,
          priority: 'high',
          read: false,
          studentId: s.id,
          studentName: s.name,
          date: new Date().toISOString(),
          actionRoute: `/student/${s.id}`,
        });
      } else if (daysSince > 10) {
        notifs.push({
          id: `notif_overdue_${s.id}_${lastCheckIn.date}`,
          category: 'alert',
          title: 'Check-in muy atrasado',
          body: `${s.name} lleva ${daysSince} días sin enviar check-in.`,
          priority: 'critical',
          read: false,
          studentId: s.id,
          studentName: s.name,
          date: new Date().toISOString(),
          actionRoute: `/student/${s.id}`,
        });
      }
    }

    if (s.checkIns.length >= 3) {
      const last3 = s.checkIns.slice(-3);
      const weights = last3.map((c) => c.weight ?? 0).filter(Boolean);
      if (weights.length === 3 && Math.abs(weights[2] - weights[0]) < 0.5) {
        notifs.push({
          id: `notif_plateau_${s.id}`,
          category: 'alert',
          title: 'Estancamiento detectado',
          body: `${s.name}: peso sin cambios en 3 semanas. Considerar ajuste.`,
          priority: 'high',
          read: false,
          studentId: s.id,
          studentName: s.name,
          date: new Date().toISOString(),
          actionRoute: `/student/${s.id}`,
        });
      }

      const lastWeight = weights[weights.length - 1];
      const prevWeight = weights[weights.length - 2];
      if (prevWeight && lastWeight && Math.abs(lastWeight - prevWeight) > 2) {
        const direction = lastWeight < prevWeight ? 'pérdida' : 'ganancia';
        notifs.push({
          id: `notif_rapid_${s.id}_${last3[last3.length - 1].date}`,
          category: 'alert',
          title: 'Cambio rápido de peso',
          body: `${s.name}: ${direction} de ${Math.abs(lastWeight - prevWeight).toFixed(1)} kg en una semana.`,
          priority: 'high',
          read: false,
          studentId: s.id,
          studentName: s.name,
          date: new Date().toISOString(),
          actionRoute: `/student/${s.id}`,
        });
      }
    }

    if (s.goal === 'competition') {
      notifs.push({
        id: `notif_comp_${s.id}`,
        category: 'system',
        title: 'Atleta en preparación',
        body: `${s.name} está en fase de competición. Monitoreo especial requerido.`,
        priority: 'medium',
        read: false,
        studentId: s.id,
        studentName: s.name,
        date: new Date().toISOString(),
        actionRoute: `/student/${s.id}`,
      });
    }
  });

  notifs.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return notifs;
}

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { students } = useStudents();
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Try backend first
        const remoteNotifs = await api.fetchNotifications();
        if (remoteNotifs && remoteNotifs.length > 0) {
          const read = remoteNotifs.filter((n) => n.read).map((n) => n.id);
          setReadIds(read);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(read));
        } else {
          throw new Error('empty remote');
        }
      } catch {
        // 2. Fall back to local
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) {
            setReadIds(JSON.parse(stored) as string[]);
          }
        } catch (e) {
          console.log('Error loading notifications:', e);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Refetch from backend when students change
  useEffect(() => {
    if (students.length === 0) return;
    
    // Trigger health monitoring scan to generate fresh health alerts
    api.runHealthMonitoring().catch(() => {});
    
    api.fetchNotifications().then((remoteNotifs) => {
      const read = remoteNotifs.filter((n) => n.read).map((n) => n.id);
      setReadIds(read);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(read));
    }).catch(() => {});
  }, [students]);

  const allNotifications = useMemo(() => {
    const generated = generateNotificationsFromStudents(
      students as {
        id: string;
        name: string;
        checkIns: { date: string; weight?: number; bodyFatPercentage?: number }[];
        goal: string;
        createdAt: string;
      }[]
    );
    return generated.map((n) => ({
      ...n,
      read: readIds.includes(n.id),
    }));
  }, [students, readIds]);

  const unreadCount = useMemo(() => allNotifications.filter((n) => !n.read).length, [allNotifications]);

  const markAsRead = useCallback(async (notifId: string) => {
    if (readIds.includes(notifId)) return;
    const updated = [...readIds, notifId];
    setReadIds(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    api.markNotificationRead(notifId).catch(() => {});
  }, [readIds]);

  const markAllAsRead = useCallback(async () => {
    const allIds = allNotifications.map((n) => n.id);
    setReadIds(allIds);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    api.markAllNotificationsRead().catch(() => {});
  }, [allNotifications]);

  const notificationsByCategory = useMemo(() => {
    const map: Record<NotificationCategory, CoachNotification[]> = {
      checkin: [],
      plan_update: [],
      message: [],
      billing: [],
      alert: [],
      system: [],
    };
    allNotifications.forEach((n) => {
      map[n.category].push(n);
    });
    return map;
  }, [allNotifications]);

  const digest: DailyDigest = useMemo(() => {
    const pendingCheckIns = students.filter((s) => {
      if (s.checkIns.length === 0) return true;
      const last = s.checkIns[s.checkIns.length - 1];
      const days = Math.floor((Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24));
      return days > 7;
    }).length;

    const plateauStudents = students.filter((s) => {
      if (s.checkIns.length < 3) return false;
      const last3 = s.checkIns.slice(-3);
      const weights = last3.map((c) => c.weight).filter(Boolean);
      if (weights.length < 3) return false;
      return Math.abs((weights[2] ?? 0) - (weights[0] ?? 0)) < 0.5;
    }).length;

    return {
      pendingCheckIns,
      expiringSubscriptions: 0,
      planUpdatesNeeded: plateauStudents,
      aiAlerts: plateauStudents,
    };
  }, [students]);

  return {
    notifications: allNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    notificationsByCategory,
    digest,
    isLoading,
  };
});
