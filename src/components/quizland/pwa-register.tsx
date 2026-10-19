"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Only register in production: a cache-first service worker fighting
    // Turbopack's dev chunks would serve stale code after every edit.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()));
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installation reste possible sans service worker ; on échoue silencieusement.
    });
  }, []);

  return null;
}
