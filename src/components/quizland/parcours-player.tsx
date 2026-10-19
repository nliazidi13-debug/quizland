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
import { AnswerOption, answerState } from "@/components/quizland/quiz-player";
import { getDomain } from "@/lib/data";
import { recordResult } from "@/lib/profile";
import {
  completeLeg,
  getParcoursState,
  saveParcoursState,
  setParcoursSummary,
} from "@/lib/parcours";
import {
  playCorrectSound,
  playIncorrectSound,
  speakText,
  stopSpeaking,
} from "@/lib/sound";
import type { ParcoursState, QuizAnswerState } from "@/lib/types";

const QUESTION_SECONDS = 15;
const REVEAL_DELAY_SELECTED = 650;
const REVEAL_HOLD = 1500;

/** Same nonce-remount trick as QuizPlayer: every navigation to this page
 * carries a fresh `t`, so Next's router cache can never reuse a stale
 * mounted instance (e.g. after abandoning a Parcours and starting another
 * one right away). */
export function ParcoursPlayer() {
  const searchParams = useSearchParams();
  const nonce = searchParams.get("t") ?? "0";
  return <ParcoursSession key={nonce} />;
}

function ParcoursSession() {
  const router = useRouter();
  const [state, setState] = useState<ParcoursState | null | undefined>(undefined);
  const [status, setStatus] = useState<QuizAnswerState>("waiting");
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [quitOpen, setQuitOpen] = useState(false);

  const legStartedAt = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const advancingRef = useRef(false);

  useEffect(() => {
    legStartedAt.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getParcoursState());
  }, []);

  useEffect(() => {
    if (state === null) router.replace("/parcours");
  }, [state, router]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      stopSpeaking();
    };
  }, []);

  const question = state?.questions[state.questionIndex];

  const goToNext = useCallback(
    (
      current: ParcoursState,
      finalScore: number,
      finalXp: number,
      finalThemeErrors: Record<string, number>
    ) => {
      const nextQuestionIndex = current.questionIndex + 1;

      if (nextQuestionIndex < current.questions.length) {
        const next: ParcoursState = {
          ...current,
          questionIndex: nextQuestionIndex,
          score: finalScore,
          xp: finalXp,
          themeErrors: finalThemeErrors,
        };
        saveParcoursState(next);
        setState(next);
        setStatus("waiting");
        setSelected(null);
        setSecondsLeft(QUESTION_SECONDS);
        return;
      }

      if (advancingRef.current) return;
      advancingRef.current = true;

      const timeSeconds = Math.round((Date.now() - legStartedAt.current) / 1000);
      const legResult = {
        domain: current.domains[current.domainIndex],
        score: finalScore,
        total: current.questions.length,
        xp: finalXp,
      };
      recordResult({
        domain: legResult.domain,
        level: current.level,
        score: finalScore,
        total: legResult.total,
        xp: finalXp,
        timeSeconds,
        themeErrors: finalThemeErrors,
        completedAt: Date.now(),
      });

      const result = completeLeg(current, legResult);
      if (result.done) {
        setParcoursSummary(result.summary);
        router.push("/parcours/termine");
        return;
      }

      legStartedAt.current = Date.now();
      advancingRef.current = false;
      setState(result.next);
      setStatus("waiting");
      setSelected(null);
      setSecondsLeft(QUESTION_SECONDS);
    },
    [router]
  );

  const reveal = useCallback(
    (chosenIndex: number | null) => {
      if (!state || !question) return;
      const isCorrect = chosenIndex === question.correctIndex;
      const nextScore = state.score + (isCorrect ? 1 : 0);
      const gained = isCorrect ? 100 + secondsLeft * 5 : 0;
      const nextXp = state.xp + gained;
      const nextThemeErrors = { ...state.themeErrors };
      if (!isCorrect) {
        nextThemeErrors[question.theme] = (nextThemeErrors[question.theme] ?? 0) + 1;
      }
      setStatus(isCorrect ? "correct" : "incorrect");
      stopSpeaking();
      if (isCorrect) playCorrectSound();
      else playIncorrectSound();

      const t = setTimeout(() => {
        goToNext(state, nextScore, nextXp, nextThemeErrors);
      }, REVEAL_HOLD);
      timeoutsRef.current.push(t);
    },
    [state, question, secondsLeft, goToNext]
  );

  const handleSelect = (i: number) => {
    if (status !== "waiting") return;
    setSelected(i);
    setStatus("selected");
    const t = setTimeout(() => reveal(i), REVEAL_DELAY_SELECTED);
    timeoutsRef.current.push(t);
  };

  useEffect(() => {
    if (!question || status !== "waiting") return;
    if (secondsLeft <= 0) {
      const t = setTimeout(() => reveal(null), 0);
      timeoutsRef.current.push(t);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    timeoutsRef.current.push(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, secondsLeft, question]);

  // Read each new question aloud once it appears.
  useEffect(() => {
    if (!question) return;
    speakText(question.prompt);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  if (!state || !question) return null;

  const domain = getDomain(state.domains[state.domainIndex]);
  if (!domain) return null;

  const legProgressPct = Math.round((state.questionIndex / state.questions.length) * 100);

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
            Domaine {state.domainIndex + 1}/{state.domains.length} · Q
            {state.questionIndex + 1}/{state.questions.length}
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

      <div className="mb-6 h-2 w-full rounded-full bg-[#3A1763]">
        <div
          className="h-2 rounded-full bg-[#FFD23F] transition-all duration-300"
          style={{ width: `${legProgressPct}%` }}
        />
      </div>

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9b8fc2]">
        {domain.icon} {domain.name} · {question.theme}
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
          <DialogTitle>Quitter le parcours ?</DialogTitle>
          <DialogDescription className="text-[#D9CCF5]">
            Pas de souci : ta progression est sauvegardée, tu reprendras exactement
            là où tu t&apos;es arrêté.
          </DialogDescription>
          <DialogFooter className="border-[#3A1763] bg-transparent">
            <QzButton
              tone="outline"
              onClick={() => setQuitOpen(false)}
              className="border-white/20"
            >
              Rester
            </QzButton>
            <QzButton tone="accent" href="/parcours">
              Quitter
            </QzButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
