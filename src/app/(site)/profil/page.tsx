"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Pencil, LogOut, Trash2, Users } from "lucide-react";
import { deleteProfile, levelFromXp, logout, updateProfile } from "@/lib/player";
import { getCurrentProfile, type ProfileSource } from "@/lib/profile";
import { avatarIds, getDomain } from "@/lib/data";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { QzButton } from "@/components/quizland/qz-button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AvatarId, PlayerProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProfilPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerProfile | null | undefined>(
    undefined
  );
  const [source, setSource] = useState<ProfileSource>("local");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>(avatarIds[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Profile data isn't available during server rendering (localStorage, or
  // an authenticated fetch for the cloud profile); read it after mount so
  // the server-rendered markup matches the client's first paint.
  useEffect(() => {
    getCurrentProfile().then((current) => {
      setPlayer(current?.profile ?? null);
      if (current) {
        setSource(current.source);
        setName(current.profile.name);
        setAvatar(current.profile.avatar);
      }
    });
  }, []);

  if (player === undefined) return null;

  if (!player) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center gap-4 bg-[#1A0E33] px-6 text-center text-white">
        <h1 className="font-heading text-xl font-extrabold">
          Aucun profil actif
        </h1>
        <p className="max-w-sm text-sm text-[#D9CCF5]">
          Connecte-toi ou crée un profil pour suivre ta progression, tes
          badges et ton historique.
        </p>
        <QzButton href="/connexion" tone="accent">
          Rejoindre l&apos;arène
        </QzButton>
      </div>
    );
  }

  const { level, progressPct } = levelFromXp(player.xp);
  const isCloud = source === "cloud";

  const saveEdit = async () => {
    if (isCloud) {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar }),
      });
      if (res.ok) setPlayer(await res.json());
    } else {
      const updated = updateProfile(player.id, { name, avatar });
      if (updated) setPlayer(updated);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setName(player.name);
    setAvatar(player.avatar);
    setEditing(false);
  };

  const handleLogout = () => {
    if (isCloud) {
      signOut({ callbackUrl: "/connexion" });
      return;
    }
    logout();
    router.push("/connexion");
  };

  const handleDelete = () => {
    deleteProfile(player.id);
    router.push("/connexion");
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#1A0E33]">
      <div className="mx-auto max-w-2xl px-5 py-10 text-white sm:px-8 sm:py-14">
        {!editing ? (
          <div className="mb-7 flex items-center gap-4">
            <QzAvatar avatar={player.avatar} name={player.name} size={64} />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-heading text-lg font-extrabold">
                {player.name} {player.xp > 0 && "👑"}
              </div>
              <div className="text-xs text-[#D9CCF5]">
                Niveau {level} · {player.xp.toLocaleString("fr-FR")} XP
                {isCloud && " · Compte Google"}
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              aria-label="Modifier le profil"
              className="flex size-9 items-center justify-center rounded-full border-2 border-white/15 text-white hover:bg-white/5"
            >
              <Pencil className="size-4" />
            </button>
          </div>
        ) : (
          <div className="mb-7 flex flex-col gap-4 rounded-2xl bg-[#2A1150] p-5">
            {isCloud ? (
              <p className="text-xs text-[#9b8fc2]">
                Ton nom ({player.name}) vient de ton compte Google — seul
                l&apos;avatar est modifiable ici.
              </p>
            ) : (
              <div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pseudo"
                  className="rounded-full border-2 border-[#3A1763] bg-transparent px-4 py-5 text-white placeholder:text-[#6B6190] focus-visible:border-[#FFD23F] focus-visible:ring-0"
                />
              </div>
            )}
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
            <div className="flex gap-2.5">
              <QzButton tone="accent" size="sm" onClick={saveEdit}>
                Enregistrer
              </QzButton>
              <QzButton tone="outline" size="sm" onClick={cancelEdit}>
                Annuler
              </QzButton>
            </div>
          </div>
        )}

        <div className="mb-8 h-2 rounded-full bg-[#3A1763]">
          <div
            className="h-2 rounded-full bg-[#FFD23F]"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mb-10">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#D9CCF5]">
            Badges
          </div>
          {player.badges.length === 0 ? (
            <p className="text-sm text-[#9b8fc2]">
              Termine un quiz pour débloquer tes premiers badges.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {player.badges.map((b) => (
                <div
                  key={b.icon}
                  title={b.label}
                  className="flex size-10 items-center justify-center rounded-[10px] bg-[#3A1763] text-lg"
                >
                  {b.icon}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-10">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#D9CCF5]">
            Historique récent
          </div>
          {player.history.length === 0 ? (
            <p className="text-sm text-[#9b8fc2]">
              Aucune partie jouée pour le moment.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {player.history.map((h, i) => {
                const domain = getDomain(h.domain);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl bg-[#2A1150] px-4 py-3 text-sm"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <span>{domain?.icon}</span> {domain?.name ?? h.domain}
                    </span>
                    <span className="text-[#D9CCF5]">
                      {h.score}/{h.total} · +{h.xp} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 border-t border-[#3A1763] pt-6">
          <QzButton href="/connexion" tone="outline" size="sm">
            <Users className="size-4" /> Changer de profil
          </QzButton>
          {!isCloud && (
            <QzButton href="/profils" tone="outline" size="sm">
              <Users className="size-4" /> Gérer les profils
            </QzButton>
          )}
          <QzButton tone="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" /> Déconnexion
          </QzButton>
          {!isCloud && (
            <QzButton
              tone="outline"
              size="sm"
              className="border-[#FF4D6D] text-[#FF4D6D] hover:bg-[#FF4D6D]/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" /> Supprimer ce profil
            </QzButton>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#9b8fc2]">
          <Link href="/apropos" className="underline hover:text-white">
            À propos de Quizland
          </Link>
        </p>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-[#1A0E33] text-white ring-0">
          <DialogTitle>Supprimer ce profil ?</DialogTitle>
          <DialogDescription className="text-[#D9CCF5]">
            {player.name} sera définitivement supprimé de cet appareil, avec
            son XP, ses badges et son historique.
          </DialogDescription>
          <DialogFooter className="border-[#3A1763] bg-transparent">
            <QzButton
              tone="outline"
              onClick={() => setConfirmDelete(false)}
              className="border-white/20"
            >
              Annuler
            </QzButton>
            <QzButton tone="accent" onClick={handleDelete}>
              Supprimer
            </QzButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
