import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Radio,
  Send,
  Zap,
  FileText,
  Clock,
  ChevronRight,
  Plus,
  X,
  Check,
  Trash2,
  Sparkles,
  Bell,
  Users,
  MessageSquare,
  Edit3,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAutomation } from '@/contexts/AutomationContext';
import { useStudents } from '@/contexts/StudentsContext';
import {
  TRIGGER_LABELS,
  TRIGGER_ICONS,
  BROADCAST_FILTER_LABELS,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ICONS,
  BroadcastFilter,
  MessageTemplate,
  DeliveryStatus,
} from '@/types/automation';

type TabId = 'broadcast' | 'automations' | 'templates' | 'history';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'broadcast', label: 'Enviar', icon: <Send size={16} color="currentColor" /> },
  { id: 'automations', label: 'Auto', icon: <Zap size={16} color="currentColor" /> },
  { id: 'templates', label: 'Plantillas', icon: <FileText size={16} color="currentColor" /> },
  { id: 'history', label: 'Historial', icon: <Clock size={16} color="currentColor" /> },
];

export default function AutomationCenterScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('broadcast');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        title: 'Centro de Automatización',
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.gold,
        headerTitleStyle: { color: colors.text, fontWeight: '700' as const, fontSize: 17 },
        headerShadowVisible: false,
      }} />

      <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && { backgroundColor: colors.gold }]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, { color: isActive ? '#000' : colors.textMuted }, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'broadcast' && <BroadcastTab />}
      {activeTab === 'automations' && <AutomationsTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'history' && <HistoryTab />}
    </View>
  );
}

function BroadcastTab() {
  const { colors } = useTheme();
  const { sendBroadcast, suggestions, approveSuggestion, dismissSuggestion } = useAutomation();
  const { students } = useStudents();

  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [filter, setFilter] = useState<BroadcastFilter>('all');
  const [sendPush, setSendPush] = useState<boolean>(true);
  const [sendInApp, setSendInApp] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showStudentPicker, setShowStudentPicker] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const recipientCount = useMemo(() => {
    switch (filter) {
      case 'all': return students.length;
      case 'selected': return selectedIds.length;
      case 'cutting': return students.filter(s => s.goal === 'lose_fat').length;
      case 'bulking': return students.filter(s => s.goal === 'build_muscle').length;
      case 'peak_week': return students.filter(s => s.goal === 'competition').length;
      default: return 0;
    }
  }, [filter, students, selectedIds]);

  const handleSend = useCallback(async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa título y mensaje.');
      return;
    }
    if (recipientCount === 0) {
      Alert.alert('Sin destinatarios', 'Selecciona al menos un destinatario.');
      return;
    }
    setIsSending(true);
    try {
      await sendBroadcast({ title, body, filter, selectedStudentIds: selectedIds, sendPush, sendInApp, recipientCount });
      Alert.alert('Enviado', `Mensaje enviado a ${recipientCount} atleta(s).`);
      setTitle('');
      setBody('');
    } catch (e) {
      console.log('Broadcast error:', e);
      Alert.alert('Error', 'No se pudo enviar el mensaje.');
    } finally {
      setIsSending(false);
    }
  }, [title, body, filter, selectedIds, sendPush, sendInApp, recipientCount, sendBroadcast]);

  const toggleStudent = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={140}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {suggestions.length > 0 && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Sparkles size={18} color={colors.gold} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sugerencias IA</Text>
            <View style={[styles.badge, { backgroundColor: colors.gold + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.gold }]}>{suggestions.length}</Text>
            </View>
          </View>
          {suggestions.map(sug => (
            <View key={sug.id} style={[styles.suggestionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.suggestionHeader}>
                <View style={[styles.sugIcon, { backgroundColor: sug.type === 'plateau' ? colors.warning + '20' : sug.type === 'inactive' ? colors.blue + '20' : colors.success + '20' }]}>
                  <Text style={styles.sugIconText}>{sug.type === 'plateau' ? '📊' : sug.type === 'inactive' ? '💤' : '🚀'}</Text>
                </View>
                <View style={styles.sugInfo}>
                  <Text style={[styles.sugName, { color: colors.text }]}>{sug.studentName}</Text>
                  <Text style={[styles.sugReason, { color: colors.textMuted }]}>{sug.reason}</Text>
                </View>
              </View>
              <View style={[styles.sugMessageBox, { backgroundColor: colors.elevated }]}>
                <Text style={[styles.sugMessageTitle, { color: colors.text }]}>{sug.suggestedTitle}</Text>
                <Text style={[styles.sugMessageBody, { color: colors.textSecondary }]}>{sug.suggestedBody}</Text>
              </View>
              <View style={styles.sugActions}>
                <TouchableOpacity
                  style={[styles.sugBtn, { backgroundColor: colors.gold + '15' }]}
                  onPress={() => approveSuggestion(sug.id)}
                  activeOpacity={0.7}
                >
                  <Check size={16} color={colors.gold} />
                  <Text style={[styles.sugBtnText, { color: colors.gold }]}>Aprobar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sugBtn, { backgroundColor: colors.tertiaryFill }]}
                  onPress={() => dismissSuggestion(sug.id)}
                  activeOpacity={0.7}
                >
                  <X size={16} color={colors.textMuted} />
                  <Text style={[styles.sugBtnText, { color: colors.textMuted }]}>Ignorar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <Radio size={18} color={colors.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nuevo Broadcast</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Destinatarios</Text>
          <View style={styles.filterRow}>
            {(Object.keys(BROADCAST_FILTER_LABELS) as BroadcastFilter[]).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, { backgroundColor: colors.elevated }, filter === f && { backgroundColor: colors.gold }]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, { color: filter === f ? '#000' : colors.textMuted }]}>
                  {BROADCAST_FILTER_LABELS[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filter === 'selected' && (
            <TouchableOpacity
              style={[styles.selectStudentsBtn, { borderColor: colors.border }]}
              onPress={() => setShowStudentPicker(true)}
              activeOpacity={0.7}
            >
              <Users size={16} color={colors.textMuted} />
              <Text style={[styles.selectStudentsText, { color: selectedIds.length > 0 ? colors.text : colors.textMuted }]}>
                {selectedIds.length > 0 ? `${selectedIds.length} seleccionados` : 'Seleccionar atletas'}
              </Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          <View style={[styles.recipientBadge, { backgroundColor: colors.gold + '12' }]}>
            <Users size={14} color={colors.gold} />
            <Text style={[styles.recipientText, { color: colors.gold }]}>{recipientCount} destinatario(s)</Text>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>Título</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.elevated, color: colors.text, borderColor: colors.border }]}
            placeholder="Título del mensaje"
            placeholderTextColor={colors.textQuaternary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>Mensaje</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.elevated, color: colors.text, borderColor: colors.border }]}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor={colors.textQuaternary}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.togglesWrap}>
            <View style={styles.toggleRow}>
              <Bell size={16} color={colors.textSecondary} />
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Push notification</Text>
              <Switch
                value={sendPush}
                onValueChange={setSendPush}
                trackColor={{ false: colors.tertiaryFill, true: colors.gold + '60' }}
                thumbColor={sendPush ? colors.gold : colors.fill}
                ios_backgroundColor={colors.tertiaryFill}
              />
            </View>
            <View style={[styles.toggleDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.toggleRow}>
              <MessageSquare size={16} color={colors.textSecondary} />
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Mensaje in-app</Text>
              <Switch
                value={sendInApp}
                onValueChange={setSendInApp}
                trackColor={{ false: colors.tertiaryFill, true: colors.gold + '60' }}
                thumbColor={sendInApp ? colors.gold : colors.fill}
                ios_backgroundColor={colors.tertiaryFill}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.gold, opacity: isSending ? 0.6 : 1 }]}
            onPress={handleSend}
            disabled={isSending}
            activeOpacity={0.8}
          >
            <Send size={18} color="#000" />
            <Text style={styles.sendBtnText}>{isSending ? 'Enviando...' : 'Enviar broadcast'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showStudentPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Seleccionar atletas</Text>
            <TouchableOpacity onPress={() => setShowStudentPicker(false)}>
              <X size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {students.map(s => {
              const sel = selectedIds.includes(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.studentPickRow, { borderBottomColor: colors.separator }]}
                  onPress={() => toggleStudent(s.id)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.studentPickAvatar, { backgroundColor: sel ? colors.gold : colors.elevated }]}>
                    <Text style={[styles.studentPickAvatarText, { color: sel ? '#000' : colors.textMuted }]}>{s.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.studentPickName, { color: colors.text }]}>{s.name}</Text>
                    <Text style={[styles.studentPickGoal, { color: colors.textMuted }]}>{s.goal}</Text>
                  </View>
                  <View style={[styles.checkbox, { borderColor: sel ? colors.gold : colors.border, backgroundColor: sel ? colors.gold : 'transparent' }]}>
                    {sel && <Check size={14} color="#000" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalDoneBtn, { backgroundColor: colors.gold }]}
            onPress={() => setShowStudentPicker(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.modalDoneBtnText}>Listo ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AutomationsTab() {
  const { colors } = useTheme();
  const { automations, reminders, toggleAutomation, updateAutomation, toggleReminder, templates, getTemplateName } = useAutomation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const delayLabel = (minutes: number): string => {
    if (minutes === 0) return 'Inmediato';
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} horas`;
    return `${Math.round(minutes / 1440)} días`;
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <Zap size={18} color={colors.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Triggers automáticos</Text>
        </View>

        {automations.map(auto => {
          const expanded = expandedId === auto.id;
          return (
            <View key={auto.id} style={[styles.autoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={styles.autoHeader}
                onPress={() => setExpandedId(expanded ? null : auto.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.autoEmoji}>{TRIGGER_ICONS[auto.triggerType]}</Text>
                <View style={styles.flex}>
                  <Text style={[styles.autoName, { color: colors.text }]}>{TRIGGER_LABELS[auto.triggerType]}</Text>
                  <Text style={[styles.autoDelay, { color: colors.textMuted }]}>
                    {delayLabel(auto.delayMinutes)} · {getTemplateName(auto.templateId)}
                  </Text>
                </View>
                <Switch
                  value={auto.enabled}
                  onValueChange={() => toggleAutomation(auto.id)}
                  trackColor={{ false: colors.tertiaryFill, true: colors.gold + '60' }}
                  thumbColor={auto.enabled ? colors.gold : colors.fill}
                  ios_backgroundColor={colors.tertiaryFill}
                />
              </TouchableOpacity>

              {expanded && (
                <View style={[styles.autoExpanded, { borderTopColor: colors.separator }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Retraso antes de enviar</Text>
                  <View style={styles.delayOptions}>
                    {[0, 60, 1440, 4320, 10080].map(mins => (
                      <TouchableOpacity
                        key={mins}
                        style={[styles.delayChip, { backgroundColor: colors.elevated }, auto.delayMinutes === mins && { backgroundColor: colors.gold }]}
                        onPress={() => updateAutomation(auto.id, { delayMinutes: mins })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.delayChipText, { color: auto.delayMinutes === mins ? '#000' : colors.textMuted }]}>
                          {delayLabel(mins)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>Plantilla</Text>
                  <View style={styles.delayOptions}>
                    {templates.map(tpl => (
                      <TouchableOpacity
                        key={tpl.id}
                        style={[styles.delayChip, { backgroundColor: colors.elevated }, auto.templateId === tpl.id && { backgroundColor: colors.gold }]}
                        onPress={() => updateAutomation(auto.id, { templateId: tpl.id })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.delayChipText, { color: auto.templateId === tpl.id ? '#000' : colors.textMuted }]}>
                          {tpl.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <Bell size={18} color={colors.warning} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recordatorios de suscripción</Text>
        </View>
        <View style={[styles.remindersCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {reminders.map((rem, idx) => (
            <View key={rem.id} style={[styles.reminderRow, idx < reminders.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}>
              <View style={[styles.reminderIcon, { backgroundColor: colors.warning + '15' }]}>
                <Text style={styles.reminderIconText}>⏰</Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.reminderText, { color: colors.text }]}>{rem.daysBefore} días antes</Text>
                <Text style={[styles.reminderSub, { color: colors.textMuted }]}>{getTemplateName(rem.templateId)}</Text>
              </View>
              <Switch
                value={rem.enabled}
                onValueChange={() => toggleReminder(rem.id)}
                trackColor={{ false: colors.tertiaryFill, true: colors.gold + '60' }}
                thumbColor={rem.enabled ? colors.gold : colors.fill}
                ios_backgroundColor={colors.tertiaryFill}
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function TemplatesTab() {
  const { colors } = useTheme();
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useAutomation();
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [tplName, setTplName] = useState<string>('');
  const [tplTitle, setTplTitle] = useState<string>('');
  const [tplBody, setTplBody] = useState<string>('');
  const [tplCategory, setTplCategory] = useState<MessageTemplate['category']>('custom');

  const openEditor = useCallback((tpl?: MessageTemplate) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setTplName(tpl.name);
      setTplTitle(tpl.title);
      setTplBody(tpl.body);
      setTplCategory(tpl.category);
    } else {
      setEditingTemplate(null);
      setTplName('');
      setTplTitle('');
      setTplBody('');
      setTplCategory('custom');
    }
    setShowEditor(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!tplName.trim() || !tplTitle.trim() || !tplBody.trim()) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, { name: tplName, title: tplTitle, body: tplBody, category: tplCategory });
    } else {
      await addTemplate({ name: tplName, title: tplTitle, body: tplBody, category: tplCategory, isDefault: false });
    }
    setShowEditor(false);
  }, [tplName, tplTitle, tplBody, tplCategory, editingTemplate, addTemplate, updateTemplate]);

  const handleDelete = useCallback((tpl: MessageTemplate) => {
    if (tpl.isDefault) {
      Alert.alert('Plantilla predeterminada', 'No se puede eliminar una plantilla predeterminada.');
      return;
    }
    Alert.alert('Eliminar plantilla', `¿Eliminar "${tpl.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteTemplate(tpl.id) },
    ]);
  }, [deleteTemplate]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return Array.from(cats);
  }, [templates]);

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={colors.gold} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Plantillas de mensaje</Text>
          </View>

          {categories.map(cat => (
            <View key={cat} style={styles.tplCatWrap}>
              <Text style={[styles.tplCatTitle, { color: colors.textMuted }]}>
                {TEMPLATE_CATEGORY_ICONS[cat]} {TEMPLATE_CATEGORY_LABELS[cat]}
              </Text>
              {templates.filter(t => t.category === cat).map(tpl => (
                <View key={tpl.id} style={[styles.tplCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.tplCardHeader}>
                    <View style={styles.flex}>
                      <Text style={[styles.tplName, { color: colors.text }]}>{tpl.name}</Text>
                      {tpl.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: colors.gold + '15' }]}>
                          <Text style={[styles.defaultBadgeText, { color: colors.gold }]}>Default</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.tplActions}>
                      <TouchableOpacity onPress={() => openEditor(tpl)} style={styles.tplActionBtn} activeOpacity={0.7}>
                        <Edit3 size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                      {!tpl.isDefault && (
                        <TouchableOpacity onPress={() => handleDelete(tpl)} style={styles.tplActionBtn} activeOpacity={0.7}>
                          <Trash2 size={16} color={colors.red} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.tplTitle, { color: colors.textSecondary }]}>{tpl.title}</Text>
                  <Text style={[styles.tplBody, { color: colors.textTertiary }]} numberOfLines={2}>{tpl.body}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.gold }]}
        onPress={() => openEditor()}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#000" />
      </TouchableOpacity>

      <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
            </Text>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <X size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nombre interno</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.elevated, color: colors.text, borderColor: colors.border }]}
              placeholder="Ej: Motivación especial"
              placeholderTextColor={colors.textQuaternary}
              value={tplName}
              onChangeText={setTplName}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>Categoría</Text>
            <View style={styles.filterRow}>
              {(Object.keys(TEMPLATE_CATEGORY_LABELS) as MessageTemplate['category'][]).map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterChip, { backgroundColor: colors.elevated }, tplCategory === c && { backgroundColor: colors.gold }]}
                  onPress={() => setTplCategory(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, { color: tplCategory === c ? '#000' : colors.textMuted }]}>
                    {TEMPLATE_CATEGORY_ICONS[c]} {TEMPLATE_CATEGORY_LABELS[c]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>Título del mensaje</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.elevated, color: colors.text, borderColor: colors.border }]}
              placeholder="Ej: ¡Gran semana!"
              placeholderTextColor={colors.textQuaternary}
              value={tplTitle}
              onChangeText={setTplTitle}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>Cuerpo del mensaje</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.elevated, color: colors.text, borderColor: colors.border }]}
              placeholder="Usa {nombre} para el nombre del atleta..."
              placeholderTextColor={colors.textQuaternary}
              value={tplBody}
              onChangeText={setTplBody}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <View style={[styles.varHint, { backgroundColor: colors.gold + '10' }]}>
              <AlertCircle size={14} color={colors.gold} />
              <Text style={[styles.varHintText, { color: colors.gold }]}>
                Variables disponibles: {'{nombre}'}, {'{dias}'}, {'{meta}'}
              </Text>
            </View>
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalDoneBtn, { backgroundColor: colors.gold }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.modalDoneBtnText}>{editingTemplate ? 'Guardar cambios' : 'Crear plantilla'}</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function HistoryTab() {
  const { colors } = useTheme();
  const { history } = useAutomation();

  const statusConfig: Record<DeliveryStatus, { label: string; color: string; icon: React.ReactNode }> = useMemo(() => ({
    sent: { label: 'Enviado', color: colors.blue, icon: <Send size={12} color={colors.blue} /> },
    delivered: { label: 'Entregado', color: colors.success, icon: <CheckCircle size={12} color={colors.success} /> },
    failed: { label: 'Fallido', color: colors.red, icon: <XCircle size={12} color={colors.red} /> },
    pending: { label: 'Pendiente', color: colors.warning, icon: <Clock size={12} color={colors.warning} /> },
  }), [colors]);

  const sourceLabel = (src: string): string => {
    switch (src) {
      case 'broadcast': return '📢 Broadcast';
      case 'automation': return '⚡ Automatización';
      case 'ai_suggestion': return '🤖 IA';
      default: return src;
    }
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <Clock size={18} color={colors.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mensajes enviados</Text>
          <View style={[styles.badge, { backgroundColor: colors.gold + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.gold }]}>{history.length}</Text>
          </View>
        </View>

        {history.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon]}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin mensajes aún</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Los mensajes enviados aparecerán aquí</Text>
          </View>
        )}

        {history.map(msg => {
          const status = statusConfig[msg.deliveryStatus];
          return (
            <View key={msg.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.historyHeader}>
                <View style={styles.flex}>
                  <Text style={[styles.historyTitle, { color: colors.text }]}>{msg.title}</Text>
                  <Text style={[styles.historyDate, { color: colors.textMuted }]}>{formatDate(msg.sentAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                  {status.icon}
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={[styles.historyBody, { color: colors.textTertiary }]} numberOfLines={2}>{msg.body}</Text>
              <View style={[styles.historyFooter, { borderTopColor: colors.separator }]}>
                <Text style={[styles.historyMeta, { color: colors.textMuted }]}>{sourceLabel(msg.source)}</Text>
                <View style={styles.historyMetaRight}>
                  <Users size={12} color={colors.textMuted} />
                  <Text style={[styles.historyMeta, { color: colors.textMuted }]}>{msg.targetGroup} ({msg.recipientCount})</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: 'row' as const,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  tabLabelActive: {
    fontWeight: '700' as const,
  },
  sectionWrap: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  suggestionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  suggestionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 12,
  },
  sugIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sugIconText: {
    fontSize: 18,
  },
  sugInfo: {
    flex: 1,
  },
  sugName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  sugReason: {
    fontSize: 12,
    marginTop: 2,
  },
  sugMessageBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sugMessageTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  sugMessageBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  sugActions: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  sugBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  sugBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  selectStudentsBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  selectStudentsText: {
    flex: 1,
    fontSize: 14,
  },
  recipientBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  recipientText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
  },
  togglesWrap: {
    marginTop: 16,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    gap: 10,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  toggleDivider: {
    height: 0.5,
  },
  sendBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  autoCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  autoHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    gap: 12,
  },
  autoEmoji: {
    fontSize: 24,
  },
  autoName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  autoDelay: {
    fontSize: 12,
    marginTop: 2,
  },
  autoExpanded: {
    padding: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  delayOptions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  delayChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  delayChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  remindersCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  reminderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    gap: 12,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  reminderIconText: {
    fontSize: 16,
  },
  reminderText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  reminderSub: {
    fontSize: 12,
    marginTop: 2,
  },
  tplCatWrap: {
    marginBottom: 16,
  },
  tplCatTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  tplCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  tplCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 6,
  },
  tplName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  defaultBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  tplActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  tplActionBtn: {
    padding: 6,
  },
  tplTitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  tplBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  fab: {
    position: 'absolute' as const,
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  historyBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  historyFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  historyMeta: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  historyMetaRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalDoneBtn: {
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  modalDoneBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  studentPickRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  studentPickAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  studentPickAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  studentPickName: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  studentPickGoal: {
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  varHint: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  varHintText: {
    fontSize: 12,
    fontWeight: '500' as const,
    flex: 1,
  },
});
