import { cn } from "@/lib/utils";

const toneClasses = {
  accent: "bg-[#FFF2DB] text-[#C85A00]",
  primary: "bg-[#F0E3FF] text-[#7B2FE3]",
  teal: "bg-[#E1FBF9] text-[#0E9A94]",
  yellow: "bg-[#FFD23F] text-[#1A0E33]",
  dark: "bg-[#1A0E33] text-[#FFD23F]",
  "dark-solid": "bg-[#3A1763] text-white",
} as const;

type Tone = keyof typeof toneClasses;

export function QzBadge({
  tone = "primary",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
