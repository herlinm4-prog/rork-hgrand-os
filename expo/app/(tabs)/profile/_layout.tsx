import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.gold,
        headerTitleStyle: { fontWeight: '600' as const, color: colors.text, fontSize: 17 },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    />
  );
}
