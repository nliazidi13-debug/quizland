import "server-only";
import { getDb } from "@/lib/db";
import { badges as defaultBadges } from "@/lib/data";
import {
  DAILY_CHALLENGES,
  isToday,
  todayKey,
  type DailyChallengeId,
} from "@/lib/dailyChallenges";
import type { AvatarId, Badge, PlayerProfile, QuizResult } from "@/lib/types";
import type { PrismaClient } from "../../generated/prisma/client";

type DbProfile = NonNullable<
  Awaited<ReturnType<PrismaClient["profile"]["findUnique"]>>
>;
type DbProfileWithRelations = DbProfile & {
  badges: { icon: string; label: string }[];
  history: {
    domain: string;
    level: number;
    score: number;
    total: number;
    xp: number;
    timeSeconds: number;
    themeErrorsJson: string;
    completedAt: Date;
  }[];
};

const WITH_RELATIONS = {
  badges: true,
  history: { orderBy: { completedAt: "desc" as const }, take: 25 },
};

function shapeProfile(
  userId: string,
  user: { name: string | null },
  profile: DbProfileWithRelations
): PlayerProfile {
  return {
    id: profile.id,
    name: user.name ?? "Joueur",
    avatar: profile.avatar as AvatarId,
    xp: profile.xp,
    badges: profile.badges.map((b) => ({ icon: b.icon, label: b.label })),
    history: profile.history.map((h) => ({
      domain: h.domain,
      level: h.level,
      score: h.score,
      total: h.total,
      xp: h.xp,
      timeSeconds: h.timeSeconds,
      themeErrors: JSON.parse(h.themeErrorsJson) as Record<string, number>,
      completedAt: h.completedAt.getTime(),
    })),
    createdAt: profile.createdAt.getTime(),
  };
}

/** Lazily creates the Profile row the first time a signed-in user is seen
 * by any profile-reading code path — Auth.js only provisions the User/
 * Account/Session rows, never knows about gameplay data. */
export async function getOrCreateProfile(userId: string): Promise<PlayerProfile> {
  const db = await getDb();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const profile = await db.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: WITH_RELATIONS,
  });
  return shapeProfile(userId, user, profile);
}

export async function getClaimedToday(userId: string): Promise<DailyChallengeId[]> {
  const db = await getDb();
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) return [];
  const claims = await db.dailyClaim.findMany({
    where: { profileId: profile.id, date: todayKey() },
  });
  return claims.map((c) => c.challengeId as DailyChallengeId);
}

export async function recordQuizResult(
  userId: string,
  result: QuizResult
): Promise<PlayerProfile> {
  const db = await getDb();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const profile = await db.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: WITH_RELATIONS,
  });

  const xp = profile.xp + result.xp;
  // Mirrors applyResultToProfile's same-day rules so cloud and local
  // profiles unlock badges under identical conditions.
  const recentHistory = profile.history; // already capped/ordered newest-first
  const unlocked = new Set(profile.badges.map((b) => b.icon));
  const newlyUnlocked: Badge[] = [];
  if (result.score === result.total && !unlocked.has("🎯")) {
    newlyUnlocked.push(defaultBadges.find((b) => b.icon === "🎯")!);
  }
  if (xp >= 500 && !unlocked.has("🔥")) {
    newlyUnlocked.push(defaultBadges.find((b) => b.icon === "🔥")!);
  }
  if (recentHistory.length + 1 >= 3 && !unlocked.has("🧠")) {
    newlyUnlocked.push(defaultBadges.find((b) => b.icon === "🧠")!);
  }

  const updated = await db.profile.update({
    where: { id: profile.id },
    data: {
      xp,
      history: {
        create: {
          domain: result.domain,
          level: result.level,
          score: result.score,
          total: result.total,
          xp: result.xp,
          timeSeconds: result.timeSeconds,
          themeErrorsJson: JSON.stringify(result.themeErrors),
          completedAt: new Date(result.completedAt),
        },
      },
      // newlyUnlocked was already filtered against the profile's current
      // badges above, so there's nothing to deduplicate here — and SQLite
      // doesn't support createMany's skipDuplicates anyway.
      badges: {
        createMany: {
          data: newlyUnlocked.map((b) => ({ icon: b.icon, label: b.label })),
        },
      },
    },
    include: WITH_RELATIONS,
  });

  return shapeProfile(userId, user, updated);
}

export async function updateAvatar(
  userId: string,
  avatar: AvatarId
): Promise<PlayerProfile> {
  const db = await getDb();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const profile = await db.profile.upsert({
    where: { userId },
    create: { userId, avatar },
    update: { avatar },
    include: WITH_RELATIONS,
  });
  return shapeProfile(userId, user, profile);
}

/** Validates a daily challenge is actually complete (recomputed from real
 * history, never trusting the client) and not already claimed today, then
 * credits the reward. Returns null if the claim isn't valid. */
export async function claimDailyChallenge(
  userId: string,
  id: DailyChallengeId
): Promise<PlayerProfile | null> {
  const def = DAILY_CHALLENGES.find((d) => d.id === id);
  if (!def) return null;

  const db = await getDb();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const profile = await db.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: WITH_RELATIONS,
  });

  const alreadyClaimed = await db.dailyClaim.findUnique({
    where: {
      profileId_challengeId_date: {
        profileId: profile.id,
        challengeId: id,
        date: todayKey(),
      },
    },
  });
  if (alreadyClaimed) return shapeProfile(userId, user, profile);

  const todayResults = profile.history
    .filter((h) => isToday(h.completedAt.getTime()))
    .map((h) => ({ score: h.score }));
  if (def.progress(todayResults as QuizResult[]) < def.target) return null;

  const badges = [...profile.badges];
  const grantBadge = def.reward.badge && !badges.some((b) => b.icon === def.reward.badge!.icon);

  const updated = await db.profile.update({
    where: { id: profile.id },
    data: {
      xp: profile.xp + def.reward.xp,
      claims: { create: { challengeId: id, date: todayKey() } },
      ...(grantBadge
        ? { badges: { create: { icon: def.reward.badge!.icon, label: def.reward.badge!.label } } }
        : {}),
    },
    include: WITH_RELATIONS,
  });

  return shapeProfile(userId, user, updated);
}

/** One-time merge of a local (pre-login) profile into the just-created
 * cloud one — only runs when the cloud profile is still empty, so it can
 * never clobber real progress by being called twice. */
export async function importLocalProfile(
  userId: string,
  local: Pick<PlayerProfile, "xp" | "badges" | "history" | "avatar">
): Promise<PlayerProfile | null> {
  const db = await getDb();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const profile = await db.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: WITH_RELATIONS,
  });

  if (profile.xp !== 0 || profile.history.length > 0) {
    // Cloud profile already has real progress — refuse to overwrite it.
    return null;
  }

  const updated = await db.profile.update({
    where: { id: profile.id },
    data: {
      xp: local.xp,
      avatar: local.avatar,
      history: {
        create: local.history.slice(0, 25).map((h) => ({
          domain: h.domain,
          level: h.level,
          score: h.score,
          total: h.total,
          xp: h.xp,
          timeSeconds: h.timeSeconds,
          themeErrorsJson: JSON.stringify(h.themeErrors),
          completedAt: new Date(h.completedAt),
        })),
      },
      // local.badges can't contain duplicate icons (the local store already
      // dedupes), and SQLite doesn't support createMany's skipDuplicates.
      badges: {
        createMany: {
          data: local.badges.map((b) => ({ icon: b.icon, label: b.label })),
        },
      },
    },
    include: WITH_RELATIONS,
  });

  return shapeProfile(userId, user, updated);
}
