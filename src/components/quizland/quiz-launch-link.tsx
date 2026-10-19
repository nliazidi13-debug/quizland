"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Navigates to a fresh quiz attempt, stamping the URL with a per-click nonce
 * (`t`) so QuizPlayer always sees a changed query string and re-shuffles —
 * even if Next's client-side router cache would otherwise reuse an
 * already-mounted instance of the destination page (e.g. after using the
 * browser's back button, or replaying the same domain/level twice in a row).
 */
export function QuizLaunchLink({
  domain,
  level,
  className,
  children,
}: {
  domain: string;
  level: number;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/quiz/${domain}?level=${level}&t=${Date.now()}`)}
      className={className}
    >
      {children}
    </button>
  );
}
