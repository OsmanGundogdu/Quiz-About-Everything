import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { categories } from '@/data/categories';
import { AuthError } from '@/services/backend';
import { radius, space, useColors } from '@/theme';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Redirect href="/" />;

  async function submit() {
    setError(null);
    if (!username.trim() || !password) {
      setError('Kullanıcı adı ve şifreyi doldur.');
      return;
    }
    setBusy(true);
    try {
      await (mode === 'login' ? login(username, password) : register(username, password));
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Bir şeyler ters gitti. Tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.hero, { backgroundColor: c.hero, paddingTop: insets.top + space.xxl }]}>
        <View style={styles.heroInner}>
          <View style={styles.emojiRow}>
            {categories.map((cat) => (
              <View key={cat.id} style={[styles.emojiChip, { backgroundColor: cat.color }]}>
                <AppText style={styles.emoji}>{cat.icon}</AppText>
              </View>
            ))}
          </View>
          <AppText variant="display" color={c.heroInk}>
            Quiz About Everything
          </AppText>
          <AppText color={c.heroInkSoft}>
            Kodlamadan matematiğe, Türkçeden genel kültüre: kendini dene, puanını gör.
          </AppText>
        </View>
      </View>

      <Screen contentStyle={{ paddingTop: space.xl }}>
        <View style={[styles.toggle, { backgroundColor: c.surfaceMuted }]} accessibilityRole="tablist">
          {(['login', 'register'] as const).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}
                style={[styles.toggleItem, active && { backgroundColor: c.surface }]}
              >
                <AppText variant="label" color={active ? c.ink : c.inkSoft}>
                  {m === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <TextField
          label="Kullanıcı adı"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="ör. osman"
          returnKeyType="next"
        />
        <TextField
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={mode === 'register' ? 'En az 6 karakter' : ''}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        {error && (
          <View style={[styles.error, { backgroundColor: c.wrongBg }]} accessibilityLiveRegion="polite">
            <AppText variant="caption" color={c.wrong}>
              {error}
            </AppText>
          </View>
        )}

        <Button title={mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'} onPress={submit} loading={busy} />

        <AppText variant="caption" color={c.inkSoft} style={{ textAlign: 'center' }}>
          Hesabın şimdilik bu cihazda saklanıyor.
        </AppText>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingHorizontal: space.lg, paddingBottom: space.xxl },
  heroInner: { width: '100%', maxWidth: 640, gap: space.md },
  emojiRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  emojiChip: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22, lineHeight: 28 },
  toggle: { flexDirection: 'row', padding: 4, borderRadius: radius.md },
  toggleItem: { flex: 1, minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  error: { padding: space.md, borderRadius: radius.sm },
});
