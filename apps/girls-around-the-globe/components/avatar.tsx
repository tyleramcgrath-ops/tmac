import type { Profile } from "@/lib/profiles";
import { initials } from "@/lib/profiles";

type Props = {
  profile: Pick<Profile, "name" | "palette" | "flag">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  sm: "h-10 w-10 text-base",
  md: "h-14 w-14 text-xl",
  lg: "h-full w-full text-7xl",
  xl: "h-40 w-40 text-7xl",
};

// Generated portrait placeholder: the prototype ships no member photos.
export function Avatar({ profile, size = "md", className = "" }: Props) {
  const [a, b] = profile.palette;
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-display font-semibold text-white ${SIZES[size]} ${size === "lg" ? "" : "rounded-full"} ${className}`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      <span className="drop-shadow-sm">{initials(profile.name)}</span>
      {(size === "md" || size === "xl") && (
        <span className="absolute bottom-1 right-1 text-lg leading-none">{profile.flag}</span>
      )}
    </div>
  );
}
