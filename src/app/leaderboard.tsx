import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { categories, getCategory } from '@/data/categories';
import { backend, type LeaderboardEntry } from '@/services/backend';
import { radius, space, useColors } from '@/theme';

export default function LeaderboardScreen() {
  const c = useColors();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      setEntries(null);
      backend.getLeaderboard(filter).then(setEntries);
    }, [filter]),
  );

  if (!user) return <Redirect href="/login" />;

  const selected = filter ? getCategory(filter) : undefined;
  const filters = [{ id: undefined, title: 'Tümü', icon: '⭐', color: c.hero }, ...categories];

  return (
    <Screen>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chips}
      >
        {filters.map((f) => {
          const active = f.id === filter;
          return (
            <Pressable
              key={f.id ?? 'all'}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(f.id)}
              style={[
                styles.chip,
                { borderColor: active ? f.color : c.border, backgroundColor: active ? f.color : c.surface },
              ]}
            >
              <AppText variant="label" color={active ? '#FFFFFF' : c.ink}>
                {f.icon} {f.title}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <AppText variant="caption" color={c.inkSoft}>
        {selected
          ? `${selected.title} kategorisindeki en iyi puanlar.`
          : 'Her kategorideki en iyi puanlarının toplamı.'}
      </AppText>

      {entries === null ? (
        <ActivityIndicator color={c.ink} />
      ) : entries.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
          <AppText variant="heading">Tablo henüz boş</AppText>
          <AppText color={c.inkSoft}>Bir quiz bitir, listenin başına adını yazdır.</AppText>
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {entries.map((e, i) => {
            const me = e.userId === user.id;
            const medal = ['🥇', '🥈', '🥉'][i];
            return (
              <View
                key={e.userId}
                style={[
                  styles.row,
                  { backgroundColor: me ? c.accent : c.surface, borderColor: me ? c.accent : c.border },
                ]}
              >
                <View style={styles.rank}>
                  {medal ? (
                    <AppText style={{ fontSize: 24, lineHeight: 30 }}>{medal}</AppText>
                  ) : (
                    <AppText variant="heading" color={me ? c.accentInk : c.inkSoft}>
                      {i + 1}
                    </AppText>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="label" color={me ? c.accentInk : c.ink}>
                    {e.username}
                    {me ? ' (sen)' : ''}
                  </AppText>
                  <AppText variant="caption" color={me ? c.accentInk : c.inkSoft}>
                    {e.quizzes} quiz
                  </AppText>
                </View>
                <AppText variant="heading" color={me ? c.accentInk : c.ink}>
                  {e.score}
                </AppText>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: space.sm, paddingVertical: 2, alignItems: 'flex-start' },
  chip: { borderWidth: 2, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  empty: { borderWidth: 2, borderRadius: radius.lg, padding: space.xl, gap: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.md,
  },
  rank: { width: 36, alignItems: 'center' },
});
