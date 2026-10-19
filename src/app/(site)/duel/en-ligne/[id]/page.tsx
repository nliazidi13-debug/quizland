"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Flame } from "lucide-react";
import { AnswerOption, answerState } from "@/components/quizland/quiz-player";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { QzButton } from "@/components/quizland/qz-button";
import { getCurrentProfile } from "@/lib/profile";
import type { AvatarId, QuizAnswerState } from "@/lib/types";

const QUESTION_SECONDS = 15;
const REVEAL_DELAY_SELECTED = 650;
const REVEAL_HOLD = 1500;
const POLL_MS = 2000;

type Participant = {
  profileId: string;
  name: string;
  avatar: string;
  score: number | null;
  xp: number | null;
  finished: boolean;
};

type MatchView = {
  id: string;
  status: "waiting" | "active" | "finished";
  domains: string[];
  level: number;
  questions: {
    id: string;
    domain: string;
    theme: string;
    prompt: string;
    answers: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
  }[];
  participants: Participant[];
};

export default function DuelOnlineMatchPage() {
  const params = useParams<{ id: string }>();
  const matchId = params.id;

  const [myProfileId, setMyProfileId] = useState<string | null | undefined>(undefined);
  const [match, setMatch] = useState<MatchView | null>(null);
  const [joining, setJoining] = useState(false);

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<QuizAnswerState>("waiting");
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const startedAt = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const submittingRef = useRef(false);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
  };

  useEffect(() => {
    getCurrentProfile().then((current) => {
      setMyProfileId(current?.source === "cloud" ? current.profile.id : null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      fetch(`/api/duel/${matchId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((m) => {
          if (!cancelled && m) setMatch(m);
        });
    };
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [matchId]);

  useEffect(() => {
    return clearTimeouts;
  }, []);

  const me = match?.participants.find((p) => p.profileId === myProfileId);
  const opponent = match?.participants.find((p) => p.profileId !== myProfileId);
  const question = match?.questions[index];
  const total = match?.questions.length ?? 0;

  useEffect(() => {
    if (match?.status === "active" && me && !me.finished && startedAt.current === 0) {
      startedAt.current = Date.now();
    }
  }, [match, me]);

  const submitFinish = useCallback(
    (finalScore: number, finalXp: number) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      const timeSeconds = Math.round((Date.now() - startedAt.current) / 1000);
      fetch(`/api/duel/${matchId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: finalScore, total, xp: finalXp, timeSeconds }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((m) => {
          if (m) setMatch(m);
          setSubmitted(true);
        });
    },
    [matchId, total]
  );

  const goToNext = useCallback(
    (finalScore: number, finalXp: number) => {
      if (!match) return;
      if (index + 1 >= total) {
        submitFinish(finalScore, finalXp);
        return;
      }
      setIndex((i) => i + 1);
      setStatus("waiting");
      setSelected(null);
      setSecondsLeft(QUESTION_SECONDS);
    },
    [match, index, total, submitFinish]
  );

  const reveal = useCallback(
    (chosenIndex: number | null) => {
      if (!question) return;
      const isCorrect = chosenIndex === question.correctIndex;
      const nextScore = score + (isCorrect ? 1 : 0);
      const gained = isCorrect ? 100 + secondsLeft * 5 : 0;
      const nextXp = xp + gained;
      setScore(nextScore);
      setXp(nextXp);
      setStatus(isCorrect ? "correct" : "incorrect");

      const t = setTimeout(() => goToNext(nextScore, nextXp), REVEAL_HOLD);
      timeoutsRef.current.push(t);
    },
    [question, score, xp, secondsLeft, goToNext]
  );

  const handleSelect = (i: number) => {
    if (status !== "waiting") return;
    setSelected(i);
    setStatus("selected");
    const t = setTimeout(() => reveal(i), REVEAL_DELAY_SELECTED);
    timeoutsRef.current.push(t);
  };

  useEffect(() => {
    if (!question || status !== "waiting" || match?.status !== "active" || me?.finished) {
      return;
    }
    if (secondsLeft <= 0) {
      const t = setTimeout(() => reveal(null), 0);
      timeoutsRef.current.push(t);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    timeoutsRef.current.push(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, secondsLeft, question, match?.status, me?.finished]);

  const join = async () => {
    setJoining(true);
    const res = await fetch(`/api/duel/${matchId}/join`, { method: "POST" });
    if (res.ok) setMatch(await res.json());
    setJoining(false);
  };

  if (myProfileId === undefined || !match) return null;

  if (myProfileId === null) {
    return (
      <div className="mx-auto max-w-md px-5 py-14 text-center sm:px-8">
        <h1 className="mb-3 font-heading text-xl font-extrabold text-[#1A0E33]">
          Rejoindre le défi
        </h1>
        <p className="mb-6 text-sm text-[#6B7094]">
          Connecte-toi avec Google pour rejoindre ce duel en ligne.
        </p>
        <QzButton href="/connexion" tone="accent">
          Me connecter
        </QzButton>
      </div>
    );
  }

  // Not a participant yet — either the creator's own first load (edge case,
  // shouldn't happen) or a friend opening the shared link for the first
  // time.
  if (!me) {
    if (match.participants.length >= 2) {
      return (
        <div className="mx-auto max-w-md px-5 py-14 text-center text-sm text-[#6B7094]">
          Ce défi est déjà complet.
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md px-5 py-14 text-center sm:px-8">
        <h1 className="mb-3 font-heading text-xl font-extrabold text-[#1A0E33]">
          {match.participants[0]?.name} te défie ! ⚔️
        </h1>
        <p className="mb-6 text-sm text-[#6B7094]">
          {match.questions.length} questions · niveau {match.level}
        </p>
        <QzButton tone="accent" size="lg" onClick={join} disabled={joining}>
          {joining ? "…" : "Accepter le défi"}
        </QzButton>
      </div>
    );
  }

  if (match.status === "waiting") {
    const link = typeof window !== "undefined" ? window.location.href : "";
    return (
      <div className="mx-auto max-w-md px-5 py-14 text-center sm:px-8">
        <h1 className="mb-3 font-heading text-xl font-extrabold text-[#1A0E33]">
          En attente d&apos;un adversaire…
        </h1>
        <p className="mb-6 text-sm text-[#6B7094]">
          Partage ce lien avec la personne que tu veux défier :
        </p>
        <div className="mb-6 break-all rounded-2xl bg-[#F6EEFF] p-4 text-xs text-[#1A0E33]">
          {link}
        </div>
        <div className="flex justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-[#7B2FE3] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (match.status === "finished" || me.finished) {
    const iWon = me.score !== null && opponent?.score !== null && me.score > (opponent?.score ?? -1);
    const tie = me.score !== null && me.score === opponent?.score;
    const waitingOnOpponent = match.status !== "finished";

    return (
      <div className="mx-auto max-w-md px-5 py-14 text-center sm:px-8">
        {waitingOnOpponent ? (
          <>
            <h1 className="mb-3 font-heading text-xl font-extrabold text-[#1A0E33]">
              En attente de {opponent?.name ?? "ton adversaire"}…
            </h1>
            <div className="mb-6 flex justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-[#7B2FE3] border-t-transparent" />
            </div>
          </>
        ) : (
          <h1 className="mb-6 font-heading text-xl font-extrabold text-[#1A0E33]">
            {iWon ? "Victoire ! 🏆" : tie ? "Égalité ! 🤝" : "Défaite 😢"}
          </h1>
        )}

        <div className="flex flex-col gap-3">
          {[me, opponent].map((p, i) =>
            p ? (
              <div
                key={p.profileId}
                className="flex items-center justify-between rounded-2xl bg-[#F6EEFF] px-4 py-3"
              >
                <span className="flex items-center gap-2.5 text-sm font-bold text-[#1A0E33]">
                  <QzAvatar avatar={p.avatar as AvatarId} name={p.name} size={32} />
                  {p.name} {i === 0 && "(toi)"}
                </span>
                <span className="text-sm font-extrabold text-[#7B2FE3]">
                  {p.score !== null ? `${p.score}/${total}` : "en cours…"}
                </span>
              </div>
            ) : null
          )}
        </div>

        <QzButton href="/duel/en-ligne" tone="accent" className="mt-8">
          Nouveau défi
        </QzButton>
      </div>
    );
  }

  if (!question) return null;

  const progressPct = Math.round((index / total) * 100);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10 sm:px-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold text-[#6B7094]">
          <QzAvatar avatar={me.avatar as AvatarId} name={me.name} size={24} /> {score}
          <span className="text-[#C7BEE0]">vs</span>
          <QzAvatar
            avatar={(opponent?.avatar as AvatarId) ?? "violet-orange"}
            name={opponent?.name ?? "?"}
            size={24}
          />{" "}
          {opponent?.score ?? "…"}
        </span>
        <div className="flex items-center gap-3 text-xs font-semibold text-[#6B7094]">
          <span>
            Question {index + 1}/{total}
          </span>
          {status === "waiting" || status === "selected" ? (
            <span className="rounded-full bg-[#FF7A1A] px-2.5 py-1 text-white">
              ⏱ {String(secondsLeft).padStart(2, "0")}
            </span>
          ) : status === "correct" ? (
            <span className="rounded-full bg-[#17D1C9] px-2.5 py-1 font-extrabold text-[#1A0E33]">
              +{100 + secondsLeft * 5} <Flame className="inline size-3" />
            </span>
          ) : (
            <span>+0 🔥</span>
          )}
        </div>
      </div>

      <div className="mb-6 h-2 w-full rounded-full bg-[#EDE0FF]">
        <div
          className="h-2 rounded-full bg-[#FFD23F] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9BA0C2]">
        {question.theme}
      </div>
      <h1 className="mb-7 font-heading text-xl font-extrabold leading-snug text-[#1A0E33] sm:text-2xl">
        {question.prompt}
      </h1>

      <div className="flex flex-col gap-3">
        {question.answers.map((answer, i) => (
          <AnswerOption
            key={i}
            label={String.fromCharCode(65 + i)}
            text={answer}
            state={answerState(status, i, selected, question.correctIndex)}
            onClick={() => handleSelect(i)}
          />
        ))}
      </div>

      {submitted && (
        <p className="mt-6 text-center text-xs text-[#9BA0C2]">
          Résultat envoyé, en attente de la mise à jour…
        </p>
      )}
    </div>
  );
}
