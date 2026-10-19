import { ALL_DOMAINS_SLUG, getQuestions, shuffleQuestions } from "@/lib/questions";
import type { DuelPlayerInfo, DuelState, DuelSummary } from "@/lib/types";

const STATE_KEY = "quizland.duel.v1";
const SUMMARY_KEY = "quizland.duelSummary.v1";

/** How many questions each player answers in a duel, regardless of how many
 * players (2 or 3) are competing. */
export const DUEL_ROUNDS_PER_PLAYER = 5;

export function getDuelState(): DuelState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as DuelState) : null;
  } catch {
    return null;
  }
}

export function saveDuelState(state: DuelState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function clearDuelState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STATE_KEY);
}

export function startDuel(
  domains: string[],
  level: number,
  players: DuelPlayerInfo[]
): DuelState {
  const pool = domains.flatMap((d) => getQuestions(d));
  const total = DUEL_ROUNDS_PER_PLAYER * players.length;
  // A single selected domain shares its "no repeat" bag with solo quizzes
  // and Parcours legs on that same domain; a mixed selection gets its own
  // bag keyed by the combination, since it draws from a different pool.
  const bagKey =
    domains.length === 1 ? domains[0] : `duel:${[...domains].sort().join("+")}`;
  const state: DuelState = {
    domains,
    level,
    players,
    questions: shuffleQuestions(pool, total, bagKey),
    questionIndex: 0,
    scores: players.map(() => 0),
    xp: players.map(() => 0),
    themeErrors: players.map(() => ({})),
    startedAt: Date.now(),
  };
  saveDuelState(state);
  return state;
}

/** The recorded domain for a duel's per-player QuizResult: the single
 * chosen domain when there's only one, otherwise the virtual "all domains"
 * entry, since a mixed pool has no single domain identity of its own. */
export function duelResultDomain(domains: string[]): string {
  return domains.length === 1 ? domains[0] : ALL_DOMAINS_SLUG;
}

export function setDuelSummary(summary: DuelSummary) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
}

export function getDuelSummary(): DuelSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SUMMARY_KEY);
    return raw ? (JSON.parse(raw) as DuelSummary) : null;
  } catch {
    return null;
  }
}
