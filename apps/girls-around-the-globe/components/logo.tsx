import Image from "next/image";
import wordmark from "@/public/brand/wordmark.png";
import mark from "@/public/brand/mark.png";

// Brand assets cut from the GAG logo files: the full "Girls Around the Globe"
// wordmark, and the pink A with the woman's profile as the compact mark.

export function Wordmark({ height = 34, priority = false }: { height?: number; priority?: boolean }) {
  return (
    <Image
      src={wordmark}
      alt="Girls Around the Globe"
      height={height}
      style={{ width: "auto", height }}
      priority={priority}
    />
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return <Image src={mark} alt="" aria-hidden="true" height={size} style={{ width: "auto", height: size }} />;
}
