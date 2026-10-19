"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { QzButton } from "./qz-button";

/**
 * Same intent as QuizLaunchLink, styled as a QzButton — used for the
 * primary "start/replay this quiz" calls to action.
 */
export function QuizLaunchButton({
  domain,
  level,
  tone,
  size,
  className,
  children,
}: {
  domain: string;
  level: number;
  tone?: ComponentProps<typeof QzButton>["tone"];
  size?: ComponentProps<typeof QzButton>["size"];
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <QzButton
      tone={tone}
      size={size}
      className={className}
      onClick={() => router.push(`/quiz/${domain}?level=${level}&t=${Date.now()}`)}
    >
      {children}
    </QzButton>
  );
}
