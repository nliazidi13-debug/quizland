import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const toneClasses = {
  accent: "bg-[#FF7A1A] text-white qz-shadow-accent hover:brightness-105",
  primary: "bg-[#7B2FE3] text-white qz-shadow-primary hover:brightness-105",
  teal: "bg-[#17D1C9] text-[#1A0E33] qz-shadow-teal hover:brightness-105",
  dark: "bg-[#1A0E33] text-white shadow-none hover:bg-[#2A1150]",
  outline:
    "bg-transparent text-white border-2 border-[#7B2FE3] shadow-none hover:bg-white/5",
  "outline-light":
    "bg-transparent text-[#1A0E33] border-2 border-[#F0E3FF] shadow-none hover:bg-[#F6EEFF]",
  ghost: "bg-transparent text-current shadow-none hover:bg-black/5",
} as const;

const sizeClasses = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-[15px]",
} as const;

type Tone = keyof typeof toneClasses;
type Size = keyof typeof sizeClasses;

type BaseProps = {
  tone?: Tone;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = BaseProps & {
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export function QzButton({
  tone = "accent",
  size = "md",
  className,
  children,
  href,
  ...props
}: ButtonAsButton | ButtonAsLink) {
  const classes = cn(
    "qz-press inline-flex items-center justify-center gap-2 rounded-full font-heading font-bold whitespace-nowrap select-none disabled:opacity-50 disabled:pointer-events-none",
    toneClasses[tone],
    sizeClasses[size],
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
