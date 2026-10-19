"use client";

import { useEffect, useState } from "react";
import { getDomain } from "@/lib/data";
import { getParcoursSummary } from "@/lib/parcours";
import { QzButton } from "@/components/quizland/qz-button";
import type { ParcoursSummary } from "@/lib/types";

export default function ParcoursTerminePage() {
  const [summary, setSummary] = useState<ParcoursSummary | null | undefined>(
    undefined
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary(getParcoursSummary());
  }, []);

  if (summary === undefined) return null;

  if (summary === null) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 text-center text-white">
        <h1 className="font-heading text-xl font-extrabold">
          Aucun parcours terminé
        </h1>
        <p className="text-sm text-[#D9CCF5]">
          Lance un parcours pour voir le récapitulatif ici.
        </p>
        <QzButton href="/parcours" tone="accent">
          Lancer un parcours
        </QzButton>
      </div>
    );
  }

  const pct = Math.round((summary.totalScore / summary.totalQuestions) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1">
      <h1 className="mb-2 text-center font-heading text-2xl font-extrabold text-white">
        Parcours terminé ! 🏁
      </h1>
      <p className="mb-8 text-center text-sm text-[#D9CCF5]">
        {summary.totalScore}/{summary.totalQuestions} bonnes réponses ({pct}%) · +
        {summary.totalXp} XP
      </p>

      <div className="mb-10 flex flex-col gap-3">
        {summary.legResults.map((leg, i) => {
          const domain = getDomain(leg.domain);
          return (
            <div
              key={`${leg.domain}-${i}`}
              className="flex items-center justify-between rounded-2xl bg-[#2A1150] px-5 py-3.5"
            >
              <span className="text-sm font-bold text-white">
                {domain?.icon} {domain?.name ?? leg.domain}
              </span>
              <span className="text-sm font-extrabold text-[#FFD23F]">
                {leg.score}/{leg.total}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-3.5">
        <QzButton href="/parcours" tone="accent" size="lg">
          Nouveau parcours
        </QzButton>
        <QzButton href="/domaines" tone="outline" size="lg">
          Retour aux domaines
        </QzButton>
      </div>
    </div>
  );
}
