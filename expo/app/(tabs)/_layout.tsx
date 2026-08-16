import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { LayoutDashboard, Users, ClipboardList, Brain, Menu } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useTasks } from '@/contexts/TasksContext';

function Badge({ count, color }: { count: number; color: string }) {
  if (count <= 0) return null;
  return (
    <View style={[badgeStyles.badge, { backgroundColor: color }]}>
      <Text style={badgeStyles.text}>{count > 99 ? '99' : count}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#FFF', fontSize: 10, fontWeight: '800' as const },
});

export default function TabLayout() {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const { pendingTasks } = useTasks();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500' as const,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => <Users size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Planes',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size - 4} color={color} />,
          tabBarBadge: pendingTasks.length > 0 ? pendingTasks.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Asistente',
          tabBarIcon: ({ color, size }) => <Brain size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Menu size={size - 4} color={color} />
              <Badge count={unreadCount} color={colors.danger} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
