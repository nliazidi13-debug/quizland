"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDomain, levels } from "@/lib/data";
import { getLastResult } from "@/lib/player";
import { QzButton } from "@/components/quizland/qz-button";
import { QuizLaunchButton } from "@/components/quizland/quiz-launch-button";
import type { QuizResult } from "@/lib/types";

export default function ResultatsPage() {
  const [result, setResult] = useState<QuizResult | null | undefined>(
    undefined
  );

  // Result lives in sessionStorage only; read it after mount so the
  // server-rendered markup matches the client's first paint.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(getLastResult());
  }, []);

  if (result === undefined) return null;

  if (result === null) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 text-center text-white">
        <h1 className="font-heading text-xl font-extrabold">
          Aucun résultat à afficher
        </h1>
        <p className="text-sm text-[#D9CCF5]">
          Lance un quiz pour voir tes résultats ici.
        </p>
        <QzButton href="/domaines" tone="accent">
          Choisir un domaine
        </QzButton>
      </div>
    );
  }

  const domain = getDomain(result.domain);
  const levelLabel = levels.find((l) => l.id === result.level)?.name ?? "Moyen";
  const pct = Math.round((result.score / result.total) * 100);
  const deg = Math.round((pct / 100) * 360);
  const minutes = Math.floor(result.timeSeconds / 60);
  const seconds = result.timeSeconds % 60;

  const errorEntries = Object.entries(result.themeErrors);
  const maxErrors = Math.max(1, ...errorEntries.map(([, c]) => c));

  const radarScale = 0.4 + (pct / 100) * 0.5;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1">
      <h1 className="mb-8 text-center font-heading text-2xl font-extrabold text-white sm:text-left">
        Résultats 🎉 — {domain?.name ?? "Quiz"}, niveau {levelLabel}
      </h1>

      <div className="grid gap-8 sm:grid-cols-[220px_1fr_1fr]">
        {/* Score ring */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="flex size-40 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#FF7A1A 0deg ${deg}deg, #3A2159 ${deg}deg 360deg)`,
            }}
          >
            <div className="flex size-[116px] flex-col items-center justify-center rounded-full bg-[#1A0E33]">
              <div className="font-heading text-[28px] font-extrabold text-[#FFD23F]">
                {pct}%
              </div>
              <div className="text-[11px] text-[#D9CCF5]">
                {result.score}/{result.total} bonnes
              </div>
            </div>
          </div>
          <div className="mt-3.5 text-xs text-[#D9CCF5]">
            ⏱ {minutes}min {seconds}s · +{result.xp} XP
          </div>
        </div>

        {/* Error breakdown */}
        <div>
          <div className="mb-3 text-[13px] font-extrabold text-[#D9CCF5]">
            Répartition des erreurs
          </div>
          {errorEntries.length === 0 ? (
            <p className="text-sm text-[#17D1C9]">
              Aucune erreur, sans faute ! 🔥
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {errorEntries.map(([theme, count]) => (
                <div key={theme}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-white">{theme}</span>
                    <span className="text-[#D9CCF5]">{count}</span>
                  </div>
                  <div className="h-[9px] rounded-full bg-[#3A1763]">
                    <div
                      className="h-[9px] rounded-full bg-[#FF4D6D]"
                      style={{ width: `${(count / maxErrors) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Radar */}
        <div>
          <div className="mb-3 text-[13px] font-extrabold text-[#D9CCF5]">
            Profil (radar simplifié)
          </div>
          <div
            className="relative mx-auto size-[180px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, #3A1763 0%, #3A1763 60%, #2A1150 61%, #2A1150 100%)",
            }}
          >
            <div
              className="absolute inset-0 bg-[#FFD23F] opacity-80"
              style={{
                clipPath:
                  "polygon(50% 14%, 91.8% 36.4%, 69.1% 76.3%, 23.2% 86.8%, 12.9% 37.9%)",
                transform: `scale(${radarScale})`,
                transformOrigin: "center",
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3.5 sm:justify-start">
        <QuizLaunchButton domain={result.domain} level={result.level} tone="accent" size="lg">
          Rejouer
        </QuizLaunchButton>
        <QzButton href="/classement" tone="teal" size="lg">
          Voir le classement
        </QzButton>
        <QzButton href="/domaines" tone="outline" size="lg">
          Autre domaine
        </QzButton>
      </div>

      <p className="mt-6 text-center text-xs text-[#9b8fc2] sm:text-left">
        <Link href="/profil" className="underline hover:text-white">
          Voir mon profil complet →
        </Link>
      </p>
    </div>
  );
}
