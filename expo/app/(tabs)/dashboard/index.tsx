import React from 'react';
import { Stack } from 'expo-router';
import CommandCenter from '@/components/os/CommandCenter';

export default function DashboardScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CommandCenter />
    </>
  );
}
