"use client";

import { useEffect, useState } from "react";
import { listProfiles, levelFromXp } from "@/lib/player";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { QzBadge } from "@/components/quizland/qz-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { PlayerProfile } from "@/lib/types";

export function AdminUsersTab() {
  const [profiles, setProfiles] = useState<PlayerProfile[] | null>(null);

  // Profiles live in localStorage only; read them after mount so the
  // server-rendered markup matches the client's first paint.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(listProfiles());
  }, []);

  if (profiles === null) return null;

  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#F0E3FF] p-10 text-center text-sm text-[#6B7094]">
        Aucun profil créé sur cet appareil pour le moment.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-[#6B7094]">
        Profils enregistrés sur cet appareil (pas de base de données centrale
        — chaque navigateur a sa propre liste).
      </p>
      <div className="rounded-2xl border-2 border-[#F0E3FF]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#F0E3FF]">
              <TableHead>Joueur</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>Quiz joués</TableHead>
              <TableHead>Badges</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => {
              const { level } = levelFromXp(p.xp);
              return (
                <TableRow key={p.id} className="border-[#F6EEFF]">
                  <TableCell className="font-medium text-[#1A0E33]">
                    <span className="flex items-center gap-2.5">
                      <QzAvatar avatar={p.avatar} name={p.name} size={28} />
                      {p.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#6B7094]">{level}</TableCell>
                  <TableCell className="text-[#6B7094]">
                    {p.xp.toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-[#6B7094]">
                    {p.history.length}
                  </TableCell>
                  <TableCell>
                    <QzBadge tone="teal">{p.badges.length}</QzBadge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
