"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { domains, levels, avatarIds } from "@/lib/data";
import { QzButton } from "@/components/quizland/qz-button";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createProfile, listProfiles } from "@/lib/player";
import { startDuel } from "@/lib/duel";
import type { AvatarId, PlayerProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLAYER_COUNTS = [2, 3] as const;

export default function DuelPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<PlayerProfile[] | null>(null);
  const [playerCount, setPlayerCount] = useState<2 | 3>(2);
  const [playerIds, setPlayerIds] = useState<(string | null)[]>([null, null]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(domains.map((d) => d.slug))
  );
  const [level, setLevel] = useState(3);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState<AvatarId>(avatarIds[0]);

  useEffect(() => {
    const existing = listProfiles();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(existing);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayerIds([existing[0]?.id ?? null, existing[1]?.id ?? null]);
  }, []);

  if (profiles === null) return null;

  const toggleDomain = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const allSelected = selected.size === domains.length;

  const changePlayerCount = (count: 2 | 3) => {
    setPlayerCount(count);
    setPlayerIds((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push(null);
      return next;
    });
  };

  const setPlayerAt = (index: number, id: string) => {
    setPlayerIds((prev) => {
      const next = [...prev];
      next[index] = id;
      return next;
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = createProfile(newName || "Joueur", newAvatar);
    setProfiles([...profiles, profile]);
    const emptySlot = playerIds.findIndex((id) => !id);
    if (emptySlot !== -1) setPlayerAt(emptySlot, profile.id);
    setNewName("");
    setNewAvatar(avatarIds[Math.floor(Math.random() * avatarIds.length)]);
    setCreating(false);
  };

  const canStart =
    selected.size > 0 &&
    playerIds.length === playerCount &&
    playerIds.every((id) => !!id) &&
    new Set(playerIds).size === playerCount;

  const start = () => {
    if (!canStart) return;
    const players = playerIds
      .map((id) => profiles.find((p) => p.id === id))
      .filter((p): p is PlayerProfile => !!p)
      .map((p) => ({ id: p.id, name: p.name, avatar: p.avatar }));
    if (players.length !== playerCount) return;
    const order = domains.filter((d) => selected.has(d.slug)).map((d) => d.slug);
    startDuel(order, level, players);
    router.push(`/duel/jouer?t=${Date.now()}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="mb-2 font-heading text-2xl font-extrabold text-[#7B2FE3] sm:text-[26px]">
        Duel ⚔️
      </h1>
      <p className="mb-3 text-sm text-[#6B7094]">
        Deux ou trois joueurs, un seul appareil : chacun répond à son tour,
        question après question, et le meilleur score l&apos;emporte.
      </p>
      <Link
        href="/duel/en-ligne"
        className="mb-8 inline-block text-xs font-bold text-[#7B2FE3] hover:underline"
      >
        Préfères-tu défier un ami sur un autre appareil ? Duel en ligne →
      </Link>

      <h2 className="mb-3 font-heading text-sm font-extrabold text-[#1A0E33]">
        Nombre de joueurs
      </h2>
      <div className="mb-6 flex gap-2">
        {PLAYER_COUNTS.map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => changePlayerCount(count)}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              playerCount === count
                ? "bg-[#FF7A1A] text-white"
                : "bg-[#F6EEFF] text-[#1A0E33] hover:bg-[#EDE0FF]"
            }`}
          >
            {count} joueurs
          </button>
        ))}
      </div>

      {playerIds.map((id, index) => (
        <div key={index}>
          <h2 className="mt-6 mb-3 font-heading text-sm font-extrabold text-[#1A0E33]">
            Joueur {index + 1}
          </h2>
          <PlayerPicker
            profiles={profiles}
            selectedId={id}
            excludeIds={playerIds.filter((_, i) => i !== index)}
            onSelect={(pid) => setPlayerAt(index, pid)}
          />
        </div>
      ))}

      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-3 text-xs font-bold text-[#7B2FE3] hover:underline"
        >
          + Nouveau profil
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="mt-3 flex flex-col gap-3 rounded-2xl bg-[#F6EEFF] p-4"
        >
          <div>
            <Label htmlFor="duel-pseudo" className="mb-1.5 text-[#1A0E33]">
              Pseudo
            </Label>
            <Input
              id="duel-pseudo"
              placeholder="SuperQuizzer42"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-full border-2 border-[#EDE0FF] bg-white px-4 py-5 text-[#1A0E33]"
            />
          </div>
          <div>
            <Label className="mb-2 block text-[#1A0E33]">Avatar</Label>
            <div className="flex flex-wrap gap-3">
              {avatarIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNewAvatar(id)}
                  className={cn(
                    "rounded-full p-0.5 transition",
                    newAvatar === id
                      ? "ring-2 ring-[#FF7A1A]"
                      : "ring-2 ring-transparent"
                  )}
                  aria-label={`Choisir l'avatar ${id}`}
                >
                  <QzAvatar avatar={id} name={newName} size={36} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <QzButton type="submit" tone="accent" className="flex-1">
              Créer
            </QzButton>
            <QzButton
              type="button"
              tone="outline-light"
              onClick={() => setCreating(false)}
            >
              Annuler
            </QzButton>
          </div>
        </form>
      )}

      <div className="mt-8 mb-6 flex items-center justify-between">
        <h2 className="font-heading text-sm font-extrabold text-[#1A0E33]">
          Domaines ({selected.size}/{domains.length})
        </h2>
        <button
          type="button"
          onClick={() =>
            setSelected(allSelected ? new Set() : new Set(domains.map((d) => d.slug)))
          }
          className="text-xs font-bold text-[#7B2FE3] hover:underline"
        >
          {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {domains.map((d) => {
          const isOn = selected.has(d.slug);
          return (
            <button
              key={d.slug}
              type="button"
              onClick={() => toggleDomain(d.slug)}
              className={`rounded-2xl p-4 text-left transition ${
                isOn
                  ? "bg-[#7B2FE3] text-white"
                  : "bg-[#F6EEFF] text-[#1A0E33] hover:bg-[#EDE0FF]"
              }`}
            >
              <div className="mb-1 text-xl">{d.icon}</div>
              <div className="text-xs font-extrabold">{d.name}</div>
            </button>
          );
        })}
      </div>

      <h2 className="mb-3 font-heading text-sm font-extrabold text-[#1A0E33]">Niveau</h2>
      <div className="mb-10 flex flex-wrap gap-2">
        {levels.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLevel(l.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              level === l.id
                ? "bg-[#FF7A1A] text-white"
                : "bg-[#F6EEFF] text-[#1A0E33] hover:bg-[#EDE0FF]"
            }`}
          >
            {l.name} {l.stars}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <QzButton tone="accent" size="lg" onClick={start} disabled={!canStart}>
          Commencer le duel
        </QzButton>
      </div>

      <p className="mt-6 text-center text-xs text-[#9BA0C2]">
        <Link href="/domaines" className="underline hover:text-[#7B2FE3]">
          ← Retour aux domaines
        </Link>
      </p>
    </div>
  );
}

function PlayerPicker({
  profiles,
  selectedId,
  excludeIds,
  onSelect,
}: {
  profiles: PlayerProfile[];
  selectedId: string | null;
  excludeIds: (string | null)[];
  onSelect: (id: string) => void;
}) {
  if (profiles.length === 0) {
    return (
      <p className="text-xs text-[#9BA0C2]">
        Crée au moins deux profils pour lancer un duel.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {profiles.map((p) => {
        const disabled = excludeIds.includes(p.id);
        const isSelected = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(p.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border-2 py-1.5 pr-4 pl-1.5 text-sm font-bold transition",
              isSelected
                ? "border-[#FF7A1A] bg-[#FFF2DB] text-[#1A0E33]"
                : disabled
                  ? "cursor-not-allowed border-[#F0E3FF] text-[#C7BEE0] opacity-50"
                  : "border-[#F0E3FF] text-[#1A0E33] hover:border-[#7B2FE3]"
            )}
          >
            <QzAvatar avatar={p.avatar} name={p.name} size={28} />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
