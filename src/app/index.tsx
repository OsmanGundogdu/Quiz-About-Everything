import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { categories, QUESTIONS_PER_QUIZ } from '@/data/categories';
import { backend } from '@/services/backend';
import { radius, space, useColors } from '@/theme';

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      backend.getResultsForUser(user.id).then((results) => {
        const best: Record<string, number> = {};
        for (const r of results) best[r.categoryId] = Math.max(best[r.categoryId] ?? 0, r.score);
        setBestScores(best);
      });
    }, [user]),
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.ink} />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.hero, { backgroundColor: c.hero, paddingTop: insets.top + space.xl }]}>
        <View style={styles.heroInner}>
          <View style={styles.heroTop}>
            <AppText variant="label" color={c.heroInkSoft}>
              Merhaba, {user.username}
            </AppText>
            <View style={styles.navRow}>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/leaderboard')}
                style={[styles.navPill, { borderColor: c.heroInkSoft }]}
              >
                <AppText variant="caption" color={c.heroInk}>
                  🏆 Liderlik
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/profile')}
                style={[styles.navPill, { borderColor: c.heroInkSoft }]}
              >
                <AppText variant="caption" color={c.heroInk}>
                  Profilim
                </AppText>
              </Pressable>
            </View>
          </View>
          <AppText variant="display" color={c.heroInk}>
            Bugün neyi deniyoruz?
          </AppText>
          <AppText color={c.heroInkSoft}>
            Her quiz {QUESTIONS_PER_QUIZ} soru. Doğru cevaba 100 puan, hızlı cevaba bonus.
          </AppText>
        </View>
      </View>

      <Screen>
        <View style={styles.grid}>
          {categories.map((cat) => {
            const best = bestScores[cat.id];
            return (
              <Pressable
                key={cat.id}
                onPress={() => router.push({ pathname: '/quiz/[categoryId]', params: { categoryId: cat.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${cat.title} quizini başlat`}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: cat.color, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <AppText style={styles.tileEmoji}>{cat.icon}</AppText>
                <View style={{ gap: 2 }}>
                  <AppText variant="heading" color="#FFFFFF">
                    {cat.title}
                  </AppText>
                  <AppText variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={2}>
                    {cat.description}
                  </AppText>
                </View>
                <View style={styles.tileFooter}>
                  <AppText variant="caption" color="#FFFFFF">
                    {best !== undefined ? `En iyi puanın: ${best}` : 'Henüz oynamadın'}
                  </AppText>
                  <View style={[styles.playBadge, { backgroundColor: c.accent }]}>
                    <AppText variant="caption" color={c.accentInk}>
                      Başla
                    </AppText>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="caption" color={c.inkSoft} style={{ textAlign: 'center' }}>
          Daha fazla kategori yolda.
        </AppText>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  heroInner: { width: '100%', maxWidth: 640, gap: space.md },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  navRow: { flexDirection: 'row', gap: space.sm },
  navPill: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    flexGrow: 1,
    flexBasis: 260,
    minHeight: 190,
    borderRadius: radius.lg,
    padding: space.lg,
    justifyContent: 'space-between',
    gap: space.md,
  },
  tileEmoji: { fontSize: 40, lineHeight: 48 },
  tileFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  playBadge: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
});
