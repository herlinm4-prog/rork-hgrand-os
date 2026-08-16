// components/ErrorBoundary.tsx
// HGRAND OS — crash resilience. Catches render errors, shows a premium
// recovery screen instead of a white crash.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Shield, RefreshCw } from 'lucide-react-native';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[HGRAND OS] Crash intercepted:', error.message);
    console.error('[HGRAND OS] Component stack:', info.componentStack?.substring(0, 500));
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <SafeAreaView style={styles.root}>
          <View style={styles.content}>
            <View style={styles.shieldWrap}>
              <Shield size={40} color="#B8922E" />
            </View>
            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={styles.subtitle}>
              HGRAND OS encontró un error inesperado. Tus datos están seguros.
            </Text>
            {this.state.error && (
              <Text style={styles.errorText} numberOfLines={3}>
                {this.state.error.message}
              </Text>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <RefreshCw size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  shieldWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B8922E15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  errorText: {
    fontSize: 11,
    color: '#48484A',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B8922E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
