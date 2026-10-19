"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QzButton } from "@/components/quizland/qz-button";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { avatarIds } from "@/lib/data";
import {
  createProfile,
  listProfiles,
  setActiveProfileId,
} from "@/lib/player";
import type { AvatarId, PlayerProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LocalProfilePicker() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<PlayerProfile[] | null>(null);
  const [mode, setMode] = useState<"pick" | "create">("create");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>(avatarIds[0]);

  // Profiles live in localStorage only; read them after mount so the
  // server-rendered markup matches the client's first paint.
  useEffect(() => {
    const existing = listProfiles();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(existing);
    if (existing.length > 0) {
      setMode("pick");
    }
  }, []);

  if (profiles === null) return null;

  const selectProfile = (id: string) => {
    setActiveProfileId(id);
    router.push("/domaines");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProfile(name || "Joueur", avatar);
    router.push("/domaines");
  };

  const playAsGuest = () => {
    createProfile("Invité", avatarIds[Math.floor(Math.random() * avatarIds.length)]);
    router.push("/domaines");
  };

  return (
    <>
      {mode === "pick" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProfile(p.id)}
                className="flex items-center gap-3 rounded-full border-2 border-[#3A1763] px-4 py-3 text-left transition hover:border-[#FFD23F]"
              >
                <QzAvatar avatar={p.avatar} name={p.name} size={36} />
                <span className="flex-1">
                  <span className="block text-sm font-bold text-white">
                    {p.name}
                  </span>
                  <span className="block text-xs text-[#9b8fc2]">
                    {p.xp.toLocaleString("fr-FR")} XP
                  </span>
                </span>
              </button>
            ))}
          </div>

          <QzButton
            tone="accent"
            className="w-full"
            onClick={() => setMode("create")}
          >
            + Nouveau profil
          </QzButton>

          <Link
            href="/profils"
            className="text-center text-xs font-semibold text-[#9b8fc2] hover:text-white"
          >
            Gérer les profils →
          </Link>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="pseudo" className="mb-1.5 text-[#D9CCF5]">
              Pseudo
            </Label>
            <Input
              id="pseudo"
              placeholder="SuperQuizzer42"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-full border-2 border-[#3A1763] bg-transparent px-4 py-5 text-white placeholder:text-[#6B6190] focus-visible:border-[#FFD23F] focus-visible:ring-0"
            />
          </div>

          <div>
            <Label className="mb-2 block text-[#D9CCF5]">Avatar</Label>
            <div className="flex flex-wrap gap-3">
              {avatarIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAvatar(id)}
                  className={cn(
                    "rounded-full p-0.5 transition",
                    avatar === id
                      ? "ring-2 ring-[#FFD23F]"
                      : "ring-2 ring-transparent"
                  )}
                  aria-label={`Choisir l'avatar ${id}`}
                >
                  <QzAvatar avatar={id} name={name} size={40} />
                </button>
              ))}
            </div>
          </div>

          <QzButton type="submit" tone="accent" className="mt-2 w-full">
            Créer mon profil
          </QzButton>

          {profiles.length > 0 && (
            <button
              type="button"
              onClick={() => setMode("pick")}
              className="text-center text-xs font-semibold text-[#9b8fc2] hover:text-white"
            >
              ← Choisir un profil existant
            </button>
          )}
        </form>
      )}

      <button
        onClick={playAsGuest}
        className="mt-6 text-center text-xs font-semibold text-[#9b8fc2] hover:text-white"
      >
        Continuer en tant qu&apos;invité →
      </button>
    </>
  );
}
