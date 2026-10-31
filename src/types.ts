export type Question = {
  id: string;
  question: string;
  options: string[];
  /** Doğru şıkkın options dizisindeki indeksi */
  answer: number;
  explanation?: string;
};

export type Category = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  questions: Question[];
};

export type User = {
  id: string;
  username: string;
  createdAt: number;
};

export type QuizResult = {
  id: string;
  userId: string;
  username: string;
  categoryId: string;
  correct: number;
  total: number;
  score: number;
  durationMs: number;
  finishedAt: number;
};
