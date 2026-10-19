import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function QzLogo({
  href = "/",
  size = 32,
  className,
  textClassName,
}: {
  href?: string | null;
  size?: number;
  className?: string;
  textClassName?: string;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="flex shrink-0 items-center justify-center rounded-lg bg-white p-1"
        style={{ width: size, height: size }}
      >
        <Image
          src="/brand/logo-quizland.png"
          alt="Quizland"
          width={size}
          height={size}
          className="size-full object-contain"
          priority
        />
      </span>
      <span className={cn("font-heading font-extrabold", textClassName)}>
        <span className="text-[#F6302F]">Quiz</span>
        <span className="text-[#2652D9]">land</span>
      </span>
    </span>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
