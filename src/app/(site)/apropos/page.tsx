import { QzLogo } from "@/components/quizland/qz-logo";
import { QzBadge } from "@/components/quizland/qz-badge";
import { domains, levels, totalQuestions } from "@/lib/data";

export const metadata = {
  title: "À propos — Quizland",
};

const APP_VERSION = "0.1.0";

const features = [
  {
    icon: "🎮",
    title: `${domains.length} domaines`,
    text: "De l'histoire à la culture générale, en passant par le cinéma, le sport ou la musique.",
  },
  {
    icon: "⭐",
    title: `${levels.length} niveaux de difficulté`,
    text: "De Débutant à Expert, pour jouer seul ou toute la famille, quel que soit l'âge.",
  },
  {
    icon: "🔀",
    title: `${totalQuestions} questions`,
    text: "L'ordre des questions et des réponses change à chaque partie.",
  },
  {
    icon: "🏆",
    title: "Classement & défis",
    text: "Grimpe au classement hebdomadaire et débloque des badges avec les défis quotidiens.",
  },
  {
    icon: "📴",
    title: "Installable comme une app",
    text: "Ajoute Quizland à ton écran d'accueil. L'accueil et la liste des domaines restent accessibles hors connexion, mais il faut du réseau pour lancer un quiz.",
  },
  {
    icon: "🔒",
    title: "Vie privée respectée",
    text: "Pas de compte obligatoire : les profils restent stockés sur l'appareil, rien n'est envoyé à un serveur.",
  },
];

export default function AproposPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-10 flex flex-col items-center text-center">
        <QzLogo href={null} size={64} textClassName="text-2xl" />
        <p className="mt-4 max-w-sm text-sm text-[#6B7094]">
          Le quiz de culture générale à jouer en famille ou entre amis.
        </p>
        <QzBadge tone="primary" className="mt-3">
          Version {APP_VERSION}
        </QzBadge>
      </div>

      <div className="mb-10 rounded-2xl bg-gradient-to-br from-[#7B2FE3] to-[#FF7A1A] px-6 py-5 text-center">
        <div className="text-xs font-bold uppercase tracking-wide text-white/80">
          Conçu et développé par
        </div>
        <div className="mt-1 font-heading text-xl font-extrabold text-white">
          Nor-eddine Liazidi
        </div>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl bg-[#F6EEFF] p-5">
            <div className="mb-2 text-2xl">{f.icon}</div>
            <div className="mb-1 font-heading text-sm font-extrabold text-[#1A0E33]">
              {f.title}
            </div>
            <p className="text-xs leading-relaxed text-[#6B7094]">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-[#F0E3FF] p-6 text-center text-sm text-[#6B7094]">
        Quizland est un projet personnel, sans publicité ni collecte de
        données. Fait avec ❤️ pour le plaisir d&apos;apprendre en jouant.
      </div>

      <p className="mt-6 text-center text-xs text-[#9BA0C2]">
        © {new Date().getFullYear()} Quizland
      </p>
    </div>
  );
}
