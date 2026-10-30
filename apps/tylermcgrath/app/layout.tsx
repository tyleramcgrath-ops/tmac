import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./immersive.css";
import projects from "@/lib/projects";

const SITE = "https://tylermcgrath.com";
const TITLE = "Tyler McGrath — SEO & Digital Growth Leader | The Studio";
const DESCRIPTION =
  `Tyler McGrath has 14+ years in SEO, GEO and AEO. Step into his studio to explore web design, marketing and ${projects.length} websites built for growth.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/` },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Tyler McGrath",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Tyler McGrath's studio: glass cards orbiting a brass compass above a marble desk" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.jpg"] },
};

// Who the site is about, for search engines and AI answers. Only facts the
// site itself states.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE}/#tyler`,
      name: "Tyler McGrath",
      url: `${SITE}/`,
      image: `${SITE}/art/tyler-portrait.png`,
      jobTitle: "SEO & Digital Growth Leader",
      description:
        "Tyler McGrath brings 14+ years of experience in SEO, Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO), web design and data-driven marketing.",
      knowsAbout: ["Search engine optimization", "Generative Engine Optimization", "Answer Engine Optimization", "Web design", "Content strategy", "Digital marketing"],
      affiliation: { "@type": "Organization", name: "McGrath Marketing Group", url: "https://mcgrathmarketinggroup.com" },
    },
    { "@type": "WebSite", "@id": `${SITE}/#site`, url: `${SITE}/`, name: "Tyler McGrath — The Studio", about: { "@id": `${SITE}/#tyler` } },
  ],
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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <link rel="preload" as="image" href="/art/studio-office.webp" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
