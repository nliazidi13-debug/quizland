import { PARCOURS_LEG_LENGTH, getQuestions, shuffleQuestions } from "@/lib/questions";
import type { ParcoursLegResult, ParcoursState, ParcoursSummary } from "@/lib/types";

const STATE_KEY = "quizland.parcours.v1";
const SUMMARY_KEY = "quizland.parcoursSummary.v1";

function buildLeg(domain: string) {
  return shuffleQuestions(getQuestions(domain), PARCOURS_LEG_LENGTH, domain);
}

export function getParcoursState(): ParcoursState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as ParcoursState) : null;
  } catch {
    return null;
  }
}

export function saveParcoursState(state: ParcoursState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function clearParcoursState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STATE_KEY);
}

/** Starts a new Parcours over `domains` (played in that order) and persists
 * it immediately, so the very first leg is already resumable. */
export function startParcours(domains: string[], level: number): ParcoursState {
  const state: ParcoursState = {
    domains,
    level,
    domainIndex: 0,
    questions: buildLeg(domains[0]),
    questionIndex: 0,
    score: 0,
    xp: 0,
    themeErrors: {},
    legResults: [],
    startedAt: Date.now(),
  };
  saveParcoursState(state);
  return state;
}

/** Called once the current leg's last question has been answered. Either
 * rolls the next domain's leg (persisting it) or, if that was the last
 * domain, clears the saved state and hands back a final summary. */
export function completeLeg(
  state: ParcoursState,
  legResult: ParcoursLegResult
):
  | { done: false; next: ParcoursState }
  | { done: true; summary: ParcoursSummary } {
  const legResults = [...state.legResults, legResult];
  const nextIndex = state.domainIndex + 1;

  if (nextIndex >= state.domains.length) {
    clearParcoursState();
    return {
      done: true,
      summary: {
        domains: state.domains,
        level: state.level,
        legResults,
        totalScore: legResults.reduce((sum, l) => sum + l.score, 0),
        totalQuestions: legResults.reduce((sum, l) => sum + l.total, 0),
        totalXp: legResults.reduce((sum, l) => sum + l.xp, 0),
        completedAt: Date.now(),
      },
    };
  }

  const next: ParcoursState = {
    ...state,
    domainIndex: nextIndex,
    questions: buildLeg(state.domains[nextIndex]),
    questionIndex: 0,
    score: 0,
    xp: 0,
    themeErrors: {},
    legResults,
    startedAt: Date.now(),
  };
  saveParcoursState(next);
  return { done: false, next };
}

export function setParcoursSummary(summary: ParcoursSummary) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
}

export function getParcoursSummary(): ParcoursSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SUMMARY_KEY);
    return raw ? (JSON.parse(raw) as ParcoursSummary) : null;
  } catch {
    return null;
  }
}
