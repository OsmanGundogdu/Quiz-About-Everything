import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getCategory, QUESTIONS_PER_QUIZ, SECONDS_PER_QUESTION } from '@/data/categories';
import { backend } from '@/services/backend';
import { radius, space, useColors } from '@/theme';
import type { Category } from '@/types';
import { shuffle } from '@/utils/shuffle';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const POINTS_CORRECT = 100;
const POINTS_PER_SECOND_LEFT = 5;

type PreparedQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
};

type Answer = { questionId: string; chosen: number | null; correct: boolean; points: number };

/** Kategoriden rastgele sorular seçer ve şıkların yerini karıştırır */
function prepare(category: Category): PreparedQuestion[] {
  return shuffle(category.questions)
    .slice(0, QUESTIONS_PER_QUIZ)
    .map((q) => {
      const order = shuffle(q.options.map((_, i) => i));
      return {
        id: q.id,
        question: q.question,
        explanation: q.explanation,
        options: order.map((i) => q.options[i]),
        answer: order.indexOf(q.answer),
      };
    });
}

export default function QuizScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const category = getCategory(categoryId);
  const { user } = useAuth();

  if (!user) return <Redirect href="/login" />;
  if (!category) return <NotFound />;

  return <Quiz key={category.id} category={category} />;
}

function Quiz({ category }: { category: Category }) {
  const c = useColors();
  const { user } = useAuth();
  const [round, setRound] = useState(0);
  const questions = useMemo(() => prepare(category), [category, round]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [msLeft, setMsLeft] = useState(SECONDS_PER_QUESTION * 1000);
  const startedAt = useRef(Date.now());
  const questionStartedAt = useRef(Date.now());
  const saved = useRef(false);

  const finished = answers.length === questions.length;
  const question = questions[index];

  const reveal = useCallback(
    (choice: number | null) => {
      if (revealed) return;
      const secondsLeft = Math.max(0, SECONDS_PER_QUESTION - (Date.now() - questionStartedAt.current) / 1000);
      const correct = choice === question.answer;
      const points = correct ? POINTS_CORRECT + Math.round(secondsLeft) * POINTS_PER_SECOND_LEFT : 0;
      setChosen(choice);
      setRevealed(true);
      setAnswers((prev) => [...prev, { questionId: question.id, chosen: choice, correct, points }]);
    },
    [revealed, question],
  );

  // Soru sayacı
  useEffect(() => {
    if (revealed || finished) return;
    questionStartedAt.current = Date.now();
    setMsLeft(SECONDS_PER_QUESTION * 1000);
    const timer = setInterval(() => {
      const left = SECONDS_PER_QUESTION * 1000 - (Date.now() - questionStartedAt.current);
      if (left <= 0) {
        clearInterval(timer);
        setMsLeft(0);
        reveal(null);
      } else {
        setMsLeft(left);
      }
    }, 100);
    return () => clearInterval(timer);
    // reveal'i bağımlılığa eklemiyoruz: sayaç yalnızca soru değiştiğinde yeniden başlamalı
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, round, revealed, finished]);

  const score = answers.reduce((sum, a) => sum + a.points, 0);
  const correctCount = answers.filter((a) => a.correct).length;

  // Sonucu kaydet
  useEffect(() => {
    if (!finished || saved.current || !user) return;
    saved.current = true;
    backend.saveResult({
      userId: user.id,
      username: user.username,
      categoryId: category.id,
      correct: correctCount,
      total: questions.length,
      score,
      durationMs: Date.now() - startedAt.current,
      finishedAt: Date.now(),
    });
  }, [finished, user, category.id, correctCount, questions.length, score]);

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setChosen(null);
      setRevealed(false);
    } else {
      // son soruda cevap zaten answers'a eklendi; finished true olur
      setRevealed(false);
    }
  }

  function restart() {
    saved.current = false;
    startedAt.current = Date.now();
    setAnswers([]);
    setIndex(0);
    setChosen(null);
    setRevealed(false);
    setRound((r) => r + 1);
  }

  if (finished && !revealed) {
    return (
      <Results category={category} score={score} correct={correctCount} total={questions.length} onRestart={restart} />
    );
  }

  const fraction = msLeft / (SECONDS_PER_QUESTION * 1000);
  const timeLow = fraction < 0.25;
  const isLast = index + 1 === questions.length;

  return (
    <Screen>
      <Stack.Screen options={{ title: category.title, headerStyle: { backgroundColor: category.color } }} />

      <View style={styles.statusRow}>
        <AppText variant="label" color={c.inkSoft}>
          Soru {index + 1} / {questions.length}
        </AppText>
        <View style={[styles.scorePill, { backgroundColor: c.accent }]}>
          <AppText variant="label" color={c.accentInk}>
            {score} puan
          </AppText>
        </View>
      </View>

      <View
        style={[styles.timerTrack, { backgroundColor: c.surfaceMuted }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Kalan süre"
        accessibilityValue={{ min: 0, max: SECONDS_PER_QUESTION, now: Math.ceil(msLeft / 1000) }}
      >
        <View
          style={[
            styles.timerFill,
            { width: `${fraction * 100}%`, backgroundColor: timeLow ? c.wrong : category.color },
          ]}
        />
      </View>

      <View style={[styles.questionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <AppText variant="title">{question.question}</AppText>
        {!revealed && (
          <AppText variant="caption" color={timeLow ? c.wrong : c.inkSoft}>
            {Math.ceil(msLeft / 1000)} saniye kaldı
          </AppText>
        )}
      </View>

      <View style={{ gap: space.sm }}>
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer;
          const isChosen = i === chosen;
          let bg = c.surface;
          let border = c.border;
          let letterBg = c.surfaceMuted;
          let letterFg = c.ink;
          if (revealed && isAnswer) {
            bg = c.correctBg;
            border = c.correct;
            letterBg = c.correct;
            letterFg = '#FFFFFF';
          } else if (revealed && isChosen) {
            bg = c.wrongBg;
            border = c.wrong;
            letterBg = c.wrong;
            letterFg = '#FFFFFF';
          }
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityState={{ disabled: revealed, selected: isChosen }}
              accessibilityLabel={`${LETTERS[i]} şıkkı: ${option}`}
              disabled={revealed}
              onPress={() => reveal(i)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: bg,
                  borderColor: border,
                  opacity: revealed && !isAnswer && !isChosen ? 0.55 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={[styles.letter, { backgroundColor: letterBg }]}>
                <AppText variant="label" color={letterFg}>
                  {LETTERS[i]}
                </AppText>
              </View>
              <AppText variant="label" style={{ flex: 1 }}>
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {revealed && (
        <View style={{ gap: space.md }}>
          <View
            style={[styles.feedback, { backgroundColor: chosen === question.answer ? c.correctBg : c.wrongBg }]}
            accessibilityLiveRegion="polite"
          >
            <AppText variant="heading" color={chosen === question.answer ? c.correct : c.wrong}>
              {chosen === question.answer
                ? `Doğru! +${answers[answers.length - 1]?.points ?? 0}`
                : chosen === null
                  ? 'Süre doldu'
                  : 'Yanlış'}
            </AppText>
            {question.explanation && <AppText>{question.explanation}</AppText>}
          </View>
          <Button title={isLast ? 'Sonucu gör' : 'Sonraki soru'} onPress={next} />
        </View>
      )}
    </Screen>
  );
}

function Results({
  category,
  score,
  correct,
  total,
  onRestart,
}: {
  category: Category;
  score: number;
  correct: number;
  total: number;
  onRestart: () => void;
}) {
  const c = useColors();
  const ratio = correct / total;
  const message =
    ratio === 1
      ? 'Kusursuz! Hepsini bildin.'
      : ratio >= 0.7
        ? 'Çok iyi gidiyorsun.'
        : ratio >= 0.4
          ? 'Fena değil, bir tur daha?'
          : 'Isınma turu sayılır. Tekrar dene!';

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Sonuç', headerStyle: { backgroundColor: category.color } }} />
      <View style={[styles.resultCard, { backgroundColor: category.color }]}>
        <AppText style={styles.tileEmoji}>{category.icon}</AppText>
        <AppText variant="label" color="rgba(255,255,255,0.85)">
          {category.title}
        </AppText>
        <AppText style={styles.bigScore} color="#FFFFFF">
          {score}
        </AppText>
        <AppText variant="label" color="#FFFFFF">
          puan
        </AppText>
      </View>

      <View style={[styles.questionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <AppText variant="title">
          {correct} / {total} doğru
        </AppText>
        <AppText color={c.inkSoft}>{message}</AppText>
      </View>

      <Button title="Tekrar oyna" onPress={onRestart} />
      <Button title="Liderlik tablosunu gör" variant="secondary" onPress={() => router.push('/leaderboard')} />
      <Button title="Kategorilere dön" variant="ghost" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}

function NotFound() {
  const c = useColors();
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Bulunamadı' }} />
      <AppText variant="title">Bu kategori yok</AppText>
      <AppText color={c.inkSoft}>Bağlantı hatalı olabilir. Kategorilerden birini seçerek devam et.</AppText>
      <Button title="Kategorilere dön" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scorePill: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
  timerTrack: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: radius.pill },
  questionCard: { borderWidth: 2, borderRadius: radius.lg, padding: space.xl, gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 60,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.sm,
    paddingRight: space.lg,
  },
  letter: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  feedback: { borderRadius: radius.md, padding: space.lg, gap: space.xs },
  resultCard: { borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.xs },
  tileEmoji: { fontSize: 40, lineHeight: 48 },
  bigScore: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 72, lineHeight: 76, letterSpacing: -2 },
});
