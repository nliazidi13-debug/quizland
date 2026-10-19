"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveProfile } from "@/lib/player";
import type { PlayerProfile } from "@/lib/types";

// Rendered only when a Google session already exists (see
// GoogleAuthSection). Offers a one-time merge of this browser's local
// profile into the just-created, still-empty cloud profile — so signing in
// for the first time doesn't silently strand progress on one device.
export function ImportLocalProfileButton() {
  const router = useRouter();
  const [local, setLocal] = useState<PlayerProfile | null>(null);
  const [cloudHasProgress, setCloudHasProgress] = useState(true);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const active = getActiveProfile();
    if (active && (active.xp > 0 || active.history.length > 0)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocal(active);
    }
    fetch("/api/profile").then(async (res) => {
      if (!res.ok) return;
      const profile = await res.json();
      setCloudHasProgress(profile.xp > 0 || profile.history.length > 0);
    });
  }, []);

  if (!local || cloudHasProgress || done) return null;

  const doImport = async () => {
    setImporting(true);
    const res = await fetch("/api/profile/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(local),
    });
    setImporting(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  };

  return (
    <div className="mb-6 rounded-2xl border-2 border-[#FFD23F]/40 bg-[#FFD23F]/10 p-4 text-sm text-white">
      <p className="mb-3">
        Tu as déjà {local.xp.toLocaleString("fr-FR")} XP et{" "}
        {local.history.length} partie(s) enregistrées sur ce navigateur.
        Importer ces données dans ton compte Google&nbsp;?
      </p>
      <button
        onClick={doImport}
        disabled={importing}
        className="rounded-full bg-[#FFD23F] px-4 py-2 text-xs font-extrabold text-[#1A0E33] transition hover:brightness-105 disabled:opacity-60"
      >
        {importing ? "Import en cours…" : "Importer mes données"}
      </button>
    </div>
  );
}
