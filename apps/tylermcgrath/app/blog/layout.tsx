import "./blog.css";
import Link from "next/link";

const MMG = "https://mcgrathmarketinggroup.com";

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="journal">
      <header className="j-top">
        <Link href="/" className="j-brand" aria-label="Tyler McGrath, back to the studio">
          TYLER McGRATH<small>THE JOURNAL</small>
        </Link>
        <nav aria-label="Journal navigation">
          <Link href="/">The Studio</Link>
          <Link href="/blog/">All articles</Link>
          <a href={MMG} target="_blank" rel="noopener">
            Work with me ↗
          </a>
        </nav>
      </header>
      {children}
      <footer className="j-foot">
        <p>
          <strong>Tyler McGrath</strong> · SEO, GEO &amp; AEO · 14+ years helping businesses get found in Google and in AI answers.
        </p>
        <p>
          <Link href="/">Enter the studio</Link> · <Link href="/blog/">The Journal</Link> ·{" "}
          <a href={MMG} target="_blank" rel="noopener">
            McGrath Marketing Group ↗
          </a>
        </p>
        <p className="j-copy">© {new Date().getFullYear()} Tyler McGrath</p>
      </footer>
    </div>
  );
}
