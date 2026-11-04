import type { Metadata } from "next";
import Link from "next/link";
import { AUTHOR, CATEGORIES, SITE, getPosts } from "@/lib/blog";
import JournalFilter from "@/components/journal/JournalFilter";

const TITLE = "The Journal: SEO, GEO & AI Search Guides | Tyler McGrath";
const DESCRIPTION =
  "In-depth guides from Tyler McGrath on Generative Engine Optimization, AEO, Google AI Overviews, schema and technical SEO. Get found in Google and AI answers.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/blog/` },
  openGraph: {
    type: "website",
    url: "/blog/",
    siteName: "Tyler McGrath",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/blog/journal-og.jpg", width: 1200, height: 630, alt: "The Journal by Tyler McGrath: guides to SEO and AI search" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/blog/journal-og.jpg"] },
};

export default function JournalIndex() {
  const posts = getPosts();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${SITE}/blog/#blog`,
        url: `${SITE}/blog/`,
        name: "The Journal by Tyler McGrath",
        description: DESCRIPTION,
        inLanguage: "en-US",
        author: AUTHOR,
        publisher: { "@id": `${SITE}/#tyler` },
        isPartOf: { "@id": `${SITE}/#site` },
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          "@id": `${SITE}/blog/${p.slug}/#article`,
          headline: p.title,
          url: `${SITE}/blog/${p.slug}/`,
          datePublished: p.date,
          image: `${SITE}/blog/${p.slug}.jpg`,
          author: { "@id": `${SITE}/#tyler` },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "The Journal", item: `${SITE}/blog/` },
        ],
      },
    ],
  };
  const [lead, ...rest] = posts;

  return (
    <main className="j-index">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="j-hero">
        <p className="j-kicker">THE JOURNAL · {posts.length} FIELD GUIDES</p>
        <h1>
          Get found in Google <em>and</em> in the answer.
        </h1>
        <p className="j-lede">
          Practical, in-depth guides to SEO, Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO): how search engines and AI assistants like
          ChatGPT, Google AI Overviews and Perplexity decide who to show, and what to do about it.
        </p>
      </section>

      {lead && (
        <Link href={`/blog/${lead.slug}/`} className="j-lead">
          <img src={`/blog/${lead.slug}.jpg`} alt={lead.imageAlt} width={1200} height={630} />
          <span className="j-lead-text">
            <span className="j-cat">{lead.category} · Start here</span>
            <strong>{lead.title}</strong>
            <span>{lead.excerpt}</span>
            <span className="j-meta">{lead.minutes} min read</span>
          </span>
        </Link>
      )}

      <JournalFilter categories={CATEGORIES} />
      <ul className="j-grid">
        {rest.map((p) => (
          <li key={p.slug} data-cat={p.category}>
            <Link href={`/blog/${p.slug}/`} className="j-card">
              <img src={`/blog/${p.slug}.jpg`} alt={p.imageAlt} width={1200} height={630} loading="lazy" />
              <span className="j-cat">{p.category}</span>
              <strong>{p.title}</strong>
              <span className="j-excerpt">{p.excerpt}</span>
              <span className="j-meta">{p.minutes} min read</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
