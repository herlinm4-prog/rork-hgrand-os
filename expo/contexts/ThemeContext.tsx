import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import Colors, { ThemeColors, ThemeVariant } from '@/constants/colors';
import { useSettings } from '@/contexts/SettingsContext';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type { ThemeVariant };

const STORAGE_KEY = 'app_theme_mode';
const VARIANT_STORAGE_KEY = 'app_theme_variant';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('light');
  /* Default to the Neural OS look on iPhone so iOS users get the pixel-tuned
     home experience out of the box. Other platforms keep the classic look. */
  const [variant, setVariant] = useState<ThemeVariant>(Platform.OS === 'ios' ? 'neural' : 'classic');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const { settings } = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        const [stored, storedVariant] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(VARIANT_STORAGE_KEY),
        ]);
        if (stored === 'light' || stored === 'dark' || stored === 'auto') {
          setMode(stored);
        }
        if (storedVariant === 'classic' || storedVariant === 'neural') {
          setVariant(storedVariant);
        }
      } catch (e) {
        console.log('Error loading theme:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const setThemeMode = useCallback(async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  }, []);

  const setThemeVariant = useCallback(async (newVariant: ThemeVariant) => {
    setVariant(newVariant);
    try {
      await AsyncStorage.setItem(VARIANT_STORAGE_KEY, newVariant);
    } catch (e) {
      console.log('Error saving theme variant:', e);
    }
  }, []);

  const resolvedScheme = useMemo((): 'light' | 'dark' => {
    if (mode === 'auto') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return mode;
  }, [mode, systemScheme]);

  const colors: ThemeColors = useMemo(() => {
    if (variant === 'neural') {
      return resolvedScheme === 'light' ? Colors.neuralLight : Colors.neuralDark;
    }
    return resolvedScheme === 'light' ? Colors.light : Colors.dark;
  }, [resolvedScheme, variant]);

  const isDark = resolvedScheme === 'dark';

  return { colors, isDark, mode, setThemeMode, variant, setThemeVariant, isLoaded };
});
