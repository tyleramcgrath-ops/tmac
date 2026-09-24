import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Self-hosted (latin subset, variable weight) rather than next/font/google, so the
// build never depends on reaching fonts.googleapis.com — that fetch failing is what
// was breaking CI builds.
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
  title: "Reloop — Price Intelligence for Secondhand Fashion",
  description:
    "List once, sell everywhere. Reloop cross-lists to every resale platform, prices your items with real sold-comp data, and protects every buyer with SafeBuy escrow — regardless of which marketplace the item is actually on.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${manrope.variable} h-full`}
    >
      <body className="min-h-full flex flex-col relative z-0">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
