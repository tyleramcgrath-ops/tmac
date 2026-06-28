'use client'

const LINKS: { id: string; label: string }[] = [
  { id: 'checklist', label: 'Action checklist' },
  { id: 'summary', label: 'Summary' },
  { id: 'plan', label: 'Full plan' },
  { id: 'wordpress', label: 'Apply to WordPress' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'titles', label: 'Titles & meta' },
  { id: 'content', label: 'Content gaps' },
  { id: 'headings', label: 'Headings' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'schema', label: 'Schema' },
  { id: 'backlinks', label: 'Backlinks' },
  { id: 'technical', label: 'Technical' },
  { id: 'speed', label: 'Speed' },
  { id: 'ai', label: 'AI search' },
]

export function ReportNav() {
  return (
    <nav className="sticky top-[57px] z-10 -mx-4 overflow-x-auto border-b border-slate-200 bg-slate-50/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex gap-1.5 whitespace-nowrap text-xs">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            className="rounded-full px-3 py-1 font-medium text-slate-600 transition hover:bg-white hover:text-blue-700 hover:ring-1 hover:ring-slate-200"
          >
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
