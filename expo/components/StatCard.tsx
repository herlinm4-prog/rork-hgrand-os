import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}

export default React.memo(function StatCard({ label, value, icon }: StatCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
  },
  iconWrap: {
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
  },
});
