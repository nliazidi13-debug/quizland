import "server-only";
import { getDb } from "@/lib/db";
import { recordQuizResult } from "@/lib/serverProfile";
import { getQuestions, shuffleQuestions } from "@/lib/questions";
import { duelResultDomain } from "@/lib/duel";
import type { Question } from "@/lib/types";

const DUEL_ONLINE_LENGTH = 10;

export type DuelMatchStatus = "waiting" | "active" | "finished";

export type DuelParticipantView = {
  profileId: string;
  name: string;
  avatar: string;
  score: number | null;
  xp: number | null;
  finished: boolean;
};

export type DuelMatchView = {
  id: string;
  status: DuelMatchStatus;
  domains: string[];
  level: number;
  questions: Question[];
  participants: DuelParticipantView[];
};

const WITH_PARTICIPANTS = {
  participants: { include: { profile: { include: { user: true } } } },
};

function shapeMatch(match: {
  id: string;
  status: string;
  domainsJson: string;
  level: number;
  questionIdsJson: string;
  participants: {
    profileId: string;
    score: number | null;
    xp: number | null;
    finishedAt: Date | null;
    profile: { avatar: string; user: { name: string | null } };
  }[];
}): DuelMatchView {
  return {
    id: match.id,
    status: match.status as DuelMatchStatus,
    domains: JSON.parse(match.domainsJson),
    level: match.level,
    questions: JSON.parse(match.questionIdsJson),
    participants: match.participants.map((p) => ({
      profileId: p.profileId,
      name: p.profile.user.name ?? "Joueur",
      avatar: p.profile.avatar,
      score: p.score,
      xp: p.xp,
      finished: !!p.finishedAt,
    })),
  };
}

/** Picks a fixed question set once, at creation time (order and answer
 * order both already shuffled) — both players see the exact same set, so
 * there's nothing left to desync between their two devices. */
export async function createDuelMatch(
  creatorProfileId: string,
  domains: string[],
  level: number
): Promise<string> {
  const pool = domains.flatMap((d) => getQuestions(d));
  const questions = shuffleQuestions(pool, DUEL_ONLINE_LENGTH);

  const db = await getDb();
  const match = await db.duelMatch.create({
    data: {
      domainsJson: JSON.stringify(domains),
      level,
      questionIdsJson: JSON.stringify(questions),
      participants: { create: { profileId: creatorProfileId } },
    },
  });
  return match.id;
}

export async function getDuelMatch(
  matchId: string
): Promise<DuelMatchView | null> {
  const db = await getDb();
  const match = await db.duelMatch.findUnique({
    where: { id: matchId },
    include: WITH_PARTICIPANTS,
  });
  return match ? shapeMatch(match) : null;
}

/** Joining is idempotent (returns the match unchanged if already a
 * participant) and refuses once two players are already in. */
export async function joinDuelMatch(
  matchId: string,
  profileId: string
): Promise<DuelMatchView | null> {
  const db = await getDb();
  const match = await db.duelMatch.findUnique({
    where: { id: matchId },
    include: WITH_PARTICIPANTS,
  });
  if (!match) return null;
  if (match.participants.some((p) => p.profileId === profileId)) {
    return shapeMatch(match);
  }
  if (match.participants.length >= 2) return null;

  await db.duelParticipant.create({ data: { matchId, profileId } });
  const updated = await db.duelMatch.update({
    where: { id: matchId },
    data: { status: "active" },
    include: WITH_PARTICIPANTS,
  });
  return shapeMatch(updated);
}

/** Records one participant's final tally, credits it to their profile the
 * same way a solo quiz would (XP, history, badges, daily challenges), and
 * flips the match to "finished" once both players are done. */
export async function finishDuelParticipant(
  matchId: string,
  profileId: string,
  result: { score: number; total: number; xp: number; timeSeconds: number }
): Promise<DuelMatchView | null> {
  const db = await getDb();
  const match = await db.duelMatch.findUnique({
    where: { id: matchId },
    include: WITH_PARTICIPANTS,
  });
  if (!match) return null;
  const participant = match.participants.find((p) => p.profileId === profileId);
  if (!participant) return null;
  if (participant.finishedAt) return shapeMatch(match);

  await db.duelParticipant.update({
    where: { id: participant.id },
    data: {
      score: result.score,
      xp: result.xp,
      timeSeconds: result.timeSeconds,
      finishedAt: new Date(),
    },
  });

  // recordQuizResult keys off the Auth.js user id, not the Profile id, so
  // it's read off the already-joined user row rather than threaded through
  // as a second parameter.
  await recordQuizResult(participant.profile.user.id, {
    domain: duelResultDomain(JSON.parse(match.domainsJson)),
    level: match.level,
    score: result.score,
    total: result.total,
    xp: result.xp,
    timeSeconds: result.timeSeconds,
    themeErrors: {},
    completedAt: Date.now(),
  });

  const everyoneDone = match.participants
    .map((p) => (p.profileId === profileId ? true : !!p.finishedAt))
    .every(Boolean);

  const updated = await db.duelMatch.update({
    where: { id: matchId },
    data: everyoneDone ? { status: "finished" } : {},
    include: WITH_PARTICIPANTS,
  });
  return shapeMatch(updated);
}
