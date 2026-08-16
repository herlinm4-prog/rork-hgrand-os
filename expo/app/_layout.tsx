import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { StudentsProvider } from "@/contexts/StudentsContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AutomationProvider } from "@/contexts/AutomationContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";

void SplashScreen.preventAutoHideAsync();

// Suppress noisy react-native-web warnings about non-boolean DOM attributes
// (e.g. `collapsable`) leaked by Animated.View, react-native-svg, lucide icons, etc.
// These are harmless and not caused by user code.
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string') {
      if (
        first.includes('Received `%s` for a non-boolean attribute `%s`') ||
        (first.includes('non-boolean attribute') && args.some((a) => a === 'collapsable'))
      ) {
        return;
      }
    }
    origError(...(args as []));
  };
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
        headerBackTitle: "Atrás",
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.tint,
        headerTitleStyle: { color: colors.text, fontWeight: '600' as const, fontSize: 17 },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerBlurEffect: isDark ? 'dark' : 'light',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="student/[id]" options={{ title: "Alumno" }} />
      <Stack.Screen name="checkin/[studentId]" options={{ title: "Nuevo Check-in" }} />
      <Stack.Screen name="nutrition-plan/[studentId]" options={{ title: "Plan Nutricional" }} />
      <Stack.Screen name="document-viewer" options={{ presentation: 'fullScreenModal', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="tasks" options={{ title: 'Panel de Tareas' }} />
      <Stack.Screen name="meal-plan-builder" options={{ title: 'Meal Plan Builder' }} />
      <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SettingsProvider>
            <ThemeProvider>
              <AuthProvider>
                <StudentsProvider>
                  <AutomationProvider>
                    <TasksProvider>
                      <NotificationsProvider>
                        <RootLayoutNav />
                      </NotificationsProvider>
                    </TasksProvider>
                  </AutomationProvider>
                </StudentsProvider>
              </AuthProvider>
            </ThemeProvider>
          </SettingsProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
