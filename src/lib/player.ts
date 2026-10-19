import { avatarIds, badges as defaultBadges } from "@/lib/data";
import type { AvatarId, PlayerProfile, QuizResult } from "@/lib/types";

const PROFILES_KEY = "quizland.profiles.v1";
const ACTIVE_KEY = "quizland.active_profile.v1";
const LAST_RESULT_KEY = "quizland.lastResult.v1";
const LEGACY_PLAYER_KEY = "quizland.player.v1";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function randomAvatar(): AvatarId {
  return avatarIds[Math.floor(Math.random() * avatarIds.length)];
}

function readProfiles(): PlayerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw) as PlayerProfile[];
  } catch {
    // ignore corrupt storage
  }

  // Migrate the old single-profile shape from earlier versions of the app.
  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_PLAYER_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const migrated: PlayerProfile = {
        id: uid(),
        name: legacy.name || "Joueur",
        avatar: randomAvatar(),
        xp: legacy.xp ?? 0,
        badges: legacy.badges ?? [],
        history: legacy.history ?? [],
        createdAt: Date.now(),
      };
      writeProfiles([migrated]);
      window.localStorage.setItem(ACTIVE_KEY, migrated.id);
      window.localStorage.removeItem(LEGACY_PLAYER_KEY);
      return [migrated];
    }
  } catch {
    // ignore corrupt legacy storage
  }

  return [];
}

function writeProfiles(profiles: PlayerProfile[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function listProfiles(): PlayerProfile[] {
  return readProfiles().sort((a, b) => a.createdAt - b.createdAt);
}

export function getProfile(id: string): PlayerProfile | null {
  return readProfiles().find((p) => p.id === id) ?? null;
}

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProfileId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(ACTIVE_KEY, id);
  else window.localStorage.removeItem(ACTIVE_KEY);
}

export function getActiveProfile(): PlayerProfile | null {
  const id = getActiveProfileId();
  if (!id) return null;
  return getProfile(id);
}

export function createProfile(name: string, avatar: AvatarId): PlayerProfile {
  const profile: PlayerProfile = {
    id: uid(),
    name: name.trim() || "Joueur",
    avatar,
    xp: 0,
    badges: [],
    history: [],
    createdAt: Date.now(),
  };
  const profiles = readProfiles();
  writeProfiles([...profiles, profile]);
  setActiveProfileId(profile.id);
  return profile;
}

export function updateProfile(
  id: string,
  patch: Partial<Pick<PlayerProfile, "name" | "avatar">>
): PlayerProfile | null {
  const profiles = readProfiles();
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const updated: PlayerProfile = {
    ...profiles[index],
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() || profiles[index].name : profiles[index].name,
  };
  profiles[index] = updated;
  writeProfiles(profiles);
  return updated;
}

export function deleteProfile(id: string) {
  const profiles = readProfiles().filter((p) => p.id !== id);
  writeProfiles(profiles);
  if (getActiveProfileId() === id) setActiveProfileId(null);
}

export function logout() {
  setActiveProfileId(null);
}

export function ensureActiveProfile(): PlayerProfile {
  const active = getActiveProfile();
  if (active) return active;
  return createProfile("Invité", randomAvatar());
}

export function recordQuizResult(result: QuizResult): PlayerProfile {
  return applyResultToProfile(ensureActiveProfile(), result);
}

/** Same bookkeeping as recordQuizResult, but targets a specific profile
 * instead of the active one — needed for same-device Duels, where a result
 * must be written to each of the two playing profiles, not just whichever
 * one happens to be "active" in this browser. */
export function recordQuizResultForProfile(
  profileId: string,
  result: QuizResult
): PlayerProfile | null {
  const player = getProfile(profileId);
  if (!player) return null;
  return applyResultToProfile(player, result);
}

function applyResultToProfile(
  player: PlayerProfile,
  result: QuizResult
): PlayerProfile {
  const xp = player.xp + result.xp;
  const history = [result, ...player.history].slice(0, 25);

  const unlocked = new Set(player.badges.map((b) => b.icon));
  const newBadges = [...player.badges];
  if (result.score === result.total && !unlocked.has("🎯")) {
    newBadges.push(defaultBadges.find((b) => b.icon === "🎯")!);
  }
  if (xp >= 500 && !unlocked.has("🔥")) {
    newBadges.push(defaultBadges.find((b) => b.icon === "🔥")!);
  }
  if (history.length >= 3 && !unlocked.has("🧠")) {
    newBadges.push(defaultBadges.find((b) => b.icon === "🧠")!);
  }

  return updateProfileFull({ ...player, xp, history, badges: newBadges });
}

/** Credits a profile with a standalone reward (XP and/or a badge) outside
 * of a quiz result — used by the daily challenges system. */
export function grantReward(
  profileId: string,
  reward: { xp?: number; badge?: PlayerProfile["badges"][number] }
): PlayerProfile | null {
  const player = getProfile(profileId);
  if (!player) return null;
  const xp = player.xp + (reward.xp ?? 0);
  const badges = [...player.badges];
  if (reward.badge && !badges.some((b) => b.icon === reward.badge!.icon)) {
    badges.push(reward.badge);
  }
  return updateProfileFull({ ...player, xp, badges });
}

function updateProfileFull(profile: PlayerProfile): PlayerProfile {
  const profiles = readProfiles();
  const index = profiles.findIndex((p) => p.id === profile.id);
  if (index === -1) profiles.push(profile);
  else profiles[index] = profile;
  writeProfiles(profiles);
  return profile;
}

export function setLastResult(result: QuizResult) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
}

export function getLastResult(): QuizResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LAST_RESULT_KEY);
    return raw ? (JSON.parse(raw) as QuizResult) : null;
  } catch {
    return null;
  }
}

export function levelFromXp(xp: number) {
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const xpIntoLevel = xp % 500;
  const progressPct = Math.round((xpIntoLevel / 500) * 100);
  return { level, xpIntoLevel, xpForNext: 500, progressPct };
}
