import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function DashboardLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' as const },
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
