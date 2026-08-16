import React, { useRef, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
  TextInput,
  findNodeHandle,
} from 'react-native';

interface KeyboardSafeViewProps extends ScrollViewProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  scrollContentStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
  enableAutoscroll?: boolean;
}

export default function KeyboardSafeView({
  children,
  containerStyle,
  scrollContentStyle,
  keyboardVerticalOffset,
  enableAutoscroll = true,
  ...scrollViewProps
}: KeyboardSafeViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const offset = keyboardVerticalOffset ?? (Platform.OS === 'ios' ? 100 : 20);

  const handleFocus = useCallback(() => {
    if (!enableAutoscroll) return;
    const currentlyFocused = TextInput.State.currentlyFocusedInput?.();
    if (currentlyFocused && scrollViewRef.current) {
      const nodeHandle = findNodeHandle(scrollViewRef.current);
      if (nodeHandle) {
        setTimeout(() => {
          currentlyFocused.measureLayout(
            nodeHandle,
            (_x: number, y: number, _w: number, h: number) => {
              scrollViewRef.current?.scrollTo({
                y: Math.max(0, y - 120),
                animated: true,
              });
            },
            () => {}
          );
        }, 300);
      }
    }
  }, [enableAutoscroll]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={scrollContentStyle}
        onTouchStart={handleFocus}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
