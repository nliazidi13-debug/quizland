"use client";

import { useEffect, useState } from "react";
import { listProfiles } from "@/lib/player";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { QzButton } from "@/components/quizland/qz-button";
import type { PlayerProfile } from "@/lib/types";

const podiumHeights = ["h-[60px]", "h-[90px]", "h-[44px]"];
const podiumColors = ["bg-[#7B2FE3]", "bg-[#FF7A1A]", "bg-[#17D1C9]"];
const podiumMedals = ["🥈", "🥇", "🥉"];

export default function ClassementPage() {
  const [profiles, setProfiles] = useState<PlayerProfile[] | null>(null);

  // Profiles live in localStorage only; read them after mount so the
  // server-rendered markup matches the client's first paint.
  useEffect(() => {
    const ranked = listProfiles()
      .slice()
      .sort((a, b) => b.xp - a.xp);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(ranked);
  }, []);

  if (profiles === null) return null;

  const top3 = profiles.slice(0, 3);
  // Display order on the podium: silver, gold, bronze.
  const podium = [top3[1], top3[0], top3[2]];

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#1A0E33]">
      <div className="mx-auto max-w-3xl px-5 py-10 text-white sm:px-8 sm:py-14">
        <h1 className="mb-8 font-heading text-2xl font-extrabold">
          Classement 🏆
        </h1>

        {profiles.length === 0 ? (
          <div className="rounded-2xl bg-[#2A1150] p-8 text-center">
            <p className="text-sm text-[#D9CCF5]">
              Aucun joueur pour l&apos;instant. Crée ton profil et lance un
              quiz pour apparaître au classement !
            </p>
            <QzButton href="/connexion" tone="accent" className="mt-5">
              Rejoindre l&apos;arène
            </QzButton>
          </div>
        ) : (
          <>
            <div className="mb-10 flex items-end justify-center gap-4">
              {podium.map((p, i) =>
                p ? (
                  <div key={p.id} className="text-center">
                    <QzAvatar
                      avatar={p.avatar}
                      name={p.name}
                      size={i === 1 ? 56 : 44}
                      className="mx-auto mb-1.5"
                    />
                    <div
                      className={
                        i === 1
                          ? "text-[15px] font-extrabold text-[#FFD23F]"
                          : "text-[13px] font-bold"
                      }
                    >
                      {podiumMedals[i]} {p.name}
                    </div>
                    <div
                      className={`mt-2 w-[90px] rounded-t-xl ${podiumHeights[i]} ${podiumColors[i]}`}
                    />
                  </div>
                ) : null
              )}
            </div>

            <div className="flex flex-col">
              {profiles.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 border-b border-[#3A1763] py-3"
                >
                  <div className="w-6 font-extrabold text-[#FFD23F]">
                    #{i + 1}
                  </div>
                  <QzAvatar avatar={p.avatar} name={p.name} size={36} />
                  <div className="flex-1 text-sm font-bold">{p.name}</div>
                  <div className="text-sm font-extrabold text-[#17D1C9]">
                    {p.xp.toLocaleString("fr-FR")} XP
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
