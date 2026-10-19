import { Suspense } from "react";
import { notFound } from "next/navigation";
import { domainsWithAll, getDomain } from "@/lib/data";
import { getQuestions } from "@/lib/questions";
import { QuizPlayer } from "@/components/quizland/quiz-player";

export function generateStaticParams() {
  return domainsWithAll.map((d) => ({ domain: d.slug }));
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: slug } = await params;
  const domain = getDomain(slug);
  const questions = getQuestions(slug);
  if (!domain || questions.length === 0) notFound();

  return (
    <Suspense>
      <QuizPlayer key={slug} domain={domain} questions={questions} />
    </Suspense>
  );
}
