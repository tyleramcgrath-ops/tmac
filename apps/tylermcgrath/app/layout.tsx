import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./immersive.css";

export const metadata: Metadata = {
  title: "Tyler McGrath — The Studio",
  description: "Awaken the Compass. Explore web design, marketing and SEO work from Tyler McGrath.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500&display=swap"
        />
        <link rel="preload" as="image" href="/art/studio-office.webp" />
      </head>
      <body>{children}</body>
    </html>
  );
}
