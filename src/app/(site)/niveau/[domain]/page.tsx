import Link from "next/link";
import { notFound } from "next/navigation";
import { domainsWithAll, getDomain, levels } from "@/lib/data";
import { QuizLaunchLink } from "@/components/quizland/quiz-launch-link";
import { QuizLaunchButton } from "@/components/quizland/quiz-launch-button";

export function generateStaticParams() {
  return domainsWithAll.map((d) => ({ domain: d.slug }));
}

export default async function NiveauPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/domaines"
        className="mb-6 inline-block text-sm font-semibold text-[#7B2FE3] hover:underline"
      >
        ← Toutes les arènes
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F6EEFF] text-3xl">
          {domain.icon}
        </div>
        <div>
          <h1 className="font-heading text-xl font-extrabold text-[#1A0E33] sm:text-2xl">
            Choisir un niveau — {domain.name}
          </h1>
          <p className="text-sm text-[#6B7094]">
            {domain.questions} questions
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {levels.map((l) => (
          <QuizLaunchLink
            key={l.id}
            domain={domain.slug}
            level={l.id}
            className="flex items-center justify-between rounded-full bg-[#F6EEFF] px-6 py-4 text-sm font-bold text-[#1A0E33] transition hover:bg-[#EDE0FF]"
          >
            <span>{l.name}</span>
            <span>{l.stars}</span>
          </QuizLaunchLink>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <QuizLaunchButton domain={domain.slug} level={3} tone="accent" size="lg">
          Lancer un défi rapide
        </QuizLaunchButton>
      </div>
    </div>
  );
}
