"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { domains, levels } from "@/lib/data";
import { QzButton } from "@/components/quizland/qz-button";
import { getCurrentProfile } from "@/lib/profile";

export default function DuelEnLignePage() {
  const router = useRouter();
  const [isCloud, setIsCloud] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(domains.map((d) => d.slug))
  );
  const [level, setLevel] = useState(3);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getCurrentProfile().then((current) => {
      setIsCloud(current?.source === "cloud");
    });
  }, []);

  if (isCloud === null) return null;

  if (!isCloud) {
    return (
      <div className="mx-auto max-w-md px-5 py-14 text-center sm:px-8">
        <h1 className="mb-3 font-heading text-xl font-extrabold text-[#1A0E33]">
          Défier en ligne
        </h1>
        <p className="mb-6 text-sm text-[#6B7094]">
          Un duel en ligne se joue entre deux comptes Google — connecte-toi
          pour défier un ami sur un autre appareil.
        </p>
        <QzButton href="/connexion" tone="accent">
          Me connecter
        </QzButton>
      </div>
    );
  }

  const toggleDomain = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const allSelected = selected.size === domains.length;

  const create = async () => {
    if (selected.size === 0 || creating) return;
    setCreating(true);
    const res = await fetch("/api/duel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domains: domains.filter((d) => selected.has(d.slug)).map((d) => d.slug),
        level,
      }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/duel/en-ligne/${id}`);
      return;
    }
    setCreating(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="mb-2 font-heading text-2xl font-extrabold text-[#7B2FE3] sm:text-[26px]">
        Défier en ligne ⚔️🌐
      </h1>
      <p className="mb-8 text-sm text-[#6B7094]">
        Crée un défi, partage le lien avec un ami — vous répondez chacun aux
        mêmes questions depuis votre propre appareil, et le meilleur score
        l&apos;emporte.
      </p>

      <div className="mt-6 mb-6 flex items-center justify-between">
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
        <QzButton
          tone="accent"
          size="lg"
          onClick={create}
          disabled={selected.size === 0 || creating}
        >
          {creating ? "Création…" : "Créer le défi"}
        </QzButton>
      </div>

      <p className="mt-6 text-center text-xs text-[#9BA0C2]">
        <Link href="/duel" className="underline hover:text-[#7B2FE3]">
          ← Retour au duel même appareil
        </Link>
      </p>
    </div>
  );
}
