import type { Category } from '@/types';

import kodlama from './questions/kodlama.json';
import matematik from './questions/matematik.json';
import turkce from './questions/turkce.json';
import genelKultur from './questions/genel-kultur.json';

/**
 * Yeni bir kategori eklemek için:
 * 1. src/data/questions/ altına aynı yapıda bir JSON dosyası ekle
 * 2. Burada import edip listeye ekle
 */
export const categories: Category[] = [kodlama, matematik, turkce, genelKultur];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

/** Bir quizde sorulacak soru sayısı (kategoride daha fazla soru varsa rastgele seçilir) */
export const QUESTIONS_PER_QUIZ = 10;

/** Soru başına süre (saniye) */
export const SECONDS_PER_QUESTION = 20;
