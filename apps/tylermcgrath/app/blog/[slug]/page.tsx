import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AUTHOR, SITE, getPost, getPosts, related } from "@/lib/blog";

export const dynamicParams = false;
export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `${SITE}/blog/${post.slug}/`;
  const title = `${post.metaTitle} | Tyler McGrath`;
  const image = { url: `/blog/${post.slug}.jpg`, width: 1200, height: 630, alt: post.imageAlt };
  return {
    title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: "Tyler McGrath", url: `${SITE}/` }],
    alternates: { canonical: url },
    robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      type: "article",
      url,
      siteName: "Tyler McGrath",
      title: post.metaTitle,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [`${SITE}/`],
      section: post.category,
      tags: post.keywords,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: post.metaTitle, description: post.description, images: [image.url] },
  };
}

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const url = `${SITE}/blog/${post.slug}/`;
  const more = related(post);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.title,
        alternativeHeadline: post.metaTitle,
        description: post.description,
        abstract: post.keyTakeaways.join(" "),
        image: { "@type": "ImageObject", url: `${SITE}/blog/${post.slug}.jpg`, width: 1200, height: 630, caption: post.imageAlt },
        datePublished: post.date,
        dateModified: post.date,
        author: AUTHOR,
        publisher: { "@id": `${SITE}/#tyler` },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        isPartOf: { "@type": "Blog", "@id": `${SITE}/blog/#blog`, name: "The Journal by Tyler McGrath", url: `${SITE}/blog/` },
        articleSection: post.category,
        keywords: post.keywords.join(", "),
        wordCount: post.words,
        timeRequired: `PT${post.minutes}M`,
        inLanguage: "en-US",
        speakable: { "@type": "SpeakableSpecification", cssSelector: [".j-answer", ".j-takeaways"] },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "The Journal", item: `${SITE}/blog/` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: post.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <main className="j-post">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <article>
        <header className="j-post-head">
          <nav className="j-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/blog/">The Journal</Link> <span aria-hidden="true">/</span>{" "}
            <span aria-current="page">{post.category}</span>
          </nav>
          <p className="j-cat">{post.category}</p>
          <h1>{post.title}</h1>
          <p className="j-answer">{post.description}</p>
          <div className="j-byline">
            <img src="/art/tyler-portrait.png" alt="Tyler McGrath" width={44} height={44} />
            <span>
              By{" "}
              <Link href="/" rel="author">
                Tyler McGrath
              </Link>
              <small>
                <time dateTime={post.date}>{fmt(post.date)}</time> · {post.minutes} min read · {post.words.toLocaleString("en-US")} words
              </small>
            </span>
          </div>
        </header>

        <figure className="j-figure">
          <img src={`/blog/${post.slug}.jpg`} alt={post.imageAlt} width={1200} height={630} fetchPriority="high" />
        </figure>

        <div className="j-columns">
          <aside className="j-toc" aria-label="On this page">
            <p>On this page</p>
            <ol>
              {post.headings
                .filter((h) => h.level === 2)
                .map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ol>
          </aside>

          <div className="j-content">
            <section className="j-takeaways" aria-labelledby="takeaways">
              <h2 id="takeaways">Key takeaways</h2>
              <ul>
                {post.keyTakeaways.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>

            <div className="j-prose" dangerouslySetInnerHTML={{ __html: post.html }} />

            <section className="j-faq" id="faq" aria-labelledby="faq-title">
              <h2 id="faq-title">Frequently asked questions</h2>
              {post.faqs.map((f) => (
                <details key={f.q}>
                  <summary>
                    <h3>{f.q}</h3>
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </section>

            <section className="j-author" aria-label="About the author">
              <img src="/art/tyler-portrait.png" alt="" width={88} height={88} />
              <div>
                <p className="j-cat">About the author</p>
                <h2>Tyler McGrath</h2>
                <p>
                  Tyler McGrath is an SEO and digital growth leader with 14+ years in search engine optimization, Generative Engine Optimization (GEO) and Answer
                  Engine Optimization (AEO), web design and data-driven marketing. He leads{" "}
                  <a href="https://mcgrathmarketinggroup.com" target="_blank" rel="noopener">
                    McGrath Marketing Group
                  </a>
                  , helping businesses get found in Google and cited in AI answers.
                </p>
                <p>
                  <Link href="/">Visit the studio →</Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </article>

      <section className="j-related" aria-labelledby="related-title">
        <h2 id="related-title">Keep reading</h2>
        <ul className="j-grid">
          {more.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}/`} className="j-card">
                <img src={`/blog/${p.slug}.jpg`} alt={p.imageAlt} width={1200} height={630} loading="lazy" />
                <span className="j-cat">{p.category}</span>
                <strong>{p.title}</strong>
                <span className="j-meta">{p.minutes} min read</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
