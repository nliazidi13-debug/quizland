"use client";

import { useEffect, useState } from "react";
import { QzButton } from "@/components/quizland/qz-button";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { getDuelSummary } from "@/lib/duel";
import type { DuelSummary } from "@/lib/types";

export default function DuelTerminePage() {
  const [summary, setSummary] = useState<DuelSummary | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary(getDuelSummary());
  }, []);

  if (summary === undefined) return null;

  if (summary === null) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 text-center text-white">
        <h1 className="font-heading text-xl font-extrabold">Aucun duel terminé</h1>
        <p className="text-sm text-[#D9CCF5]">
          Lance un duel pour voir le résultat ici.
        </p>
        <QzButton href="/duel" tone="accent">
          Lancer un duel
        </QzButton>
      </div>
    );
  }

  const maxScore = Math.max(...summary.players.map((p) => p.score));
  const winners = summary.players.filter((p) => p.score === maxScore);
  const isTie = winners.length > 1;

  const title = isTie
    ? winners.length === summary.players.length
      ? "Égalité parfaite ! 🤝"
      : `Égalité entre ${winners.map((w) => w.name).join(" et ")} ! 🤝`
    : `${winners[0].name} remporte le duel ! 🏆`;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1">
      <h1 className="mb-2 text-center font-heading text-2xl font-extrabold text-white">
        {title}
      </h1>
      <p className="mb-10 text-center text-sm text-[#D9CCF5]">
        {summary.total} questions chacun
      </p>

      <div
        className={`mb-10 grid gap-4 ${
          summary.players.length === 3 ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        {summary.players.map((p) => {
          const isWinner = winners.some((w) => w.id === p.id);
          return (
            <div
              key={p.id}
              className={`flex flex-col items-center rounded-2xl p-6 ${
                isWinner ? "bg-[#2A1150] ring-2 ring-[#FFD23F]" : "bg-[#2A1150]"
              }`}
            >
              <QzAvatar avatar={p.avatar} name={p.name} size={56} className="mb-3" />
              <div className="mb-1 font-heading text-sm font-extrabold text-white">
                {p.name}
              </div>
              <div className="font-heading text-3xl font-extrabold text-[#FFD23F]">
                {p.score}/{summary.total}
              </div>
              <div className="mt-1 text-xs text-[#D9CCF5]">+{p.xp} XP</div>
              {isWinner && <div className="mt-2 text-lg">🏆</div>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-3.5">
        <QzButton href="/duel" tone="accent" size="lg">
          Nouveau duel
        </QzButton>
        <QzButton href="/domaines" tone="outline" size="lg">
          Retour aux domaines
        </QzButton>
      </div>
    </div>
  );
}
