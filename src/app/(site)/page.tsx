import { QzButton } from "@/components/quizland/qz-button";
import { QzBadge } from "@/components/quizland/qz-badge";
import { TopPlayersPanel } from "@/components/quizland/top-players-panel";
import { domains, domainsPopular, levels, totalQuestions } from "@/lib/data";
import { Flame, Zap, Users } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-[#1A0E33]">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16 lg:pb-28">
        <div>
          <Link href="/defis" className="mb-5 inline-block">
            <QzBadge tone="yellow" className="transition hover:brightness-105">
              🔥 Défi du jour disponible
            </QzBadge>
          </Link>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-[44px]">
            Affronte tes amis. Deviens le champion du quiz&nbsp;!
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#D9CCF5]">
            {domains.length} domaines, classements en temps réel, badges et
            trophées à débloquer. Rejoins l&apos;arène&nbsp;!
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <QzButton href="/domaines" tone="accent" size="lg">
              Jouer gratuitement
            </QzButton>
            <QzButton href="/classement" tone="outline" size="lg">
              Voir le classement
            </QzButton>
          </div>

          <div className="mt-12 flex flex-wrap gap-8">
            <Stat label="domaines" value={String(domains.length)} />
            <Stat label="questions" value={String(totalQuestions)} />
            <Stat label="niveaux" value={String(levels.length)} />
          </div>
        </div>

        <TopPlayersPanel />
      </section>

      {/* Features */}
      <section className="border-t border-white/5 bg-[#150A29]">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:px-8 sm:grid-cols-3">
          <Feature
            icon={<Zap className="size-5" />}
            title="Boucle de récompense immédiate"
            text="Confettis, XP et effets vifs après chaque bonne réponse pour une partie qui donne envie de continuer."
          />
          <Feature
            icon={<Flame className="size-5" />}
            title="Défis quotidiens"
            text="Reviens chaque jour pour débloquer un coffre mystère et garder ta série de victoires."
          />
          <Feature
            icon={<Users className="size-5" />}
            title="Compétition sociale"
            text="Classements en temps réel, duels et badges à montrer à tes amis."
          />
        </div>
      </section>

      {/* Popular domains */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-extrabold text-white">
            Domaines populaires
          </h2>
          <Link
            href="/domaines"
            className="text-sm font-bold text-[#FFD23F] hover:underline"
          >
            Tout voir →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {domainsPopular.map((d) => (
            <Link
              key={d.slug}
              href={`/niveau/${d.slug}`}
              className="rounded-2xl bg-[#2A1150] p-5 transition hover:-translate-y-0.5 hover:bg-[#341a63]"
            >
              <div className="mb-2 text-3xl">{d.icon}</div>
              <div className="font-heading text-sm font-extrabold text-white">
                {d.name}
              </div>
              <div className="text-xs text-[#9b8fc2]">
                {d.questions.toLocaleString("fr-FR")} questions
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-[#7B2FE3] via-[#5a22ab] to-[#FF7A1A] p-10 text-center">
          <h3 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
            Prêt à grimper au classement&nbsp;?
          </h3>
          <p className="max-w-md text-sm text-white/85">
            Crée ton profil en quelques secondes et lance ton premier quiz.
          </p>
          <QzButton href="/connexion" tone="dark" size="lg" className="bg-[#1A0E33]">
            Rejoindre l&apos;arène
          </QzButton>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-heading text-2xl font-extrabold text-white">
        {value}
      </div>
      <div className="text-xs text-[#9b8fc2]">{label}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1A0E33] p-6">
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#FFD23F] text-[#1A0E33]">
        {icon}
      </div>
      <div className="mb-1.5 font-heading text-base font-extrabold text-white">
        {title}
      </div>
      <p className="text-sm leading-relaxed text-[#b9adda]">{text}</p>
    </div>
  );
}
