import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Coach, SubscriptionTier } from '@/types';
import * as api from '@/utils/api';

const STORAGE_KEY = 'coach_auth';
const TOKEN_KEY = 'coach_auth_token';

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
        const [stored, storedToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
        ]);
        // A cached profile without a live token is NOT a session. Previously
        // the profile alone was treated as proof of login.
        if (stored && storedToken) {
          const { token, expiresAt } = JSON.parse(storedToken) as { token: string; expiresAt: number };
          if (token && expiresAt * 1000 > Date.now()) {
            api.setAuthToken(token);
            setCoach(JSON.parse(stored) as Coach);
            setIsAuthenticated(true);
          } else {
            await AsyncStorage.multiRemove([STORAGE_KEY, TOKEN_KEY]);
          }
        }
      } catch (e) {
        console.log('Error loading auth');
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // This used to accept ANY email/password pair and return true without
    // contacting a server. Credentials are now verified by the backend, which
    // returns a signed token scoping every subsequent request to this coach.
    try {
      const result = await api.login(email, password);
      const coachData: Coach = {
        ...defaultCoach,
        id: result.coach.id,
        email: result.coach.email,
      };
      api.setAuthToken(result.token);
      await AsyncStorage.multiSet([
        [STORAGE_KEY, JSON.stringify(coachData)],
        [TOKEN_KEY, JSON.stringify({ token: result.token, expiresAt: result.expiresAt })],
      ]);
      setCoach(coachData);
      setIsAuthenticated(true);
      return true;
    } catch {
      // Never log the submitted email or password.
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      api.setAuthToken(null);
      await AsyncStorage.multiRemove([STORAGE_KEY, TOKEN_KEY]);
      setCoach(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.log('Logout error');
    }
  }, []);

  // An expired or revoked token must drop the local session immediately,
  // otherwise the UI keeps showing cached athlete data as if still logged in.
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      api.setAuthToken(null);
      AsyncStorage.multiRemove([STORAGE_KEY, TOKEN_KEY]).catch(() => {});
      setCoach(null);
      setIsAuthenticated(false);
    });
    return () => api.setUnauthorizedHandler(null);
  }, []);

  const updateSubscription = useCallback(async (tier: SubscriptionTier) => {
    if (!coach) return;
    const updated = { ...coach, subscription: tier };
    setCoach(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [coach]);

  return { coach, isLoading, isAuthenticated, login, logout, updateSubscription };
});
