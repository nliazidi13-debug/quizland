import Link from "next/link";
import { domainsWithAll } from "@/lib/data";
import { QzBadge } from "@/components/quizland/qz-badge";

export const metadata = {
  title: "Choisis ton arène — Quizland",
};

export default function DomainesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-extrabold text-[#7B2FE3] sm:text-[26px]">
          Choisis ton arène 🎮
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/parcours"
            className="text-xs font-extrabold text-[#7B2FE3] hover:underline"
          >
            🗺 Mode Parcours →
          </Link>
          <Link
            href="/duel"
            className="text-xs font-extrabold text-[#7B2FE3] hover:underline"
          >
            ⚔️ Mode Duel →
          </Link>
          <QzBadge tone="yellow">⚡ 3 vies restantes</QzBadge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {domainsWithAll.map((d) => (
          <Link
            key={d.slug}
            href={`/niveau/${d.slug}`}
            className="group rounded-[18px] bg-[#F6EEFF] p-[18px] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-2.5 text-[30px]">{d.icon}</div>
            <div className="mb-1.5 font-heading text-[15px] font-extrabold text-[#1A0E33]">
              {d.name}
            </div>
            <div className="mb-2.5 text-xs text-[#6B7094]">
              {d.questions} questions
            </div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#7B2FE3] px-2.5 py-1 text-[11px] font-extrabold text-white">
                {d.difficulty}
              </span>
              <span className="text-[13px] font-extrabold text-[#FF7A1A]">
                Jouer →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
