import { Suspense } from "react";
import { ParcoursPlayer } from "@/components/quizland/parcours-player";

export default function ParcoursJouerPage() {
  return (
    <Suspense>
      <ParcoursPlayer />
    </Suspense>
  );
}
