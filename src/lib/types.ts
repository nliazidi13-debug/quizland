export type Difficulty = "Facile" | "Moyen" | "Difficile";

export type Domain = {
  slug: string;
  icon: string;
  name: string;
  questions: number;
  difficulty: Difficulty;
};

export type Level = {
  id: number;
  name: string;
  stars: string;
};

export type Badge = {
  icon: string;
  label: string;
};

export type Question = {
  id: string;
  domain: string;
  theme: string;
  prompt: string;
  answers: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
};

export type QuizAnswerState = "waiting" | "selected" | "correct" | "incorrect";

export type QuizResult = {
  domain: string;
  level: number;
  score: number;
  total: number;
  xp: number;
  timeSeconds: number;
  themeErrors: Record<string, number>;
  completedAt: number;
};

export type AvatarId =
  | "violet-orange"
  | "teal-yellow"
  | "red-blue"
  | "orange-red"
  | "blue-teal"
  | "yellow-orange";

export type PlayerProfile = {
  id: string;
  name: string;
  avatar: AvatarId;
  xp: number;
  badges: Badge[];
  history: QuizResult[];
  createdAt: number;
};

export type ParcoursLegResult = {
  domain: string;
  score: number;
  total: number;
  xp: number;
};

/** Persisted (localStorage) progress of an in-flight Parcours: a chain of
 * per-domain "legs" played back to back. Holds exactly the current leg's
 * questions, so stopping mid-leg and coming back resumes on that same
 * question set rather than re-rolling it. */
export type ParcoursState = {
  domains: string[];
  level: number;
  domainIndex: number;
  questions: Question[];
  questionIndex: number;
  score: number;
  xp: number;
  themeErrors: Record<string, number>;
  legResults: ParcoursLegResult[];
  startedAt: number;
};

/** Short-lived (sessionStorage) summary shown once a Parcours completes,
 * mirroring how `QuizResult` feeds the single-quiz results page. */
export type ParcoursSummary = {
  domains: string[];
  level: number;
  legResults: ParcoursLegResult[];
  totalScore: number;
  totalQuestions: number;
  totalXp: number;
  completedAt: number;
};

export type DuelPlayerInfo = {
  id: string;
  name: string;
  avatar: AvatarId;
};

/** Persisted (localStorage) state of an in-flight same-device Duel: 2 or 3
 * players alternate turns on a single shared pool of questions drawn from
 * the chosen domains. `questionIndex % players.length` says whose turn it
 * is. `scores`, `xp` and `themeErrors` are parallel arrays indexed the same
 * way as `players`. */
export type DuelState = {
  domains: string[];
  level: number;
  players: DuelPlayerInfo[];
  questions: Question[];
  questionIndex: number;
  scores: number[];
  xp: number[];
  themeErrors: Record<string, number>[];
  startedAt: number;
};

export type DuelPlayerSummary = {
  id: string;
  name: string;
  avatar: AvatarId;
  score: number;
  xp: number;
};

/** Short-lived (sessionStorage) summary shown once a Duel completes. */
export type DuelSummary = {
  domains: string[];
  level: number;
  total: number;
  players: DuelPlayerSummary[];
  completedAt: number;
};
