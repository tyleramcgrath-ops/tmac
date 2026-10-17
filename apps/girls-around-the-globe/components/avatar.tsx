/* eslint-disable @next/next/no-img-element -- member photos are served from our own auth-gated route */

type Props = {
  profile: { name: string; palette: [string, string]; flag?: string; photos?: string[] };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  sm: "h-10 w-10 text-base",
  md: "h-14 w-14 text-xl",
  lg: "h-full w-full text-7xl",
  xl: "h-40 w-40 text-7xl",
};

// The member's first photo, or a generated initial on their palette.
export function Avatar({ profile, size = "md", className = "" }: Props) {
  const [a, b] = profile.palette;
  const photo = profile.photos?.[0];
  const round = size === "lg" ? "" : "rounded-full";
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        draggable={false}
        className={`shrink-0 object-cover ${SIZES[size]} ${round} ${className}`}
      />
    );
  }
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-display font-semibold text-white ${SIZES[size]} ${round} ${className}`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      <span className="drop-shadow-sm">{profile.name.slice(0, 1).toUpperCase()}</span>
      {(size === "md" || size === "xl") && profile.flag && (
        <span className="absolute bottom-1 right-1 text-lg leading-none">{profile.flag}</span>
      )}
    </div>
  );
}
