import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getCategory } from '@/data/categories';
import { backend } from '@/services/backend';
import { radius, space, useColors } from '@/theme';
import type { QuizResult } from '@/types';

const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export default function ProfileScreen() {
  const c = useColors();
  const { user, logout } = useAuth();
  const [results, setResults] = useState<QuizResult[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user) backend.getResultsForUser(user.id).then(setResults);
    }, [user]),
  );

  if (!user) return <Redirect href="/login" />;

  const totalCorrect = results?.reduce((s, r) => s + r.correct, 0) ?? 0;
  const totalQuestions = results?.reduce((s, r) => s + r.total, 0) ?? 0;
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const bestScore = results?.reduce((m, r) => Math.max(m, r.score), 0) ?? 0;

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <AppText variant="title">{user.username}</AppText>
        <AppText variant="caption" color={c.inkSoft}>
          {new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}{' '}
          tarihinden beri oynuyor
        </AppText>
      </View>

      <View style={styles.stats}>
        {[
          { label: 'Biten quiz', value: results?.length ?? 0 },
          { label: 'Doğru oranı', value: `%${accuracy}` },
          { label: 'En yüksek puan', value: bestScore },
        ].map((s) => (
          <View key={s.label} style={[styles.stat, { backgroundColor: c.surface, borderColor: c.border }]}>
            <AppText variant="title">{String(s.value)}</AppText>
            <AppText variant="caption" color={c.inkSoft}>
              {s.label}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="heading">Geçmiş sonuçlar</AppText>

      {results === null ? (
        <ActivityIndicator color={c.ink} />
      ) : results.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
          <AppText color={c.inkSoft}>Henüz quiz bitirmedin. İlk sonucun burada görünecek.</AppText>
          <Button title="Bir kategori seç" onPress={() => router.dismissTo('/')} />
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {results.map((r) => {
            const cat = getCategory(r.categoryId);
            return (
              <View key={r.id} style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[styles.icon, { backgroundColor: cat?.color ?? c.surfaceMuted }]}>
                  <AppText style={{ fontSize: 20, lineHeight: 26 }}>{cat?.icon ?? '❓'}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="label">{cat?.title ?? r.categoryId}</AppText>
                  <AppText variant="caption" color={c.inkSoft}>
                    {r.correct}/{r.total} doğru, {dateFormat.format(r.finishedAt)}
                  </AppText>
                </View>
                <AppText variant="heading">{r.score}</AppText>
              </View>
            );
          })}
        </View>
      )}

      <Button title="Çıkış yap" variant="ghost" onPress={handleLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  stat: { flexGrow: 1, flexBasis: 140, borderWidth: 2, borderRadius: radius.md, padding: space.lg, gap: 2 },
  empty: { borderWidth: 2, borderRadius: radius.lg, padding: space.xl, gap: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.md,
  },
  icon: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
