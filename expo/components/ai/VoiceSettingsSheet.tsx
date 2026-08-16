// components/ai/VoiceSettingsSheet.tsx
// Premium voice settings — language tabs (ES/EN), 3 voices per language,
// speed selector, auto-listen toggle, silence timeout.
// Apple HIG spacing, dark glass-morphism, neural red accents.

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { X, Check, Gauge, Clock, Mic, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  VOICE_PRESETS,
  type VoiceSettings,
  type VoiceLanguage,
  type VoiceGender,
  type VoiceSpeed,
} from '@/types/settings';

interface VoiceSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdate: (patch: Partial<VoiceSettings>) => void;
}

const SPEED_OPTIONS: { key: VoiceSpeed; label: string; desc: string; value: number }[] = [
  { key: 'slow', label: 'Pausada', desc: 'Clara, ideal para explicaciones', value: 0.8 },
  { key: 'normal', label: 'Natural', desc: 'Conversación equilibrada', value: 1.0 },
  { key: 'fast', label: 'Rápida', desc: 'Ágil, para diálogos fluidos', value: 1.2 },
];

const GENDER_LABELS: Record<VoiceGender, string> = {
  female: 'Femenina',
  male: 'Masculina',
};

const GENDER_ICONS: Record<VoiceGender, string> = {
  female: '♀',
  male: '♂',
};

export function VoiceSettingsSheet({
  visible,
  onClose,
  settings,
  onUpdate,
}: VoiceSettingsSheetProps) {
  const [activeTab, setActiveTab] = useState<VoiceLanguage>('es');

  const filteredPresets = useMemo(
    () => VOICE_PRESETS.filter((p) => p.language === activeTab),
    [activeTab],
  );

  const currentPreset = VOICE_PRESETS.find((p) => p.id === settings.voicePresetId) ?? VOICE_PRESETS[0];

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUpdate({ voicePresetId: presetId });
    },
    [onUpdate],
  );

  const handleSelectSpeed = useCallback(
    (speed: VoiceSpeed) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUpdate({ speed });
    },
    [onUpdate],
  );

  const handleToggleAutoListen = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate({ autoListen: !settings.autoListen });
  }, [onUpdate, settings.autoListen]);

  const silenceOptions = [
    { value: 1000, label: '1s', desc: 'Respuesta inmediata' },
    { value: 1500, label: '1.5s', desc: 'Natural' },
    { value: 2500, label: '2.5s', desc: 'Más pausa' },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.sheet}>
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Voz del Asistente</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Language tabs ─────────────────────────────────── */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'es' && styles.tabActive]}
              onPress={() => setActiveTab('es')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'es' && styles.tabTextActive]}>
                Español
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'en' && styles.tabActive]}
              onPress={() => setActiveTab('en')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'en' && styles.tabTextActive]}>
                English
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Voice cards ────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>
            {activeTab === 'es' ? 'SELECCIONA UNA VOZ' : 'SELECT A VOICE'}
          </Text>
          <View style={ styles.voiceGrid }>
            {filteredPresets.map((preset) => {
              const isActive = preset.id === settings.voicePresetId;
              const isMale = preset.gender === 'male';
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.voiceCard, isActive && styles.voiceCardActive]}
                  onPress={() => handleSelectPreset(preset.id)}
                  activeOpacity={0.7}
                >
                  {/* Avatar circle */}
                  <View style={[styles.voiceAvatar, isActive && styles.voiceAvatarActive]}>
                    <Text style={[styles.voiceAvatarEmoji, isActive && styles.voiceAvatarEmojiActive]}>
                      {isMale ? '♂' : '♀'}
                    </Text>
                  </View>

                  {/* Name + gender pill */}
                  <View style={styles.voiceInfo}>
                    <Text style={[styles.voiceName, isActive && styles.voiceNameActive]}>
                      {preset.name}
                    </Text>
                    <View style={[styles.genderPill, isActive && styles.genderPillActive]}>
                      <Text style={[styles.genderPillText, isActive && styles.genderPillTextActive]}>
                        {preset.gender === 'female' ? '♀ Femenina' : '♂ Masculina'}
                        {preset.id === 'hector' || preset.id === 'titan' ? ' grave' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Check indicator */}
                  {isActive && (
                    <View style={styles.checkBadge}>
                      <Check size={12} color="#fff" />
                    </View>
                  )}

                  {/* Description */}
                  <Text style={styles.voiceDesc} numberOfLines={2}>
                    {preset.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Current selection summary ─────────────────────── */}
          <View style={styles.currentBadge}>
            <View style={styles.currentDot} />
            <Text style={styles.currentText}>
              {activeTab === 'es' ? 'Voz actual: ' : 'Current voice: '}
              <Text style={styles.currentName}>{currentPreset.name}</Text>
              {' · '}
              {currentPreset.language === 'es' ? 'Español' : 'English'}
              {' · '}
              {currentPreset.gender === 'female' ? '♀' : '♂'}
            </Text>
          </View>

          {/* ── Speed selector ────────────────────────────────── */}
          <Text style={styles.sectionLabel}>
            {activeTab === 'es' ? 'VELOCIDAD AL HABLAR' : 'SPEAKING SPEED'}
          </Text>
          <View style={styles.speedRow}>
            {SPEED_OPTIONS.map((opt) => {
              const isActive = opt.key === settings.speed;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.speedChip, isActive && styles.speedChipActive]}
                  onPress={() => handleSelectSpeed(opt.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.speedLeft}>
                    <View style={[styles.speedRadio, isActive && styles.speedRadioActive]}>
                      {isActive && <View style={styles.speedRadioInner} />}
                    </View>
                    <View>
                      <Text style={[styles.speedLabel, isActive && styles.speedLabelActive]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.speedDesc}>{opt.desc}</Text>
                    </View>
                  </View>
                  <View style={styles.speedBars}>
                    {[1, 2, 3].map((bar) => (
                      <View
                        key={bar}
                        style={[
                          styles.speedBar,
                          { height: 6 + bar * 4 },
                          bar <= SPEED_OPTIONS.indexOf(opt) + 1 && isActive
                            ? styles.speedBarActive
                            : styles.speedBarInactive,
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Auto-listen toggle ────────────────────────────── */}
          <Text style={styles.sectionLabel}>
            {activeTab === 'es' ? 'COMPORTAMIENTO' : 'BEHAVIOR'}
          </Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={handleToggleAutoListen}
            activeOpacity={0.7}
          >
            <View style={styles.toggleLeft}>
              <Mic size={18} color="rgba(255,255,255,0.6)" />
              <View style={styles.toggleTextWrap}>
                <Text style={styles.toggleLabel}>
                  {activeTab === 'es' ? 'Escucha automática' : 'Auto-listen'}
                </Text>
                <Text style={styles.toggleHint}>
                  {activeTab === 'es'
                    ? 'Sol vuelve a escuchar después de cada respuesta'
                    : 'Sol listens again after each response'}
                </Text>
              </View>
            </View>
            <View style={[styles.toggleSwitch, settings.autoListen && styles.toggleSwitchOn]}>
              <View style={[styles.toggleKnob, settings.autoListen && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>

          {/* ── Silence timeout ────────────────────────────────── */}
          <Text style={styles.sectionLabel}>
            {activeTab === 'es' ? 'TIEMPO DE SILENCIO' : 'SILENCE TIMEOUT'}
          </Text>
          <Text style={styles.hintText}>
            {activeTab === 'es'
              ? 'Cuánto espera Sol después de que dejas de hablar para procesar tu mensaje'
              : 'How long Sol waits after you stop talking to process your message'}
          </Text>
          <View style={styles.silenceRow}>
            {silenceOptions.map((opt) => {
              const isActive = opt.value === settings.silenceTimeout;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.silenceChip, isActive && styles.silenceChipActive]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onUpdate({ silenceTimeout: opt.value });
                  }}
                  activeOpacity={0.7}
                >
                  <Clock
                    size={14}
                    color={isActive ? '#E5484D' : 'rgba(255,255,255,0.4)'}
                  />
                  <Text style={[styles.silenceLabel, isActive && styles.silenceLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.silenceDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ── Language tabs ────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // ── Section labels ───────────────────────────────────────
  sectionLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    marginTop: 24,
  },
  hintText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },

  // ── Voice cards ──────────────────────────────────────────
  voiceGrid: {
    gap: 10,
  },
  voiceCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    position: 'relative' as const,
  },
  voiceCardActive: {
    backgroundColor: 'rgba(229,72,77,0.10)',
    borderColor: 'rgba(229,72,77,0.30)',
  },
  voiceAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  voiceAvatarActive: {
    backgroundColor: '#E5484D',
  },
  voiceAvatarEmoji: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
  },
  voiceAvatarEmojiActive: {
    color: '#FFFFFF',
  },
  voiceInfo: {
    flex: 1,
    marginRight: 8,
  },
  voiceName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  voiceNameActive: {
    color: '#FFFFFF',
  },
  genderPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  genderPillActive: {
    backgroundColor: 'rgba(229,72,77,0.20)',
  },
  genderPillText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  genderPillTextActive: {
    color: 'rgba(229,72,77,0.9)',
  },
  checkBadge: {
    position: 'absolute' as const,
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceDesc: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 11,
    marginTop: 10,
    lineHeight: 16,
    width: '100%' as any,
  },

  // ── Current badge ────────────────────────────────────────
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(229,72,77,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5484D',
  },
  currentText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  currentName: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700' as const,
  },

  // ── Speed selector ───────────────────────────────────────
  speedRow: {
    gap: 8,
  },
  speedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  speedChipActive: {
    backgroundColor: 'rgba(229,72,77,0.08)',
    borderColor: 'rgba(229,72,77,0.25)',
  },
  speedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  speedRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedRadioActive: {
    borderColor: '#E5484D',
  },
  speedRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5484D',
  },
  speedLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  speedLabelActive: {
    color: '#FFFFFF',
  },
  speedDesc: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    marginTop: 2,
  },
  speedBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
  },
  speedBar: {
    width: 4,
    borderRadius: 2,
  },
  speedBarActive: {
    backgroundColor: '#E5484D',
  },
  speedBarInactive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Toggle ───────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  toggleHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleSwitchOn: {
    backgroundColor: '#E5484D',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start' as const,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end' as const,
  },

  // ── Silence timeout ──────────────────────────────────────
  silenceRow: {
    gap: 8,
  },
  silenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  silenceChipActive: {
    backgroundColor: 'rgba(229,72,77,0.08)',
    borderColor: 'rgba(229,72,77,0.2)',
  },
  silenceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600' as const,
    minWidth: 50,
  },
  silenceLabelActive: {
    color: '#E5484D',
  },
  silenceDesc: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
  },

  bottomSpacer: {
    height: 40,
  },
});
