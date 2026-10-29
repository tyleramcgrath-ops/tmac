import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Self-hosted so the build never depends on reaching fonts.googleapis.com.
// Instrument Serif echoes the GAG logo's serif capitals; Manrope is body copy.
const serif = localFont({
  variable: "--font-serif",
  src: [
    { path: "./fonts/instrument-serif.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
});

const manrope = localFont({
  variable: "--font-manrope",
  src: [{ path: "./fonts/manrope.woff2", weight: "400 700", style: "normal" }],
});

export const metadata: Metadata = {
  // Absolute base for the social share image; set SITE_URL in production.
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "Girls Around the Globe — Meet someone worth the flight",
  description:
    "Serious dating with women across Latin America and beyond. See what she's looking for, video date first, then go meet her.",
};

export const viewport: Viewport = {
  themeColor: "#0b0908",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
