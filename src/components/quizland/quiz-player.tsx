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
import { setLastResult } from "@/lib/player";
import { recordResult } from "@/lib/profile";
import { QUIZ_LENGTH, shuffleQuestions } from "@/lib/questions";
import {
  playCorrectSound,
  playIncorrectSound,
  speakText,
  stopSpeaking,
} from "@/lib/sound";
import type { Domain, Question, QuizAnswerState } from "@/lib/types";

const QUESTION_SECONDS = 15;
const REVEAL_DELAY_SELECTED = 650;
const REVEAL_HOLD = 1500;

/**
 * Thin wrapper whose only job is to force a fresh QuizSession whenever the
 * launch nonce (`t`, stamped by QuizLaunchLink/QuizLaunchButton on every
 * "play" click) changes. Without this, a replay that Next's client-side
 * router cache resolves by reusing an already-mounted page instance would
 * never re-run QuizSession's mount effect — leaving the same shuffled
 * question order as the previous attempt.
 */
export function QuizPlayer({
  domain,
  questions,
}: {
  domain: Domain;
  questions: Question[];
}) {
  const searchParams = useSearchParams();
  const nonce = searchParams.get("t") ?? "0";
  return <QuizSession key={nonce} domain={domain} questions={questions} />;
}

function QuizSession({
  domain,
  questions: rawQuestions,
}: {
  domain: Domain;
  questions: Question[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = Number(searchParams.get("level")) || 3;

  // The page is statically exported, so the shuffle (which must differ
  // every playthrough) can't happen during server/static rendering — it
  // runs once on mount instead. Starting at null keeps the very first
  // client render in sync with the static markup (no questions shown yet).
  const [questions, setQuestions] = useState<Question[] | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuestions(shuffleQuestions(rawQuestions, QUIZ_LENGTH, domain.slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<QuizAnswerState>("waiting");
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [themeErrors, setThemeErrors] = useState<Record<string, number>>({});
  const [quitOpen, setQuitOpen] = useState(false);

  const startedAt = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishingRef = useRef(false);

  const question = questions?.[index];
  const total = questions?.length ?? 0;

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const finishQuiz = useCallback(
    (finalScore: number, finalXp: number, finalThemeErrors: Record<string, number>) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      const timeSeconds = Math.round((Date.now() - startedAt.current) / 1000);
      const result = {
        domain: domain.slug,
        level,
        score: finalScore,
        total,
        xp: finalXp,
        timeSeconds,
        themeErrors: finalThemeErrors,
        completedAt: Date.now(),
      };
      recordResult(result);
      setLastResult(result);
      router.push("/resultats");
    },
    [domain.slug, level, total, router]
  );

  const goToNext = useCallback(
    (finalScore: number, finalXp: number, finalThemeErrors: Record<string, number>) => {
      if (index + 1 >= total) {
        finishQuiz(finalScore, finalXp, finalThemeErrors);
        return;
      }
      setIndex((i) => i + 1);
      setStatus("waiting");
      setSelected(null);
      setSecondsLeft(QUESTION_SECONDS);
    },
    [index, total, finishQuiz]
  );

  const reveal = useCallback(
    (chosenIndex: number | null) => {
      if (!question) return;
      const isCorrect = chosenIndex === question.correctIndex;
      const nextScore = score + (isCorrect ? 1 : 0);
      const gained = isCorrect ? 100 + secondsLeft * 5 : 0;
      const nextXp = xp + gained;
      const nextThemeErrors = { ...themeErrors };
      if (!isCorrect) {
        nextThemeErrors[question.theme] = (nextThemeErrors[question.theme] ?? 0) + 1;
      }
      setScore(nextScore);
      setXp(nextXp);
      setThemeErrors(nextThemeErrors);
      setStatus(isCorrect ? "correct" : "incorrect");
      stopSpeaking();
      if (isCorrect) playCorrectSound();
      else playIncorrectSound();

      const t = setTimeout(() => {
        goToNext(nextScore, nextXp, nextThemeErrors);
      }, REVEAL_HOLD);
      timeoutsRef.current.push(t);
    },
    [question, score, xp, secondsLeft, themeErrors, goToNext]
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

  useEffect(() => {
    startedAt.current = Date.now();
    return () => {
      clearTimeouts();
      stopSpeaking();
    };
  }, []);

  // Read each new question aloud once it appears.
  useEffect(() => {
    if (!question) return;
    speakText(question.prompt);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  if (!question) return null;

  const progressPct = Math.round((index / total) * 100);

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
            <span className="text-[#D9CCF5]">+0 🔥</span>
          )}
        </div>
      </div>

      <div className="mb-6 h-2 w-full rounded-full bg-[#3A1763]">
        <div
          className="h-2 rounded-full bg-[#FFD23F] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
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
          <DialogTitle>Quitter la partie ? 😢</DialogTitle>
          <DialogDescription className="text-[#D9CCF5]">
            Ta série de victoires sera perdue !
          </DialogDescription>
          <DialogFooter className="border-[#3A1763] bg-transparent">
            <QzButton
              tone="outline"
              onClick={() => setQuitOpen(false)}
              className="border-white/20"
            >
              Rester
            </QzButton>
            <QzButton tone="accent" href="/domaines">
              Quitter
            </QzButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type Visual = "base" | "selected" | "correct" | "incorrect" | "dim";

export function answerState(
  status: QuizAnswerState,
  i: number,
  selected: number | null,
  correctIndex: number
): Visual {
  if (status === "waiting") return "base";
  if (status === "selected") return i === selected ? "selected" : "base";
  if (status === "correct" || status === "incorrect") {
    if (i === correctIndex) return "correct";
    if (i === selected) return "incorrect";
    return "dim";
  }
  return "base";
}

export function AnswerOption({
  label,
  text,
  state,
  onClick,
}: {
  label: string;
  text: string;
  state: Visual;
  onClick: () => void;
}) {
  const classes: Record<Visual, string> = {
    base: "border-[#3A1763] text-white hover:border-[#5a2f92]",
    selected: "border-[#FFD23F] bg-[#3A1763] text-white",
    correct: "border-[#17D1C9] bg-[#0E5C58] text-[#17D1C9]",
    incorrect: "border-[#FF4D6D] bg-[#5C1A2B] text-[#FF4D6D]",
    dim: "border-[#3A1763] text-white opacity-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== "base"}
      className={`rounded-full border-2 px-5 py-3 text-left text-sm font-bold transition ${classes[state]}`}
    >
      {label}. {text}
      {state === "correct" && " ✓"}
      {state === "incorrect" && " ✕"}
    </button>
  );
}
