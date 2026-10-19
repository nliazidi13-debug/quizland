"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { listProfiles } from "@/lib/player";
import { QzButton } from "@/components/quizland/qz-button";
import type { PlayerProfile } from "@/lib/types";

const medals = ["🥇", "🥈", "🥉"];

export function TopPlayersPanel() {
  const [profiles, setProfiles] = useState<PlayerProfile[] | null>(null);

  // Profiles live in localStorage only; read them after mount so the
  // server-rendered markup matches the client's first paint.
  useEffect(() => {
    const ranked = listProfiles()
      .slice()
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(ranked);
  }, []);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#7B2FE3] to-[#FF7A1A] p-7">
      <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-white">
        <Trophy className="size-4" />
        Top des joueurs
      </div>

      {!profiles || profiles.length === 0 ? (
        <p className="text-sm text-white/85">
          Aucun joueur pour l&apos;instant. Crée ton profil et lance ton
          premier quiz pour apparaître ici !
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {profiles.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold text-white"
            >
              <span className="flex items-center gap-2">
                <span>{medals[i]}</span> {p.name}
              </span>
              <span>{p.xp.toLocaleString("fr-FR")} XP</span>
            </div>
          ))}
        </div>
      )}

      <QzButton
        href="/classement"
        tone="dark"
        size="sm"
        className="mt-5 w-full bg-[#1A0E33]/40"
      >
        Classement complet
      </QzButton>
    </div>
  );
}
