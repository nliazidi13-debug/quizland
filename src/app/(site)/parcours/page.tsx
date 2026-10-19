"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { domains, getDomain, levels } from "@/lib/data";
import { PARCOURS_LEG_LENGTH } from "@/lib/questions";
import { QzButton } from "@/components/quizland/qz-button";
import { clearParcoursState, getParcoursState, startParcours } from "@/lib/parcours";
import type { ParcoursState } from "@/lib/types";

export default function ParcoursPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<ParcoursState | null | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(domains.map((d) => d.slug))
  );
  const [level, setLevel] = useState(3);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(getParcoursState());
  }, []);

  const toggleDomain = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const allSelected = selected.size === domains.length;

  const startNew = () => {
    if (selected.size === 0) return;
    const order = domains.filter((d) => selected.has(d.slug)).map((d) => d.slug);
    startParcours(order, level);
    router.push(`/parcours/jouer?t=${Date.now()}`);
  };

  const resume = () => router.push(`/parcours/jouer?t=${Date.now()}`);

  const abandon = () => {
    clearParcoursState();
    setSaved(null);
  };

  const resumeDomain = saved ? getDomain(saved.domains[saved.domainIndex]) : null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="mb-2 font-heading text-2xl font-extrabold text-[#7B2FE3] sm:text-[26px]">
        Parcours 🗺
      </h1>
      <p className="mb-8 text-sm text-[#6B7094]">
        Enchaîne {PARCOURS_LEG_LENGTH} questions par domaine, dans l&apos;ordre de ton
        choix. Tu peux t&apos;arrêter à tout moment : ta progression est sauvegardée et
        tu reprends exactement là où tu en étais.
      </p>

      {saved && resumeDomain && (
        <div className="mb-8 rounded-2xl bg-[#F6EEFF] p-5">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7B2FE3]">
            Parcours en cours
          </div>
          <div className="mb-3 text-sm font-semibold text-[#1A0E33]">
            {resumeDomain.icon} {resumeDomain.name} — question{" "}
            {saved.questionIndex + 1}/{saved.questions.length} · domaine{" "}
            {saved.domainIndex + 1}/{saved.domains.length}
          </div>
          <div className="flex gap-3">
            <QzButton tone="accent" onClick={resume}>
              Reprendre
            </QzButton>
            <QzButton tone="outline-light" onClick={abandon}>
              Abandonner
            </QzButton>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
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
          onClick={startNew}
          disabled={selected.size === 0}
        >
          Commencer le parcours
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
