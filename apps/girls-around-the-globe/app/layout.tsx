import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Self-hosted so the build never depends on reaching fonts.googleapis.com.
const fraunces = localFont({
  variable: "--font-fraunces",
  src: [
    { path: "./fonts/fraunces.woff2", weight: "300 900", style: "normal" },
    { path: "./fonts/fraunces-italic.woff2", weight: "300 900", style: "italic" },
  ],
});

const manrope = localFont({
  variable: "--font-manrope",
  src: [{ path: "./fonts/manrope.woff2", weight: "400 700", style: "normal" }],
});

export const metadata: Metadata = {
  // Absolute base for the social share image; set SITE_URL in production.
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "Girls Around the Globe — Casual encounters, worldwide",
  description:
    "Casual encounters, worldwide. Swipe on adults who want no-strings fun, from Medellín to Tokyo, and line something up before you land.",
};

export const viewport: Viewport = {
  themeColor: "#0d0914",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
