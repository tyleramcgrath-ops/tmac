import Image from "next/image";
import logo from "@/public/brand/gag-logo.png";
import mark from "@/public/brand/gag-mark.png";

// The GAG logo, cut out of its black background: the full lockup with
// "Girls Around the Globe", and the GAG + globe mark for tight spaces.

export function Wordmark({ height = 34, priority = false }: { height?: number; priority?: boolean }) {
  return (
    <Image
      src={logo}
      alt="GAG, Girls Around the Globe"
      height={height}
      style={{ width: "auto", height }}
      priority={priority}
    />
  );
}

export function Logo({ size = 32, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <Image
      src={mark}
      alt="GAG, Girls Around the Globe"
      height={size}
      style={{ width: "auto", height: size }}
      priority={priority}
    />
  );
}
