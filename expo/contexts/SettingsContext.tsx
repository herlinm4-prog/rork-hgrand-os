import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { AllSettings, DEFAULT_SETTINGS } from '@/types/settings';

const SETTINGS_KEY = 'app_settings_v1';

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (e) {
        console.log('Error loading settings:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const persist = useCallback(async (updated: AllSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving settings:', e);
    }
  }, []);

  const updateAppearance = useCallback((patch: Partial<AllSettings['appearance']>) => {
    setSettings(prev => {
      const next = { ...prev, appearance: { ...prev.appearance, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateLanguage = useCallback((patch: Partial<AllSettings['language']>) => {
    setSettings(prev => {
      const next = { ...prev, language: { ...prev.language, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateDocuments = useCallback((patch: Partial<AllSettings['documents']>) => {
    setSettings(prev => {
      const next = { ...prev, documents: { ...prev.documents, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateAI = useCallback((patch: Partial<AllSettings['ai']>) => {
    setSettings(prev => {
      const next = { ...prev, ai: { ...prev.ai, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateNotifications = useCallback((patch: Partial<AllSettings['notifications']>) => {
    setSettings(prev => {
      const next = { ...prev, notifications: { ...prev.notifications, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updatePrivacy = useCallback((patch: Partial<AllSettings['privacy']>) => {
    setSettings(prev => {
      const next = { ...prev, privacy: { ...prev.privacy, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateVoice = useCallback((patch: Partial<AllSettings['voice']>) => {
    setSettings(prev => {
      const next = { ...prev, voice: { ...prev.voice, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateBrand = useCallback((patch: Partial<AllSettings['brand']>) => {
    setSettings(prev => {
      const next = { ...prev, brand: { ...prev.brand, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateAdvanced = useCallback((patch: Partial<AllSettings['advanced']>) => {
    setSettings(prev => {
      const next = { ...prev, advanced: { ...prev.advanced, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetAll = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
  }, [persist]);

  const resetSection = useCallback(<K extends keyof AllSettings>(section: K) => {
    setSettings(prev => {
      const next = { ...prev, [section]: DEFAULT_SETTINGS[section] };
      persist(next);
      return next;
    });
  }, [persist]);

  return {
    settings,
    isLoaded,
    updateAppearance,
    updateLanguage,
    updateDocuments,
    updateAI,
    updateVoice,
    updateBrand,
    updateNotifications,
    updatePrivacy,
    updateAdvanced,
    resetAll,
    resetSection,
  };
});
