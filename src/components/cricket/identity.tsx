import Image from "next/image";
import type { Player, Team } from "@/types/cricket";
import { cn, initials } from "@/lib/utils";

const logoSizes = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-[11px]",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-lg",
} as const;

export function TeamLogo({
  team,
  size = "md",
  className,
}: {
  team: Team;
  size?: keyof typeof logoSizes;
  className?: string;
}) {
  if (team.logoUrl) {
    return (
      <Image
        src={team.logoUrl}
        alt=""
        width={80}
        height={80}
        className={cn("shrink-0 rounded-md object-contain", logoSizes[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-bold tracking-wide text-white ring-1 ring-inset ring-black/10",
        logoSizes[size],
        className,
      )}
      style={{ backgroundColor: team.primaryColor }}
    >
      {team.shortName}
    </span>
  );
}

const avatarSizes = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-2xl",
} as const;

export function PlayerAvatar({
  player,
  size = "md",
  className,
}: {
  player: Pick<Player, "fullName" | "profileImage">;
  size?: keyof typeof avatarSizes;
  className?: string;
}) {
  if (player.profileImage) {
    return (
      <Image
        src={player.profileImage}
        alt={player.fullName}
        width={112}
        height={112}
        className={cn("shrink-0 rounded-full object-cover", avatarSizes[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/15",
        avatarSizes[size],
        className,
      )}
    >
      {initials(player.fullName)}
    </span>
  );
}
