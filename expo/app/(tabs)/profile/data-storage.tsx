import React from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  SettingsSection,
  SettingsButton,
  SettingsNavRow,
} from '@/components/settings/SettingsRow';
import { Trash2, HardDrive, Upload, Download, Clock, FileText } from 'lucide-react-native';
import { clearDocumentCache } from '@/utils/documentService';

export default function DataStorageScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Data & Storage', headerTintColor: colors.gold }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <SettingsSection title="Storage Usage">
          <View style={styles.storageCard}>
            <View style={styles.storageRow}>
              <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>Images & Photos</Text>
              <Text style={[styles.storageValue, { color: colors.gold }]}>24.3 MB</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>Documents</Text>
              <Text style={[styles.storageValue, { color: colors.gold }]}>8.1 MB</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>AI Cache</Text>
              <Text style={[styles.storageValue, { color: colors.gold }]}>3.7 MB</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>Logs</Text>
              <Text style={[styles.storageValue, { color: colors.gold }]}>1.2 MB</Text>
            </View>
            <View style={[styles.storageDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.storageRow}>
              <Text style={[styles.storageTotalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.storageTotalValue, { color: colors.gold }]}>37.3 MB</Text>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title="Cache Management">
          <SettingsNavRow
            label="Limpiar caché de documentos"
            description="Eliminar documentos descargados del caché local"
            icon={<FileText size={18} color={colors.orange} />}
            onPress={() => {
              Alert.alert(
                'Limpiar caché de documentos',
                'Se eliminarán todos los documentos descargados. Se volverán a descargar cuando los abras.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Limpiar',
                    style: 'destructive',
                    onPress: async () => {
                      const success = await clearDocumentCache();
                      if (success) {
                        Alert.alert('Listo', 'Caché de documentos limpiado correctamente.');
                      } else {
                        Alert.alert('Error', 'No se pudo limpiar el caché.');
                      }
                    },
                  },
                ]
              );
            }}
          />
          <SettingsNavRow
            label="Clear Image Cache"
            description="Remove cached athlete photos"
            icon={<Trash2 size={18} color={colors.red} />}
            onPress={() => Alert.alert('Clear Cache', 'Image cache cleared successfully.')}
          />
          <SettingsNavRow
            label="Clear Logs"
            description="Remove debug and activity logs"
            icon={<Trash2 size={18} color={colors.warning} />}
            onPress={() => Alert.alert('Clear Logs', 'All logs have been cleared.')}
          />
        </SettingsSection>

        <SettingsSection title="Backup & Restore">
          <SettingsNavRow
            label="Create Local Backup"
            description="Save all data to device storage"
            icon={<HardDrive size={18} color={colors.blue} />}
            onPress={() => Alert.alert('Backup', 'Local backup created successfully.')}
          />
          <SettingsNavRow
            label="Create Cloud Backup"
            description="Sync backup to cloud storage"
            icon={<Upload size={18} color={colors.green} />}
            onPress={() => Alert.alert('Cloud Backup', 'Cloud backup initiated.')}
          />
          <SettingsNavRow
            label="Restore from Backup"
            description="Restore data from a previous backup"
            icon={<Download size={18} color={colors.purple} />}
            onPress={() => {
              Alert.alert('Restore', 'Select a backup source to restore from.', [
                { text: 'Local', onPress: () => console.log('Restore from local') },
                { text: 'Cloud', onPress: () => console.log('Restore from cloud') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
          <SettingsNavRow
            label="Schedule Weekly Backups"
            description="Automatically backup every week"
            icon={<Clock size={18} color={colors.teal} />}
            onPress={() => Alert.alert('Schedule', 'Weekly automatic backups enabled.')}
          />
        </SettingsSection>

        <SettingsSection title="Import Data">
          <SettingsButton
            label="Import Athletes (CSV)"
            onPress={() => Alert.alert('Import', 'Select a CSV file with athlete data to import.')}
            variant="gold"
          />
          <View style={{ height: 8 }} />
          <SettingsButton
            label="Import Plan Templates"
            onPress={() => Alert.alert('Import', 'Select plan template files to import.')}
            variant="gold"
          />
        </SettingsSection>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  spacer: { height: 20 },
  storageCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  storageRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  storageLabel: {
    fontSize: 14,
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  storageDivider: {
    height: 0.5,
    marginVertical: 6,
  },
  storageTotalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  storageTotalValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as const,
  },
});
