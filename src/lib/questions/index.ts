import type { Question } from "@/lib/types";
import type { Raw } from "./types";
import { histoire } from "./histoire";
import { geographie } from "./geographie";
import { sciences } from "./sciences";
import { informatique } from "./informatique";
import { litterature } from "./litterature";
import { arts } from "./arts";
import { cinema } from "./cinema";
import { musique } from "./musique";
import { sports } from "./sports";
import { nature } from "./nature";
import { sante } from "./sante";
import { economie } from "./economie";
import { religions } from "./religions";
import { cultureGenerale } from "./culture-generale";
import { univers } from "./univers";
import { mythologie } from "./mythologie";

function build(domain: string, raw: Raw[]): Question[] {
  return raw.map((r, i) => ({
    id: `${domain}-${i + 1}`,
    domain,
    theme: r.theme,
    prompt: r.prompt,
    answers: r.answers,
    correctIndex: r.correctIndex,
  }));
}

const bank: Record<string, Raw[]> = {
  histoire,
  geographie,
  sciences,
  informatique,
  litterature,
  arts,
  cinema,
  musique,
  sports,
  nature,
  sante,
  economie,
  religions,
  "culture-generale": cultureGenerale,
  univers,
  mythologie,
};

/** Slug for the virtual "all domains" option: not a real bank entry, so it's
 * resolved separately in getQuestions rather than listed in `bank`. */
export const ALL_DOMAINS_SLUG = "tous";

export const questionsByDomain: Record<string, Question[]> = Object.fromEntries(
  Object.entries(bank).map(([domain, raw]) => [domain, build(domain, raw)])
);

export function getQuestions(domain: string): Question[] {
  if (domain === ALL_DOMAINS_SLUG) {
    return Object.values(questionsByDomain).flat();
  }
  return questionsByDomain[domain] ?? [];
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleAnswers(question: Question): Question {
  const order = shuffle([0, 1, 2, 3] as const);
  const answers = order.map((i) => question.answers[i]) as [
    string,
    string,
    string,
    string,
  ];
  const correctIndex = order.indexOf(question.correctIndex) as 0 | 1 | 2 | 3;
  return { ...question, answers, correctIndex };
}

const QUEUE_KEY_PREFIX = "quizland.queue.v1.";

type QueueState = {
  /** A full shuffle of every question id in the pool — the current "lap". */
  order: string[];
  /** Index of the next id to draw from `order`. */
  cursor: number;
};

function readQueueState(bagKey: string): QueueState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY_PREFIX + bagKey);
    return raw ? (JSON.parse(raw) as QueueState) : null;
  } catch {
    return null;
  }
}

function writeQueueState(bagKey: string, state: QueueState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY_PREFIX + bagKey, JSON.stringify(state));
}

/** Draws `count` questions from `pool` without ever repeating one until
 * every other question in the pool has come up — a shuffled "bag" that's
 * only reshuffled once fully drawn, rather than independent random draws
 * that can resurface the same question before the rest have had a turn.
 * Progress is persisted in localStorage under `bagKey` (the domain slug, or
 * a combination key for mixed pools), so the guarantee holds across
 * separate quiz launches, not just within one playthrough. The bag resets
 * itself automatically if the pool's question ids no longer match what was
 * saved — e.g. after the question bank is edited. */
function drawNoRepeat(pool: Question[], count: number, bagKey: string): Question[] {
  const poolIds = pool.map((q) => q.id);
  const poolIdSet = new Set(poolIds);
  const byId = new Map(pool.map((q) => [q.id, q]));

  let state = readQueueState(bagKey);
  const stale =
    !state ||
    state.order.length !== poolIds.length ||
    !state.order.every((id) => poolIdSet.has(id));
  if (stale) {
    state = { order: shuffle(poolIds), cursor: 0 };
  }

  const picked: Question[] = [];
  const target = Math.min(count, poolIds.length);
  while (picked.length < target && state) {
    if (state.cursor >= state.order.length) {
      state = { order: shuffle(poolIds), cursor: 0 };
    }
    const id = state.order[state.cursor];
    state.cursor += 1;
    const question = byId.get(id);
    if (question) picked.push(question);
  }

  if (state) writeQueueState(bagKey, state);
  return picked;
}

/** How many questions make up a single quiz session, picked from the
 * domain's full pool each time — a domain can hold hundreds of questions,
 * but a playthrough stays short. */
export const QUIZ_LENGTH = 10;

/** How many questions make up a single domain "leg" inside a Parcours. */
export const PARCOURS_LEG_LENGTH = 5;

/** Selection of `count` questions from the domain's pool for one
 * playthrough, with both question order and each question's answer order
 * shuffled. `bagKey` identifies which persisted "no repeat until
 * exhausted" bag to draw from (typically the domain slug) — the same
 * question never resurfaces until every other question tied to that key
 * has been asked at least as often. Pure client-side (the page itself is
 * statically exported) so it must be called after mount, not during
 * server/static rendering. */
export function shuffleQuestions(
  questions: Question[],
  count: number = QUIZ_LENGTH,
  bagKey?: string
): Question[] {
  const picked = bagKey
    ? drawNoRepeat(questions, count, bagKey)
    : shuffle(questions).slice(0, count);
  return picked.map(shuffleAnswers);
}
