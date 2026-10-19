import { QzLogo } from "@/components/quizland/qz-logo";
import { QzButton } from "@/components/quizland/qz-button";

export const metadata = {
  title: "Hors ligne — Quizland",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#1A0E33] px-6 text-center">
      <QzLogo href={null} size={56} textClassName="text-xl" />
      <div>
        <h1 className="mb-2 font-heading text-xl font-extrabold text-white">
          Tu es hors ligne
        </h1>
        <p className="max-w-sm text-sm text-[#D9CCF5]">
          Impossible de charger cette page sans connexion. Vérifie ton réseau
          et réessaie — les pages déjà visitées restent disponibles.
        </p>
      </div>
      <QzButton href="/" tone="accent">
        Réessayer
      </QzButton>
    </div>
  );
}
