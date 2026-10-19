import { getProfile, grantReward } from "@/lib/player";
import type { PlayerProfile, QuizResult, Badge } from "@/lib/types";

const CLAIMS_KEY = "quizland.dailyClaims.v1";

export type DailyChallengeId = "play3" | "score20" | "login";

type DailyChallengeDef = {
  id: DailyChallengeId;
  title: string;
  target: number;
  reward: { xp: number; badge?: Badge };
  progress: (todayResults: QuizResult[]) => number;
};

/** Every challenge is computed purely from the profile's own result
 * history, filtered to today — no separate "did they win a duel" tracking
 * needed, since each duel/Parcours leg already lands in `history` as its
 * own QuizResult. */
export const DAILY_CHALLENGES: DailyChallengeDef[] = [
  {
    id: "login",
    title: "Connexion quotidienne",
    target: 1,
    reward: { xp: 50 },
    progress: () => 1,
  },
  {
    id: "play3",
    title: "Terminer 3 parties aujourd'hui",
    target: 3,
    reward: { xp: 150 },
    progress: (today) => today.length,
  },
  {
    id: "score20",
    title: "Répondre juste à 20 questions aujourd'hui",
    target: 20,
    reward: { xp: 300, badge: { icon: "🏃", label: "Série du jour" } },
    progress: (today) => today.reduce((sum, r) => sum + r.score, 0),
  },
];

export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isToday(timestamp: number): boolean {
  return todayKey(new Date(timestamp)) === todayKey();
}

type ClaimsMap = Record<string, { date: string; claimed: DailyChallengeId[] }>;

function readClaims(): ClaimsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CLAIMS_KEY);
    return raw ? (JSON.parse(raw) as ClaimsMap) : {};
  } catch {
    return {};
  }
}

function writeClaims(map: ClaimsMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAIMS_KEY, JSON.stringify(map));
}

export function claimedToday(profileId: string): DailyChallengeId[] {
  const entry = readClaims()[profileId];
  return entry && entry.date === todayKey() ? entry.claimed : [];
}

export type DailyChallengeView = {
  id: DailyChallengeId;
  title: string;
  target: number;
  progress: number;
  progressPct: number;
  completed: boolean;
  claimed: boolean;
  reward: DailyChallengeDef["reward"];
};

/** Pure computation shared by the local (localStorage) and server (Prisma)
 * paths: given today's results and which challenge ids are already
 * claimed, derive the view the UI renders. Neither storage backend needs
 * its own copy of this logic. */
export function computeDailyChallenges(
  todayResults: QuizResult[],
  claimed: DailyChallengeId[]
): DailyChallengeView[] {
  return DAILY_CHALLENGES.map((def) => {
    const progress = Math.min(def.target, def.progress(todayResults));
    return {
      id: def.id,
      title: def.title,
      target: def.target,
      progress,
      progressPct: Math.round((progress / def.target) * 100),
      completed: progress >= def.target,
      claimed: claimed.includes(def.id),
      reward: def.reward,
    };
  });
}

/** Today's three challenges for `profile`, with real progress pulled from
 * its result history — resets automatically at local midnight since
 * "today" is recomputed from the current date on every call. */
export function getDailyChallenges(profile: PlayerProfile): DailyChallengeView[] {
  const todayResults = profile.history.filter((r) => isToday(r.completedAt));
  return computeDailyChallenges(todayResults, claimedToday(profile.id));
}

/** Credits the reward for a completed, not-yet-claimed challenge and marks
 * it claimed for today. No-ops (returns the profile unchanged) if the
 * challenge isn't actually complete or was already claimed, so this is
 * safe to call directly from a button's onClick. */
export function claimDailyChallenge(
  profileId: string,
  id: DailyChallengeId
): PlayerProfile | null {
  const def = DAILY_CHALLENGES.find((d) => d.id === id);
  const profile = getProfile(profileId);
  if (!def || !profile) return profile;

  const already = claimedToday(profileId);
  if (already.includes(id)) return profile;

  const todayResults = profile.history.filter((r) => isToday(r.completedAt));
  if (def.progress(todayResults) < def.target) return profile;

  const map = readClaims();
  map[profileId] = { date: todayKey(), claimed: [...already, id] };
  writeClaims(map);

  return grantReward(profileId, def.reward);
}
