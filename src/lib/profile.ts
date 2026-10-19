import { getActiveProfile, recordQuizResult as recordLocalResult } from "@/lib/player";
import {
  claimDailyChallenge as claimLocalDailyChallenge,
  claimedToday as localClaimedToday,
} from "@/lib/dailyChallenges";
import type { DailyChallengeId } from "@/lib/dailyChallenges";
import type { PlayerProfile, QuizResult } from "@/lib/types";

export type ProfileSource = "cloud" | "local";

export type CurrentProfile = {
  profile: PlayerProfile;
  source: ProfileSource;
  claimedToday: DailyChallengeId[];
};

/** The single place every page asks "who is playing right now". Prefers
 * the server-backed profile tied to a Google session; falls back to the
 * localStorage-only profile (guest/family, no login) otherwise. */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  try {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const { claimedToday, ...profile } = await res.json();
      return { profile, source: "cloud", claimedToday };
    }
  } catch {
    // network/offline — fall through to local
  }
  const local = getActiveProfile();
  return local
    ? { profile: local, source: "local", claimedToday: localClaimedToday(local.id) }
    : null;
}

/** Records a finished quiz/parcours run against whichever profile is
 * current. Writing to the cloud profile requires a signed-in session;
 * everything else (guests, offline) keeps using the existing
 * localStorage-only path, which also auto-creates a guest profile if none
 * exists yet. */
export async function recordResult(result: QuizResult): Promise<PlayerProfile> {
  const current = await getCurrentProfile();
  if (current?.source === "cloud") {
    const res = await fetch("/api/profile/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    if (res.ok) return res.json();
  }
  return recordLocalResult(result);
}

export async function claimDaily(
  id: DailyChallengeId
): Promise<{ profile: PlayerProfile; claimedToday: DailyChallengeId[] } | null> {
  const current = await getCurrentProfile();
  if (!current) return null;

  if (current.source === "cloud") {
    const res = await fetch("/api/profile/daily-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return null;
    const { claimedToday, ...profile } = await res.json();
    return { profile, claimedToday };
  }

  const profile = claimLocalDailyChallenge(current.profile.id, id);
  if (!profile) return null;
  return { profile, claimedToday: localClaimedToday(profile.id) };
}
