import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts, MAX_WIDTH, radius, space, useColors } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

const variants = StyleSheet.create({
  display: { fontFamily: fonts.heavy, fontSize: 40, lineHeight: 42, letterSpacing: -1 },
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
});

export function AppText({
  variant = 'body',
  color,
  style,
  ...props
}: TextProps & { variant?: Variant; color?: string }) {
  const c = useColors();
  return <Text {...props} style={[variants[variant], { color: color ?? c.ink }, style]} />;
}

/** Güvenli alan + ortalanmış içerik sütunu. Web'de geniş ekranda 640px'te sabitlenir. */
export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const inner = <View style={[styles.column, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.bg }]} edges={['bottom', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.scrollContent]}>{inner}</View>
      )}
    </SafeAreaView>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const palette = {
    primary: { bg: c.accent, fg: c.accentInk, border: c.accent },
    secondary: { bg: c.surface, fg: c.ink, border: c.border },
    ghost: { bg: 'transparent', fg: c.inkSoft, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: focused ? c.ink : palette.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <AppText variant="label" color={palette.fg}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

export function TextField({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: space.xs }}>
      <AppText variant="caption" color={c.inkSoft}>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={c.inkSoft}
        {...props}
        style={[
          styles.input,
          { backgroundColor: c.surface, borderColor: c.border, color: c.ink, fontFamily: fonts.medium },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  column: { width: '100%', maxWidth: MAX_WIDTH, padding: space.lg, gap: space.lg, flexGrow: 1 },
  button: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 50,
    borderWidth: 2,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    fontSize: 16,
  },
});
