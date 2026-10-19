import { Suspense } from "react";
import { DuelPlayer } from "@/components/quizland/duel-player";

export default function DuelJouerPage() {
  return (
    <Suspense>
      <DuelPlayer />
    </Suspense>
  );
}
