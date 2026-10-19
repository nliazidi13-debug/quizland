"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flame } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { QzButton } from "@/components/quizland/qz-button";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { AnswerOption, answerState } from "@/components/quizland/quiz-player";
import { recordQuizResultForProfile } from "@/lib/player";
import {
  clearDuelState,
  duelResultDomain,
  getDuelState,
  saveDuelState,
  setDuelSummary,
} from "@/lib/duel";
import {
  playCorrectSound,
  playIncorrectSound,
  speakText,
  stopSpeaking,
} from "@/lib/sound";
import type { DuelState, QuizAnswerState } from "@/lib/types";

const QUESTION_SECONDS = 15;
const REVEAL_DELAY_SELECTED = 650;
const REVEAL_HOLD = 1500;

/** Same nonce-remount trick as QuizPlayer/ParcoursPlayer: a fresh `t` on
 * every navigation to this page guarantees a real remount, so Next's router
 * cache can never reuse a stale mounted instance from a previous duel. */
export function DuelPlayer() {
  const searchParams = useSearchParams();
  const nonce = searchParams.get("t") ?? "0";
  return <DuelSession key={nonce} />;
}

function DuelSession() {
  const router = useRouter();
  const [state, setState] = useState<DuelState | null | undefined>(undefined);
  const [phase, setPhase] = useState<"handoff" | "question">("question");
  const [status, setStatus] = useState<QuizAnswerState>("waiting");
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [quitOpen, setQuitOpen] = useState(false);

  const startedAt = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishingRef = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    const loaded = getDuelState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loaded);
    if (loaded && loaded.questionIndex > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("handoff");
    }
  }, []);

  useEffect(() => {
    if (state === null) router.replace("/duel");
  }, [state, router]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      stopSpeaking();
    };
  }, []);

  const turn = state ? state.questionIndex % state.players.length : 0;
  const question = state?.questions[state.questionIndex];
  const currentPlayer = state?.players[turn];

  const finishDuel = useCallback(
    (scores: number[], xp: number[], themeErrors: Record<string, number>[]) => {
      if (!state || finishingRef.current) return;
      finishingRef.current = true;
      const timeSeconds = Math.round((Date.now() - startedAt.current) / 1000);
      const domain = duelResultDomain(state.domains);
      const total = state.questions.length / state.players.length;

      state.players.forEach((p, i) => {
        recordQuizResultForProfile(p.id, {
          domain,
          level: state.level,
          score: scores[i],
          total,
          xp: xp[i],
          timeSeconds,
          themeErrors: themeErrors[i],
          completedAt: Date.now(),
        });
      });

      setDuelSummary({
        domains: state.domains,
        level: state.level,
        total,
        players: state.players.map((p, i) => ({ ...p, score: scores[i], xp: xp[i] })),
        completedAt: Date.now(),
      });
      clearDuelState();
      router.push("/duel/termine");
    },
    [state, router]
  );

  const goToNext = useCallback(
    (scores: number[], xp: number[], themeErrors: Record<string, number>[]) => {
      if (!state) return;
      const nextIndex = state.questionIndex + 1;
      if (nextIndex >= state.questions.length) {
        finishDuel(scores, xp, themeErrors);
        return;
      }
      const next: DuelState = { ...state, questionIndex: nextIndex, scores, xp, themeErrors };
      saveDuelState(next);
      setState(next);
      setPhase("handoff");
      setStatus("waiting");
      setSelected(null);
      setSecondsLeft(QUESTION_SECONDS);
    },
    [state, finishDuel]
  );

  const reveal = useCallback(
    (chosenIndex: number | null) => {
      if (!state || !question) return;
      const isCorrect = chosenIndex === question.correctIndex;
      const scores = [...state.scores];
      const xp = [...state.xp];
      const themeErrors = state.themeErrors.map((te) => ({ ...te }));
      const gained = isCorrect ? 100 + secondsLeft * 5 : 0;
      scores[turn] += isCorrect ? 1 : 0;
      xp[turn] += gained;
      if (!isCorrect) {
        themeErrors[turn][question.theme] = (themeErrors[turn][question.theme] ?? 0) + 1;
      }
      setStatus(isCorrect ? "correct" : "incorrect");
      stopSpeaking();
      if (isCorrect) playCorrectSound();
      else playIncorrectSound();

      const t = setTimeout(() => {
        goToNext(scores, xp, themeErrors);
      }, REVEAL_HOLD);
      timeoutsRef.current.push(t);
    },
    [state, question, secondsLeft, turn, goToNext]
  );

  const handleSelect = (i: number) => {
    if (status !== "waiting") return;
    setSelected(i);
    setStatus("selected");
    const t = setTimeout(() => reveal(i), REVEAL_DELAY_SELECTED);
    timeoutsRef.current.push(t);
  };

  useEffect(() => {
    if (phase !== "question" || !question || status !== "waiting") return;
    if (secondsLeft <= 0) {
      const t = setTimeout(() => reveal(null), 0);
      timeoutsRef.current.push(t);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    timeoutsRef.current.push(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, status, secondsLeft, question]);

  // Read each new question aloud once it's actually shown (not during handoff).
  useEffect(() => {
    if (phase !== "question" || !question) return;
    speakText(question.prompt);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question?.id]);

  if (!state || !question || !currentPlayer) return null;

  if (phase === "handoff") {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center text-center">
        <QzAvatar avatar={currentPlayer.avatar} name={currentPlayer.name} size={72} className="mb-5" />
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#9b8fc2]">
          Passe l&apos;appareil à
        </p>
        <h1 className="mb-8 font-heading text-2xl font-extrabold text-white">
          {currentPlayer.name}
        </h1>
        <div className="mb-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm font-semibold text-[#D9CCF5]">
          {state.players.map((p, i) => (
            <span key={p.id}>
              {p.name} {state.scores[i]}
            </span>
          ))}
        </div>
        <QzButton tone="accent" size="lg" onClick={() => setPhase("question")}>
          Je suis prêt·e !
        </QzButton>
      </div>
    );
  }

  const progressPct = Math.round((state.questionIndex / state.questions.length) * 100);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setQuitOpen(true)}
          className="text-xs font-semibold text-[#D9CCF5] hover:text-white"
        >
          ✕ Quitter
        </button>
        <div className="flex items-center gap-3 text-xs font-semibold text-[#D9CCF5]">
          <span>
            Question {state.questionIndex + 1}/{state.questions.length}
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
            <span className="text-[#D9CCF5]">+0 🔥</span>
          )}
        </div>
      </div>

      <div className="mb-4 h-2 w-full rounded-full bg-[#3A1763]">
        <div
          className="h-2 rounded-full bg-[#FFD23F] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mb-5 flex items-center justify-center gap-2.5 rounded-full bg-[#2A1150] px-4 py-2">
        <QzAvatar avatar={currentPlayer.avatar} name={currentPlayer.name} size={24} />
        <span className="text-xs font-extrabold text-white">
          Au tour de {currentPlayer.name}
        </span>
      </div>

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9b8fc2]">
        {question.theme}
      </div>
      <h1 className="mb-7 font-heading text-xl font-extrabold leading-snug text-white sm:text-2xl">
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

      <p
        className={`mt-5 text-sm font-extrabold ${
          status === "correct"
            ? "text-[#17D1C9]"
            : status === "incorrect"
              ? "text-[#FF4D6D]"
              : status === "selected"
                ? "text-[#FFD23F]"
                : "text-transparent"
        }`}
      >
        {status === "correct"
          ? "Bonne réponse ! 🎉"
          : status === "incorrect"
            ? "Dommage !"
            : status === "selected"
              ? "Réponse sélectionnée"
              : "—"}
      </p>

      <Dialog open={quitOpen} onOpenChange={setQuitOpen}>
        <DialogContent className="bg-[#1A0E33] text-white ring-0">
          <DialogTitle>Quitter le duel ?</DialogTitle>
          <DialogDescription className="text-[#D9CCF5]">
            Le score actuel sera perdu pour tous les joueurs.
          </DialogDescription>
          <DialogFooter className="border-[#3A1763] bg-transparent">
            <QzButton
              tone="outline"
              onClick={() => setQuitOpen(false)}
              className="border-white/20"
            >
              Rester
            </QzButton>
            <QzButton tone="accent" href="/duel">
              Quitter
            </QzButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
