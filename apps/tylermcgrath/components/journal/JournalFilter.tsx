"use client";

// Category chips for the Journal index. Filters the server-rendered grid in
// place, so every card stays in the HTML for crawlers.
import { useEffect, useState } from "react";

export default function JournalFilter({ categories }: { categories: string[] }) {
  const [on, setOn] = useState("All");
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".j-grid > li").forEach((li) => {
      li.hidden = on !== "All" && li.dataset.cat !== on;
    });
  }, [on]);
  return (
    <div className="j-filter" role="toolbar" aria-label="Filter articles by topic">
      {["All", ...categories].map((c) => (
        <button key={c} aria-pressed={on === c} onClick={() => setOn(c)}>
          {c}
        </button>
      ))}
    </div>
  );
}
