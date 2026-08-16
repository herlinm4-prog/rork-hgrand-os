import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import {
  MessageTemplate,
  Automation,
  SubscriptionReminder,
  SentMessage,
  AISuggestion,
  BroadcastFilter,
} from '@/types/automation';

const STORAGE_KEY_TEMPLATES = 'automation_templates';
const STORAGE_KEY_AUTOMATIONS = 'automation_automations';
const STORAGE_KEY_REMINDERS = 'automation_reminders';
const STORAGE_KEY_HISTORY = 'automation_history';
const STORAGE_KEY_SUGGESTIONS = 'automation_suggestions';

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl_birthday',
    name: 'Felicitación de cumpleaños',
    title: '¡Feliz cumpleaños! 🎉',
    body: '¡Feliz cumpleaños, {nombre}! Que este nuevo año esté lleno de logros y superación. ¡Sigue así!',
    category: 'birthday',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tpl_motivation',
    name: 'Motivación semanal',
    title: '¡Tú puedes! 💪',
    body: '¡Hola {nombre}! Recuerda que cada día es una oportunidad para mejorar. ¡No te rindas, estás haciendo un gran trabajo!',
    category: 'motivation',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tpl_checkin',
    name: 'Recordatorio de check-in',
    title: 'Es hora del check-in 📝',
    body: '¡Hola {nombre}! No olvides registrar tu check-in semanal. Tu progreso importa.',
    category: 'checkin_reminder',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tpl_subscription',
    name: 'Recordatorio de suscripción',
    title: 'Tu suscripción vence pronto ⏰',
    body: 'Hola {nombre}, tu suscripción vence en {dias} días. Renueva para seguir con tu plan sin interrupciones.',
    category: 'subscription',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tpl_achievement',
    name: 'Felicitación por logro',
    title: '¡Increíble progreso! ⭐',
    body: '¡Felicidades {nombre}! Has alcanzado un nuevo hito en tu transformación. ¡Sigue así, campeón/a!',
    category: 'achievement',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const DEFAULT_AUTOMATIONS: Automation[] = [
  { id: 'auto_birthday', triggerType: 'birthday', templateId: 'tpl_birthday', delayMinutes: 0, enabled: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'auto_missed', triggerType: 'missed_checkin', templateId: 'tpl_checkin', delayMinutes: 1440, enabled: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'auto_inactive', triggerType: 'athlete_inactive', templateId: 'tpl_motivation', delayMinutes: 4320, enabled: false, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'auto_milestone', triggerType: 'progress_milestone', templateId: 'tpl_achievement', delayMinutes: 0, enabled: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'auto_sub', triggerType: 'subscription_expiring', templateId: 'tpl_subscription', delayMinutes: 0, enabled: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'auto_comp', triggerType: 'competition_approaching', templateId: 'tpl_motivation', delayMinutes: 0, enabled: false, createdAt: '2025-01-01T00:00:00Z' },
];

const DEFAULT_REMINDERS: SubscriptionReminder[] = [
  { id: 'rem_7', daysBefore: 7, templateId: 'tpl_subscription', enabled: true },
  { id: 'rem_3', daysBefore: 3, templateId: 'tpl_subscription', enabled: true },
  { id: 'rem_1', daysBefore: 1, templateId: 'tpl_subscription', enabled: true },
];

const MOCK_HISTORY: SentMessage[] = [
  {
    id: 'hist_1',
    title: '¡Feliz cumpleaños! 🎉',
    body: '¡Feliz cumpleaños, María! Que este nuevo año esté lleno de logros.',
    targetGroup: 'María López',
    recipientCount: 1,
    deliveryStatus: 'delivered',
    source: 'automation',
    sentAt: '2025-12-15T10:00:00Z',
  },
  {
    id: 'hist_2',
    title: 'Motivación semanal 💪',
    body: 'No olviden sus check-ins semanales. ¡Vamos equipo!',
    targetGroup: 'Todos los atletas',
    recipientCount: 12,
    deliveryStatus: 'sent',
    source: 'broadcast',
    sentAt: '2025-12-14T08:30:00Z',
  },
  {
    id: 'hist_3',
    title: 'Check-in pendiente 📝',
    body: 'Carlos, no olvides registrar tu check-in semanal.',
    targetGroup: 'Carlos Rodríguez',
    recipientCount: 1,
    deliveryStatus: 'delivered',
    source: 'automation',
    sentAt: '2025-12-13T14:00:00Z',
  },
];

const MOCK_SUGGESTIONS: AISuggestion[] = [
  {
    id: 'sug_1',
    studentId: '1',
    studentName: 'Carlos Méndez',
    reason: 'Sin actividad durante 10 días',
    suggestedTitle: 'Te extrañamos, Carlos 💬',
    suggestedBody: 'Hola Carlos, notamos que llevas unos días sin registrar actividad. ¿Todo bien? Estoy aquí para ayudarte.',
    type: 'inactive',
    createdAt: '2025-12-16T09:00:00Z',
    dismissed: false,
    approved: false,
  },
  {
    id: 'sug_2',
    studentId: '2',
    studentName: 'Ana García',
    reason: 'Peso estancado las últimas 3 semanas',
    suggestedTitle: 'Revisemos tu plan, Ana 📊',
    suggestedBody: 'Ana, he notado que tu peso se ha mantenido estable. Podría ser buen momento para ajustar tu plan.',
    type: 'plateau',
    createdAt: '2025-12-16T09:00:00Z',
    dismissed: false,
    approved: false,
  },
  {
    id: 'sug_3',
    studentId: '3',
    studentName: 'Pedro Ruiz',
    reason: 'Perdió 5kg en el último mes',
    suggestedTitle: '¡Gran progreso, Pedro! 🎯',
    suggestedBody: '¡Pedro, increíble progreso! Has bajado 5kg este mes. ¡Sigue así, estás en el camino correcto!',
    type: 'progress',
    createdAt: '2025-12-16T09:00:00Z',
    dismissed: false,
    approved: false,
  },
];

export const [AutomationProvider, useAutomation] = createContextHook(() => {
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [automations, setAutomations] = useState<Automation[]>(DEFAULT_AUTOMATIONS);
  const [reminders, setReminders] = useState<SubscriptionReminder[]>(DEFAULT_REMINDERS);
  const [history, setHistory] = useState<SentMessage[]>(MOCK_HISTORY);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(MOCK_SUGGESTIONS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tplStr, autoStr, remStr, histStr, sugStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_TEMPLATES),
          AsyncStorage.getItem(STORAGE_KEY_AUTOMATIONS),
          AsyncStorage.getItem(STORAGE_KEY_REMINDERS),
          AsyncStorage.getItem(STORAGE_KEY_HISTORY),
          AsyncStorage.getItem(STORAGE_KEY_SUGGESTIONS),
        ]);
        if (tplStr) setTemplates(JSON.parse(tplStr));
        if (autoStr) setAutomations(JSON.parse(autoStr));
        if (remStr) setReminders(JSON.parse(remStr));
        if (histStr) setHistory(JSON.parse(histStr));
        if (sugStr) setSuggestions(JSON.parse(sugStr));
      } catch (e) {
        console.log('Error loading automation data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const persist = useCallback(async (key: string, data: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.log('Error persisting automation data:', e);
    }
  }, []);

  const addTemplate = useCallback(async (tpl: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTpl: MessageTemplate = { ...tpl, id: 'tpl_' + Date.now(), createdAt: now, updatedAt: now };
    const updated = [...templates, newTpl];
    setTemplates(updated);
    await persist(STORAGE_KEY_TEMPLATES, updated);
    return newTpl;
  }, [templates, persist]);

  const updateTemplate = useCallback(async (id: string, data: Partial<MessageTemplate>) => {
    const updated = templates.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t);
    setTemplates(updated);
    await persist(STORAGE_KEY_TEMPLATES, updated);
  }, [templates, persist]);

  const deleteTemplate = useCallback(async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    await persist(STORAGE_KEY_TEMPLATES, updated);
  }, [templates, persist]);

  const toggleAutomation = useCallback(async (id: string) => {
    const updated = automations.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAutomations(updated);
    await persist(STORAGE_KEY_AUTOMATIONS, updated);
  }, [automations, persist]);

  const updateAutomation = useCallback(async (id: string, data: Partial<Automation>) => {
    const updated = automations.map(a => a.id === id ? { ...a, ...data } : a);
    setAutomations(updated);
    await persist(STORAGE_KEY_AUTOMATIONS, updated);
  }, [automations, persist]);

  const toggleReminder = useCallback(async (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setReminders(updated);
    await persist(STORAGE_KEY_REMINDERS, updated);
  }, [reminders, persist]);

  const sendBroadcast = useCallback(async (msg: {
    title: string;
    body: string;
    filter: BroadcastFilter;
    selectedStudentIds?: string[];
    sendPush: boolean;
    sendInApp: boolean;
    recipientCount: number;
  }) => {
    const filterLabels: Record<BroadcastFilter, string> = {
      all: 'Todos los atletas',
      selected: 'Seleccionados',
      cutting: 'Cutting',
      bulking: 'Bulking',
      peak_week: 'Peak Week',
    };
    const entry: SentMessage = {
      id: 'hist_' + Date.now(),
      title: msg.title,
      body: msg.body,
      targetGroup: filterLabels[msg.filter],
      recipientCount: msg.recipientCount,
      deliveryStatus: 'sent',
      source: 'broadcast',
      sentAt: new Date().toISOString(),
    };
    const updated = [entry, ...history];
    setHistory(updated);
    await persist(STORAGE_KEY_HISTORY, updated);
    return entry;
  }, [history, persist]);

  const approveSuggestion = useCallback(async (id: string) => {
    const sug = suggestions.find(s => s.id === id);
    if (!sug) return;
    const entry: SentMessage = {
      id: 'hist_' + Date.now(),
      title: sug.suggestedTitle,
      body: sug.suggestedBody,
      targetGroup: sug.studentName,
      recipientCount: 1,
      deliveryStatus: 'sent',
      source: 'ai_suggestion',
      sentAt: new Date().toISOString(),
    };
    const updatedSugs = suggestions.map(s => s.id === id ? { ...s, approved: true } : s);
    const updatedHist = [entry, ...history];
    setSuggestions(updatedSugs);
    setHistory(updatedHist);
    await persist(STORAGE_KEY_SUGGESTIONS, updatedSugs);
    await persist(STORAGE_KEY_HISTORY, updatedHist);
  }, [suggestions, history, persist]);

  const dismissSuggestion = useCallback(async (id: string) => {
    const updated = suggestions.map(s => s.id === id ? { ...s, dismissed: true } : s);
    setSuggestions(updated);
    await persist(STORAGE_KEY_SUGGESTIONS, updated);
  }, [suggestions, persist]);

  const activeSuggestions = useMemo(() =>
    suggestions.filter(s => !s.dismissed && !s.approved),
    [suggestions]
  );

  const getTemplateName = useCallback((templateId: string): string => {
    return templates.find(t => t.id === templateId)?.name ?? 'Sin plantilla';
  }, [templates]);

  return {
    templates,
    automations,
    reminders,
    history,
    suggestions: activeSuggestions,
    allSuggestions: suggestions,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleAutomation,
    updateAutomation,
    toggleReminder,
    sendBroadcast,
    approveSuggestion,
    dismissSuggestion,
    getTemplateName,
  };
});
