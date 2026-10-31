/**
 * Veri katmanı.
 *
 * Uygulamanın geri kalanı yalnızca `backend` nesnesini kullanır. Şimdilik her şey
 * cihazda (AsyncStorage; web'de localStorage) tutuluyor. İleride Supabase'e geçmek
 * için aynı `Backend` arayüzünü uygulayan yeni bir sınıf yazıp aşağıdaki
 * `export const backend = ...` satırını değiştirmek yeterli olacak.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import type { QuizResult, User } from '@/types';

export interface Backend {
  getCurrentUser(): Promise<User | null>;
  register(username: string, password: string): Promise<User>;
  login(username: string, password: string): Promise<User>;
  logout(): Promise<void>;
  saveResult(result: Omit<QuizResult, 'id'>): Promise<QuizResult>;
  getResultsForUser(userId: string): Promise<QuizResult[]>;
  getLeaderboard(categoryId?: string): Promise<LeaderboardEntry[]>;
}

export type LeaderboardEntry = {
  userId: string;
  username: string;
  /** Kategori seçiliyse o kategorideki en iyi puan; değilse her kategorideki en iyi puanların toplamı */
  score: number;
  quizzes: number;
};

export class AuthError extends Error {}

type StoredUser = User & { passwordHash: string; salt: string };

const KEYS = {
  users: 'qae:users',
  session: 'qae:session',
  results: 'qae:results',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

function publicUser({ id, username, createdAt }: StoredUser): User {
  return { id, username, createdAt };
}

const normalize = (name: string) => name.trim().toLocaleLowerCase('tr-TR');

class LocalBackend implements Backend {
  async getCurrentUser() {
    const userId = await AsyncStorage.getItem(KEYS.session);
    if (!userId) return null;
    const users = await readJson<StoredUser[]>(KEYS.users, []);
    const user = users.find((u) => u.id === userId);
    return user ? publicUser(user) : null;
  }

  async register(username: string, password: string) {
    const name = username.trim();
    if (name.length < 3) throw new AuthError('Kullanıcı adı en az 3 karakter olmalı.');
    if (name.length > 20) throw new AuthError('Kullanıcı adı en fazla 20 karakter olabilir.');
    if (password.length < 6) throw new AuthError('Şifre en az 6 karakter olmalı.');

    const users = await readJson<StoredUser[]>(KEYS.users, []);
    if (users.some((u) => normalize(u.username) === normalize(name))) {
      throw new AuthError('Bu kullanıcı adı alınmış. Başka bir ad dene.');
    }

    const salt = Crypto.randomUUID();
    const user: StoredUser = {
      id: Crypto.randomUUID(),
      username: name,
      createdAt: Date.now(),
      salt,
      passwordHash: await hashPassword(password, salt),
    };
    await writeJson(KEYS.users, [...users, user]);
    await AsyncStorage.setItem(KEYS.session, user.id);
    return publicUser(user);
  }

  async login(username: string, password: string) {
    const users = await readJson<StoredUser[]>(KEYS.users, []);
    const user = users.find((u) => normalize(u.username) === normalize(username));
    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
      throw new AuthError('Kullanıcı adı ya da şifre hatalı.');
    }
    await AsyncStorage.setItem(KEYS.session, user.id);
    return publicUser(user);
  }

  async logout() {
    await AsyncStorage.removeItem(KEYS.session);
  }

  async saveResult(result: Omit<QuizResult, 'id'>) {
    const results = await readJson<QuizResult[]>(KEYS.results, []);
    const saved: QuizResult = { ...result, id: Crypto.randomUUID() };
    await writeJson(KEYS.results, [...results, saved]);
    return saved;
  }

  async getResultsForUser(userId: string) {
    const results = await readJson<QuizResult[]>(KEYS.results, []);
    return results.filter((r) => r.userId === userId).sort((a, b) => b.finishedAt - a.finishedAt);
  }

  async getLeaderboard(categoryId?: string) {
    const results = await readJson<QuizResult[]>(KEYS.results, []);
    const relevant = categoryId ? results.filter((r) => r.categoryId === categoryId) : results;

    // kullanıcı -> kategori -> en iyi puan
    const best = new Map<string, { username: string; quizzes: number; byCategory: Map<string, number> }>();
    for (const r of relevant) {
      const entry = best.get(r.userId) ?? { username: r.username, quizzes: 0, byCategory: new Map() };
      entry.quizzes += 1;
      entry.byCategory.set(r.categoryId, Math.max(entry.byCategory.get(r.categoryId) ?? 0, r.score));
      best.set(r.userId, entry);
    }

    return [...best.entries()]
      .map(([userId, e]) => ({
        userId,
        username: e.username,
        quizzes: e.quizzes,
        score: [...e.byCategory.values()].reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username, 'tr'));
  }
}

export const backend: Backend = new LocalBackend();
