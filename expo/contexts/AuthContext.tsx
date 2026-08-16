import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Coach, SubscriptionTier } from '@/types';

const STORAGE_KEY = 'coach_auth';

const defaultCoach: Coach = {
  id: '1',
  name: 'Coach Demo',
  email: 'coach@fitpro.com',
  specialties: ['Bodybuilding', 'Nutrición deportiva', 'Pérdida de grasa'],
  subscription: 'monthly',
  studentsCount: 5,
  createdAt: '2025-06-01',
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Coach;
          setCoach(parsed);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.log('Error loading auth:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Logging in with:', email);
      const coachData: Coach = {
        ...defaultCoach,
        email,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(coachData));
      setCoach(coachData);
      setIsAuthenticated(true);
      return true;
    } catch (e) {
      console.log('Login error:', e);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setCoach(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.log('Logout error:', e);
    }
  }, []);

  const updateSubscription = useCallback(async (tier: SubscriptionTier) => {
    if (!coach) return;
    const updated = { ...coach, subscription: tier };
    setCoach(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [coach]);

  return { coach, isLoading, isAuthenticated, login, logout, updateSubscription };
});
