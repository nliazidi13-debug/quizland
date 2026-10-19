"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { QzButton } from "@/components/quizland/qz-button";
import { QzLogo } from "@/components/quizland/qz-logo";
import { QzAvatar } from "@/components/quizland/qz-avatar";
import { getCurrentProfile } from "@/lib/profile";
import type { PlayerProfile } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/domaines", label: "Domaines" },
  { href: "/parcours", label: "Parcours" },
  { href: "/duel", label: "Duel" },
  { href: "/profils", label: "Profils" },
  { href: "/classement", label: "Classement" },
  { href: "/defis", label: "Défis" },
];

export function SiteNavbar() {
  const pathname = usePathname();
  const [active, setActive] = useState<PlayerProfile | null>(null);

  // Re-check on every navigation so the navbar reflects connexion/
  // déconnexion (Google or local) without a full page reload.
  useEffect(() => {
    let cancelled = false;
    getCurrentProfile().then((current) => {
      if (!cancelled) setActive(current?.profile ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#1A0E33]/95 backdrop-blur supports-backdrop-filter:bg-[#1A0E33]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <QzLogo textClassName="text-lg" />

        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#D9CCF5] md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "transition-colors hover:text-white",
                pathname === l.href && "text-white"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {active ? (
            <Link
              href="/profil"
              className="flex items-center gap-2 rounded-full border-2 border-white/15 py-1 pr-4 pl-1 text-sm font-semibold text-white transition hover:border-white/30"
            >
              <QzAvatar avatar={active.avatar} name={active.name} size={28} />
              {active.name}
            </Link>
          ) : (
            <QzButton href="/connexion" tone="outline" size="sm">
              Connexion
            </QzButton>
          )}
          <QzButton href="/domaines" tone="accent" size="sm">
            Jouer maintenant
          </QzButton>
        </div>

        <Sheet>
          <SheetTrigger
            className="flex size-9 items-center justify-center rounded-full border-2 border-white/15 text-white md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="border-l-0 bg-[#1A0E33] p-0 text-white"
          >
            <SheetHeader className="border-b border-white/10">
              <SheetTitle className="sr-only">Menu Quizland</SheetTitle>
              <QzLogo href={null} />
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 py-2">
              {active && (
                <SheetClose
                  nativeButton={false}
                  render={<Link href="/profil" />}
                >
                  <span className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-semibold text-white hover:bg-white/5">
                    <QzAvatar avatar={active.avatar} name={active.name} size={28} />
                    {active.name}
                  </span>
                </SheetClose>
              )}
              {links.map((l) => (
                <SheetClose
                  key={l.href}
                  nativeButton={false}
                  render={<Link href={l.href} />}
                >
                  <span className="block rounded-xl px-3 py-3 text-sm font-semibold text-[#D9CCF5] hover:bg-white/5 hover:text-white">
                    {l.label}
                  </span>
                </SheetClose>
              ))}
              <SheetClose
                nativeButton={false}
                render={<Link href="/apropos" />}
              >
                <span className="block rounded-xl px-3 py-3 text-sm font-semibold text-[#D9CCF5] hover:bg-white/5 hover:text-white">
                  À propos
                </span>
              </SheetClose>
            </nav>
            <div className="mt-auto flex flex-col gap-2 p-4">
              <QzButton href="/domaines" tone="accent" className="w-full">
                Jouer maintenant
              </QzButton>
              {!active && (
                <QzButton href="/connexion" tone="outline" className="w-full">
                  Connexion
                </QzButton>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
