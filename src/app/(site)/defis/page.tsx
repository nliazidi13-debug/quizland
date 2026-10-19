"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { getCurrentProfile, claimDaily } from "@/lib/profile";
import {
  computeDailyChallenges,
  isToday,
  type DailyChallengeId,
  type DailyChallengeView,
} from "@/lib/dailyChallenges";
import { QzButton } from "@/components/quizland/qz-button";

export default function DefisPage() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [challenges, setChallenges] = useState<DailyChallengeView[]>([]);

  const refresh = async () => {
    const current = await getCurrentProfile();
    setHasProfile(!!current);
    if (!current) {
      setChallenges([]);
      return;
    }
    const todayResults = current.profile.history.filter((r) =>
      isToday(r.completedAt)
    );
    setChallenges(computeDailyChallenges(todayResults, current.claimedToday));
  };

  // Profile/history data isn't available during server rendering (it's
  // either in localStorage or behind an authenticated fetch); read it
  // after mount so the server-rendered markup matches the client's first
  // paint.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const claim = async (id: DailyChallengeId) => {
    const result = await claimDaily(id);
    if (!result) return;
    await refresh();
  };

  if (hasProfile === null) return null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="mb-8 font-heading text-2xl font-extrabold text-[#7B2FE3] sm:text-[26px]">
        Défis quotidiens ⚡
      </h1>

      {!hasProfile ? (
        <div className="rounded-[18px] bg-[#F6EEFF] p-6 text-center">
          <p className="mb-4 text-sm text-[#6B7094]">
            Connecte-toi pour suivre tes défis du jour et récupérer tes
            récompenses.
          </p>
          <QzButton href="/connexion" tone="accent">
            Rejoindre l&apos;arène
          </QzButton>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {challenges.map((c) => (
            <div key={c.id} className="rounded-[18px] bg-[#F6EEFF] p-[18px]">
              <div className="mb-1.5 font-heading text-sm font-extrabold text-[#1A0E33]">
                {c.title}
              </div>
              <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#7B2FE3]">
                <Gift className="size-3.5" /> +{c.reward.xp} XP
                {c.reward.badge && ` · Badge ${c.reward.badge.icon}`}
              </div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-[#6B7094]">
                <span>
                  {c.progress}/{c.target}
                </span>
              </div>
              <div className="h-[9px] rounded-full bg-[#E3D3FA]">
                <div
                  className="h-[9px] rounded-full bg-[#FF7A1A] transition-all"
                  style={{ width: `${c.progressPct}%` }}
                />
              </div>
              {c.completed && !c.claimed && (
                <button
                  onClick={() => claim(c.id)}
                  className="mt-3 w-full rounded-full bg-[#0E9A94] py-2 text-[11px] font-extrabold text-white transition hover:brightness-110"
                >
                  Récupérer la récompense !
                </button>
              )}
              {c.claimed && (
                <div className="mt-3 text-[11px] font-extrabold text-[#0E9A94]">
                  ✓ Récompense récupérée
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-[#6B7094]">
        Les défis se réinitialisent chaque jour à minuit. Reviens demain pour
        de nouvelles missions&nbsp;!
      </p>
    </div>
  );
}
