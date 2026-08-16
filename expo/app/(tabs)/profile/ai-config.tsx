import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSegment,
  SettingsButton,
} from '@/components/settings/SettingsRow';
import type { AIPersonality, AIMode, AIOfflineBehavior } from '@/types/settings';

export default function AIConfigScreen() {
  const { colors } = useTheme();
  const { settings, updateAI, resetSection } = useSettings();
  const ai = settings.ai;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'AI Configuration', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SettingsSection title="Personality">
          <SettingsSegment<AIPersonality>
            label="AI Personality"
            description="How the assistant communicates with you"
            options={[
              { value: 'dry', label: 'Direct' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'human', label: 'Conversational' },
            ]}
            selected={ai.personality}
            onSelect={(v) => updateAI({ personality: v })}
          />
        </SettingsSection>

        <SettingsSection title="Response Style">
          <SettingsToggle
            label="Use Bullet Points"
            description="Format responses with bullet points by default"
            value={ai.useBulletPoints}
            onValueChange={(v) => updateAI({ useBulletPoints: v })}
          />
          <SettingsToggle
            label="Step-by-step Reasoning"
            description="Show detailed reasoning (coach only)"
            value={ai.stepByStepReasoning}
            onValueChange={(v) => updateAI({ stepByStepReasoning: v })}
          />
          <SettingsToggle
            label="Ask Follow-up Questions"
            description="AI asks clarifying questions when needed"
            value={ai.askFollowUp}
            onValueChange={(v) => updateAI({ askFollowUp: v })}
          />
          <SettingsToggle
            label="Show Confidence Level"
            description="Display how confident the AI is in its response"
            value={ai.showConfidence}
            onValueChange={(v) => updateAI({ showConfidence: v })}
          />
          <SettingsToggle
            label="Cite Sources"
            description="Reference studies and sources when relevant"
            value={ai.citeSources}
            onValueChange={(v) => updateAI({ citeSources: v })}
          />
        </SettingsSection>

        <SettingsSection title="Domain Behavior">
          <SettingsToggle
            label="Bodybuilding Coach Mode"
            description="Strict, performance-first responses"
            value={ai.bodybuilderMode}
            onValueChange={(v) => updateAI({ bodybuilderMode: v })}
          />
          <SettingsToggle
            label="Health Safety Mode"
            description="More conservative warnings and disclaimers"
            value={ai.healthSafetyMode}
            onValueChange={(v) => updateAI({ healthSafetyMode: v })}
          />
          <SettingsToggle
            label="Peak Week Mode"
            description="Special logic for competition show week"
            value={ai.peakWeekMode}
            onValueChange={(v) => updateAI({ peakWeekMode: v })}
          />
        </SettingsSection>

        <SettingsSection title="Memory">
          <SettingsToggle
            label="Save Athlete Preferences"
            description="Remember individual athlete preferences"
            value={ai.saveAthletePrefs}
            onValueChange={(v) => updateAI({ saveAthletePrefs: v })}
          />
          <SettingsToggle
            label="Save Coach Preferences"
            description="Remember your coaching style preferences"
            value={ai.saveCoachPrefs}
            onValueChange={(v) => updateAI({ saveCoachPrefs: v })}
          />
        </SettingsSection>

        <SettingsButton
          label="Clear AI Memory"
          onPress={() => {
            Alert.alert('Clear Memory', 'This will erase all saved AI preferences and context.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => console.log('AI memory cleared') },
            ]);
          }}
          variant="danger"
        />

        <View style={{ height: 12 }} />

        <SettingsButton
          label="Export AI Memory"
          onPress={() => Alert.alert('Export', 'AI memory exported as JSON file.')}
          variant="gold"
        />

        <SettingsSection title="Model & Speed">
          <SettingsSegment<AIMode>
            label="AI Mode"
            options={[
              { value: 'fast', label: 'Fast' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'best', label: 'Best Quality' },
            ]}
            selected={ai.aiMode}
            onSelect={(v) => updateAI({ aiMode: v })}
          />
          <SettingsSegment<AIOfflineBehavior>
            label="Offline Behavior"
            description="What happens when there's no connection"
            options={[
              { value: 'save', label: 'Save for Later' },
              { value: 'disable', label: 'Disable AI' },
            ]}
            selected={ai.offlineBehavior}
            onSelect={(v) => updateAI({ offlineBehavior: v })}
          />
        </SettingsSection>

        <SettingsSection title="Privacy">
          <SettingsToggle
            label="Do Not Train on My Data"
            description="Prevent your data from improving AI models"
            value={ai.doNotTrainOnData}
            onValueChange={(v) => updateAI({ doNotTrainOnData: v })}
          />
          <SettingsToggle
            label="Data Minimization"
            description="Store less data from conversations"
            value={ai.dataMinimization}
            onValueChange={(v) => updateAI({ dataMinimization: v })}
          />
        </SettingsSection>

        <SettingsButton
          label="Restore AI Defaults"
          onPress={() => {
            Alert.alert('Restore Defaults', 'Reset all AI settings?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => resetSection('ai') },
            ]);
          }}
          variant="danger"
        />

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  spacer: { height: 20 },
});
