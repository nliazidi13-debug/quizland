"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentProfile } from "@/lib/profile";

// The only page reachable without a profile — everything else (including
// the homepage) now requires picking Google or "guest" first, instead of
// silently auto-creating a guest profile the first time a quiz finishes.
const GATE_PATH = "/connexion";

export function RequireProfile({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "gated" | "ok">("checking");

  useEffect(() => {
    // Once a profile has been confirmed this page load, it isn't going to
    // disappear from under the user — no need to keep re-checking (and
    // re-fetching /api/profile) on every subsequent navigation.
    if (status === "ok") return;

    let cancelled = false;
    getCurrentProfile().then((current) => {
      if (cancelled) return;
      if (current) {
        setStatus("ok");
        return;
      }
      setStatus("gated");
      if (pathname !== GATE_PATH) {
        router.replace(GATE_PATH);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router, status]);

  if (status === "ok") return <>{children}</>;
  if (status === "gated" && pathname === GATE_PATH) return <>{children}</>;
  // Still checking, or gated and being redirected away — render nothing to
  // avoid a flash of content the user isn't supposed to reach yet.
  return null;
}
