import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Self-hosted fonts so the build never depends on reaching Google Fonts.
const fraunces = localFont({
  variable: "--font-fraunces",
  src: [
    { path: "./fonts/fraunces.woff2", weight: "300 900", style: "normal" },
    { path: "./fonts/fraunces-italic.woff2", weight: "300 900", style: "italic" },
  ],
});

const jetbrainsMono = localFont({
  variable: "--font-jetbrains",
  src: [{ path: "./fonts/jetbrains-mono.woff2", weight: "400 700", style: "normal" }],
});

const manrope = localFont({
  variable: "--font-manrope",
  src: [{ path: "./fonts/manrope.woff2", weight: "400 700", style: "normal" }],
});

export const metadata: Metadata = {
  title: "Gavel Homes — Bid on homes, sold by owners",
  description:
    "The home marketplace without the 6%. Owners list for a flat fee, buyers tour on their own and bid live with verified buying power. No listing agent, no MLS gatekeeping.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${manrope.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
