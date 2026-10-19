"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { avatarIds } from "@/lib/data";
import {
  createProfile,
  deleteProfile,
  getActiveProfileId,
  listProfiles,
  setActiveProfileId,
  updateProfile,
} from "@/lib/player";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { QzButton } from "@/components/quizland/qz-button";
import { Label } from "@/components/ui/label";
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

export default function ProfilsPage() {
  const [profiles, setProfiles] = useState<PlayerProfile[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState<AvatarId>(avatarIds[0]);
  const [deleteTarget, setDeleteTarget] = useState<PlayerProfile | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState<AvatarId>(avatarIds[0]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(listProfiles());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveId(getActiveProfileId());
  }, []);

  if (profiles === null) return null;

  const startEdit = (p: PlayerProfile) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditAvatar(p.avatar);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = updateProfile(editingId, { name: editName, avatar: editAvatar });
    if (updated) {
      setProfiles(profiles.map((p) => (p.id === updated.id ? updated : p)));
    }
    setEditingId(null);
  };

  const activate = (id: string) => {
    setActiveProfileId(id);
    setActiveId(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProfile(deleteTarget.id);
    setProfiles(profiles.filter((p) => p.id !== deleteTarget.id));
    if (activeId === deleteTarget.id) setActiveId(null);
    setDeleteTarget(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = createProfile(newName || "Joueur", newAvatar);
    setProfiles([...profiles, profile]);
    setNewName("");
    setNewAvatar(avatarIds[Math.floor(Math.random() * avatarIds.length)]);
    setCreating(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="mb-2 font-heading text-2xl font-extrabold text-[#7B2FE3] sm:text-[26px]">
        Gérer les profils
      </h1>
      <p className="mb-8 text-sm text-[#6B7094]">
        Tous les profils créés sur cet appareil. Active, modifie ou supprime-les
        ici, ou ajoutes-en un nouveau.
      </p>

      {profiles.length === 0 ? (
        <p className="mb-8 text-sm text-[#9BA0C2]">Aucun profil pour l&apos;instant.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {profiles.map((p) => (
            <div key={p.id} className="rounded-2xl bg-[#F6EEFF] p-4">
              {editingId === p.id ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor={`name-${p.id}`} className="mb-1.5 text-[#1A0E33]">
                      Pseudo
                    </Label>
                    <Input
                      id={`name-${p.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
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
                          onClick={() => setEditAvatar(id)}
                          className={cn(
                            "rounded-full p-0.5 transition",
                            editAvatar === id
                              ? "ring-2 ring-[#FF7A1A]"
                              : "ring-2 ring-transparent"
                          )}
                          aria-label={`Choisir l'avatar ${id}`}
                        >
                          <QzAvatar avatar={id} name={editName} size={36} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <QzButton tone="accent" size="sm" onClick={saveEdit}>
                      Enregistrer
                    </QzButton>
                    <QzButton
                      tone="outline-light"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Annuler
                    </QzButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <QzAvatar avatar={p.avatar} name={p.name} size={44} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-[#1A0E33]">
                      {p.name}
                      {activeId === p.id && (
                        <span className="rounded-full bg-[#7B2FE3] px-2 py-0.5 text-[10px] font-extrabold text-white">
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6B7094]">
                      {p.xp.toLocaleString("fr-FR")} XP · {p.history.length} partie
                      {p.history.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  {activeId !== p.id && (
                    <QzButton tone="outline-light" size="sm" onClick={() => activate(p.id)}>
                      Activer
                    </QzButton>
                  )}
                  <button
                    onClick={() => startEdit(p)}
                    aria-label={`Modifier ${p.name}`}
                    className="flex size-9 items-center justify-center rounded-full text-[#7B2FE3] hover:bg-[#EDE0FF]"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    aria-label={`Supprimer ${p.name}`}
                    className="flex size-9 items-center justify-center rounded-full text-[#FF4D6D] hover:bg-[#FFE3E9]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!creating ? (
        <QzButton tone="accent" onClick={() => setCreating(true)}>
          + Nouveau profil
        </QzButton>
      ) : (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-2xl bg-[#F6EEFF] p-4"
        >
          <div>
            <Label htmlFor="new-pseudo" className="mb-1.5 text-[#1A0E33]">
              Pseudo
            </Label>
            <Input
              id="new-pseudo"
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

      <p className="mt-8 text-center text-xs text-[#9BA0C2]">
        <Link href="/profil" className="underline hover:text-[#7B2FE3]">
          ← Retour à mon profil
        </Link>
      </p>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-[#1A0E33] text-white ring-0">
          <DialogTitle>Supprimer ce profil ?</DialogTitle>
          <DialogDescription className="text-[#D9CCF5]">
            {deleteTarget?.name} sera définitivement supprimé de cet appareil,
            avec son XP, ses badges et son historique.
          </DialogDescription>
          <DialogFooter className="border-[#3A1763] bg-transparent">
            <QzButton
              tone="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-white/20"
            >
              Annuler
            </QzButton>
            <QzButton tone="accent" onClick={confirmDelete}>
              Supprimer
            </QzButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
