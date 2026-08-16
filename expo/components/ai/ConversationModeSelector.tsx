import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Briefcase, User, FileOutput } from 'lucide-react-native';
import { ConversationMode, CONVERSATION_MODE_LABELS, CONVERSATION_MODE_DESCRIPTIONS } from '@/types/ai';
import { ThemeColors } from '@/constants/colors';

const MODE_ICONS: Record<ConversationMode, React.ComponentType<{ size: number; color: string }>> = {
  coach: Briefcase,
  client: User,
  document: FileOutput,
};

const MODE_COLORS: Record<ConversationMode, string> = {
  coach: '#3B82F6',
  client: '#10B981',
  document: '#F59E0B',
};

interface ConversationModeSelectorProps {
  colors: ThemeColors;
  currentMode: ConversationMode;
  onSelect: (mode: ConversationMode) => void;
  onClose: () => void;
}

function ConversationModeSelectorComponent({ colors, currentMode, onSelect, onClose }: ConversationModeSelectorProps) {
  const modes: ConversationMode[] = ['coach', 'client', 'document'];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Modo de respuesta</Text>
      {modes.map((mode) => {
        const IconComp = MODE_ICONS[mode];
        const isActive = mode === currentMode;
        const modeColor = MODE_COLORS[mode];
        return (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeRow,
              { backgroundColor: isActive ? modeColor + '12' : 'transparent' },
            ]}
            onPress={() => { onSelect(mode); onClose(); }}
            activeOpacity={0.7}
          >
            <View style={[styles.modeIcon, { backgroundColor: modeColor + '18' }]}>
              <IconComp size={16} color={modeColor} />
            </View>
            <View style={styles.modeInfo}>
              <Text style={[styles.modeName, { color: isActive ? modeColor : colors.text }]}>
                {CONVERSATION_MODE_LABELS[mode]}
              </Text>
              <Text style={[styles.modeDesc, { color: colors.textMuted }]}>
                {CONVERSATION_MODE_DESCRIPTIONS[mode]}
              </Text>
            </View>
            {isActive && (
              <View style={[styles.activeDot, { backgroundColor: modeColor }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const ConversationModeSelector = React.memo(ConversationModeSelectorComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 10,
  },
  modeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modeDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
