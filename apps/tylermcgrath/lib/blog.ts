// The Journal: long-form posts on SEO and AI search. Each post is a Markdown
// file in content/blog with a JSON frontmatter block. Everything here runs at
// build time only (static export), so plain fs reads are fine.
import fs from "node:fs";
import path from "node:path";

export const SITE = "https://tylermcgrath.com";
export const PUBLISHED = "2026-11-04";
const DIR = path.join(process.cwd(), "content", "blog");

export type Faq = { q: string; a: string };
export type Heading = { id: string; text: string; level: 2 | 3 };
export type Post = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  category: string;
  keywords: string[];
  excerpt: string;
  imageAlt: string;
  imageMotif: string;
  keyTakeaways: string[];
  faqs: Faq[];
  date: string;
  body: string;
  html: string;
  headings: Heading[];
  words: number;
  minutes: number;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[`*_[\]()]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function inline(src: string): string {
  // Protect inline code first, then escape, then apply emphasis and links.
  const codes: string[] = [];
  let s = src.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${esc(c)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const ext = /^https?:\/\//.test(href) && !href.startsWith(SITE);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}

export function renderMarkdown(md: string): { html: string; headings: Heading[] } {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  const headings: Heading[] = [];
  const used = new Set<string>();
  let i = 0;
  const isBlockStart = (l: string) => /^(#{2,3}\s|[-*]\s|\d+\.\s|>\s?|```|\|)/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      out.push(`<pre${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    const h = /^(#{2,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length as 2 | 3;
      const text = h[2].trim();
      let id = slugify(text);
      while (used.has(id)) id += "-x";
      used.add(id);
      headings.push({ id, text: text.replace(/[*`]/g, ""), level });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s+/, ""));
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s+/, ""));
      out.push(`<ol>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote><p>${inline(buf.join(" "))}</p></blockquote>`);
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i++].trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
        if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
        rows.push(cells);
      }
      const [head, ...rest] = rows;
      out.push(
        `<div class="j-table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rest
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) buf.push(lines[i++].trim());
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return { html: out.join("\n"), headings };
}

export const countWords = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`|_-]/g, " ")
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w)).length;

function load(file: string): Post {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw.replace(/\r/g, ""));
  if (!m) throw new Error(`Bad frontmatter in ${file}`);
  const meta = JSON.parse(m[1]);
  const body = m[2].trim();
  const { html, headings } = renderMarkdown(body);
  const words = countWords(body);
  return {
    ...meta,
    slug: file.replace(/\.md$/, ""),
    date: meta.date ?? PUBLISHED,
    body,
    html,
    headings,
    words,
    minutes: Math.max(1, Math.round(words / 230)),
  };
}

let cache: Post[] | null = null;
export function getPosts(): Post[] {
  if (!cache) {
    const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")) : [];
    cache = files.map(load).sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));
  }
  return cache;
}
export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

// Reading order: pillar first, then the AI-engine guides, then the toolkit.
const ORDER = [
  "what-is-generative-engine-optimization",
  "geo-vs-seo-vs-aeo",
  "answer-engine-optimization-guide",
  "how-to-get-cited-by-chatgpt",
  "google-ai-overviews-optimization",
  "perplexity-seo-guide",
  "writing-content-ai-can-cite",
  "schema-markup-for-ai-search",
  "entity-seo-knowledge-graph",
  "eeat-in-the-ai-era",
  "measuring-ai-search-visibility",
  "zero-click-search-strategy",
  "llms-txt-guide",
  "ai-crawlers-robots-txt",
  "topical-authority-guide",
  "ai-content-without-hurting-seo",
  "technical-seo-checklist-ai-search",
  "local-seo-ai-search",
  "brand-mentions-digital-pr-ai",
  "ai-search-strategy-small-business",
];

export const CATEGORIES = ["GEO & AI Search", "Content Strategy", "Technical SEO", "Local & Brand"];

export function related(post: Post, n = 3): Post[] {
  const all = getPosts().filter((p) => p.slug !== post.slug);
  const linked = all.filter((p) => post.body.includes(`/blog/${p.slug}`));
  const same = all.filter((p) => p.category === post.category && !linked.includes(p));
  return [...same, ...linked, ...all].filter((p, i, a) => a.indexOf(p) === i).slice(0, n);
}

export const AUTHOR = {
  "@type": "Person",
  "@id": `${SITE}/#tyler`,
  name: "Tyler McGrath",
  url: `${SITE}/`,
  image: `${SITE}/art/tyler-portrait.png`,
  jobTitle: "SEO & Digital Growth Leader",
};
export const PUBLISHER = { "@type": "Person", "@id": `${SITE}/#tyler`, name: "Tyler McGrath" };
