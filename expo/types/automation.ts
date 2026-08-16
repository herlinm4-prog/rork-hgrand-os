export type TriggerType =
  | 'birthday'
  | 'subscription_expiring'
  | 'missed_checkin'
  | 'athlete_inactive'
  | 'progress_milestone'
  | 'competition_approaching';

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  birthday: 'Cumpleaños',
  subscription_expiring: 'Suscripción por vencer',
  missed_checkin: 'Check-in perdido',
  athlete_inactive: 'Atleta inactivo',
  progress_milestone: 'Hito de progreso',
  competition_approaching: 'Competencia próxima',
};

export const TRIGGER_ICONS: Record<TriggerType, string> = {
  birthday: '🎂',
  subscription_expiring: '⏰',
  missed_checkin: '📋',
  athlete_inactive: '💤',
  progress_milestone: '🏆',
  competition_approaching: '🏅',
};

export type DeliveryStatus = 'sent' | 'delivered' | 'failed' | 'pending';

export type BroadcastFilter = 'all' | 'selected' | 'cutting' | 'bulking' | 'peak_week';

export const BROADCAST_FILTER_LABELS: Record<BroadcastFilter, string> = {
  all: 'Todos',
  selected: 'Seleccionados',
  cutting: 'Cutting',
  bulking: 'Bulking',
  peak_week: 'Peak Week',
};

export interface MessageTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  category: 'birthday' | 'motivation' | 'checkin_reminder' | 'subscription' | 'achievement' | 'custom';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATE_CATEGORY_LABELS: Record<MessageTemplate['category'], string> = {
  birthday: 'Cumpleaños',
  motivation: 'Motivación',
  checkin_reminder: 'Recordatorio Check-in',
  subscription: 'Suscripción',
  achievement: 'Logro',
  custom: 'Personalizado',
};

export const TEMPLATE_CATEGORY_ICONS: Record<MessageTemplate['category'], string> = {
  birthday: '🎉',
  motivation: '💪',
  checkin_reminder: '📝',
  subscription: '💳',
  achievement: '⭐',
  custom: '✏️',
};

export interface Automation {
  id: string;
  triggerType: TriggerType;
  templateId: string;
  delayMinutes: number;
  enabled: boolean;
  createdAt: string;
}

export interface SubscriptionReminder {
  id: string;
  daysBefore: number;
  templateId: string;
  enabled: boolean;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  body: string;
  filter: BroadcastFilter;
  selectedStudentIds?: string[];
  sendPush: boolean;
  sendInApp: boolean;
  sentAt: string;
  deliveryStatus: DeliveryStatus;
  recipientCount: number;
}

export interface SentMessage {
  id: string;
  title: string;
  body: string;
  targetGroup: string;
  recipientCount: number;
  deliveryStatus: DeliveryStatus;
  source: 'broadcast' | 'automation' | 'ai_suggestion';
  sentAt: string;
}

export interface AISuggestion {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  suggestedTitle: string;
  suggestedBody: string;
  type: 'plateau' | 'inactive' | 'progress';
  createdAt: string;
  dismissed: boolean;
  approved: boolean;
}
