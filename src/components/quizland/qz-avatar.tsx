import { avatarPresets } from "@/lib/data";
import type { AvatarId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QzAvatar({
  avatar,
  name,
  size = 48,
  className,
}: {
  avatar: AvatarId;
  name?: string;
  size?: number;
  className?: string;
}) {
  const { from, to } = avatarPresets[avatar];
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-heading font-extrabold text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initial}
    </span>
  );
}
