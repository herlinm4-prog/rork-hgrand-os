import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, glowAnim]);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Enter your email');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/(tabs)/dashboard');
      } else {
        setError('Login failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.glowOrb, { opacity: glowAnim }]}>
        <LinearGradient
          colors={['#B8922E18', '#B8922E08', 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View
          style={[
            styles.inner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.logoSection}>
            <View style={[styles.logoContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Dumbbell size={36} color={colors.gold} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>HGRAND OS</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              Elite Coaching Platform
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="login-email"
              />
              <View style={[styles.inputSeparator, { backgroundColor: colors.separator }]} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                testID="login-password"
              />
            </View>

            {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.gold }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
              testID="login-button"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.loginInner}>
                  <Text style={styles.loginText}>Sign In</Text>
                  <ChevronRight size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoButton} onPress={() => {
              setEmail('coach@fitpro.com');
              setPassword('demo');
            }}>
              <Text style={[styles.demoText, { color: colors.gold }]}>Use demo account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOrb: {
    position: 'absolute' as const,
    top: -100,
    left: -50,
    right: -50,
    height: 400,
  },
  glowGradient: {
    flex: 1,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  inner: {
    width: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    marginTop: 8,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
  },
  input: {
    paddingHorizontal: 18,
    height: 54,
    fontSize: 16,
  },
  inputSeparator: {
    height: 0.5,
    marginLeft: 18,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center' as const,
  },
  loginButton: {
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginInner: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
  },
  loginText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  demoText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
});
