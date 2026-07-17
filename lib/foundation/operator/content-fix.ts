// Content-level WordPress fixes (Phase H). Some fixes can't be expressed as a
// title/meta write — they transform the post BODY: upgrading insecure http://
// sub-resources to https, inserting a missing H1, or adding internal links to
// real pages. These are expressed as deterministic transforms applied to the
// LIVE post content at deploy time (never to a stale crawl snapshot), so the
// change is exact and idempotent: re-applying a satisfied transform is a no-op.
//
// SAFETY: every transform is additive or a like-for-like scheme swap — none
// deletes user content. Each carries a `verify` predicate so wp-execution can
// confirm the invariant held after the write, exactly like title/meta.

export type ContentTransform =
  | { type: 'https-upgrade'; hosts: string[] }
  | { type: 'prepend-h1'; text: string }
  | { type: 'append-internal-links'; links: { url: string; anchor: string }[] }
  | { type: 'set-jsonld'; jsonLd: string }

const RELATED_MARKER = 'rankforge:related'
const SCHEMA_MARKER = 'rankforge:schema'
// Matches a previously-inserted managed schema block so re-applying replaces it
// in place (idempotent) rather than stacking duplicates.
const SCHEMA_BLOCK_RE = /<!-- rankforge:schema -->[\s\S]*?<!-- \/rankforge:schema -->/

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export interface TransformResult {
  content: string
  changed: boolean
  summary: string
}

// Apply a transform to live post content. Deterministic + idempotent.
export function applyContentTransform(content: string, t: ContentTransform): TransformResult {
  switch (t.type) {
    case 'https-upgrade': {
      let out = content
      let count = 0
      for (const host of t.hosts) {
        if (!host) continue
        const needle = `http://${host}`
        const replacement = `https://${host}`
        // split/join avoids regex-escaping the host (which contains dots).
        const parts = out.split(needle)
        if (parts.length > 1) {
          count += parts.length - 1
          out = parts.join(replacement)
        }
      }
      return { content: out, changed: count > 0, summary: count > 0 ? `Upgraded ${count} insecure http:// reference(s) to https.` : 'No matching insecure references found in the post body.' }
    }
    case 'prepend-h1': {
      if (/<h1[\s>]/i.test(content)) return { content, changed: false, summary: 'Post already contains an H1; no change.' }
      const h1 = `<h1>${escapeHtml(t.text)}</h1>\n`
      return { content: h1 + content, changed: true, summary: `Inserted H1: "${t.text}".` }
    }
    case 'append-internal-links': {
      if (content.includes(RELATED_MARKER)) return { content, changed: false, summary: 'Related-links block already present; no change.' }
      const links = t.links.filter((l) => l.url && l.anchor)
      if (links.length === 0) return { content, changed: false, summary: 'No internal link targets available.' }
      const items = links.map((l) => `<li><a href="${escapeHtml(l.url)}">${escapeHtml(l.anchor)}</a></li>`).join('\n')
      const block = `\n<!-- ${RELATED_MARKER} -->\n<p><strong>Related pages</strong></p>\n<ul>\n${items}\n</ul>`
      return { content: content + block, changed: true, summary: `Added ${links.length} internal link(s).` }
    }
    case 'set-jsonld': {
      // Upsert a managed JSON-LD block into the post body. The JSON must be
      // valid; an invalid or empty payload is a no-op (never ship broken markup).
      const json = t.jsonLd.trim()
      if (!json) return { content, changed: false, summary: 'No structured data provided; no change.' }
      try { JSON.parse(json) } catch { return { content, changed: false, summary: 'Structured data is not valid JSON; skipped.' } }
      const block = `<!-- ${SCHEMA_MARKER} -->\n<script type="application/ld+json">\n${json}\n</script>\n<!-- /${SCHEMA_MARKER} -->`
      if (SCHEMA_BLOCK_RE.test(content)) {
        const replaced = content.replace(SCHEMA_BLOCK_RE, block)
        return { content: replaced, changed: replaced !== content, summary: replaced !== content ? 'Updated structured data (JSON-LD).' : 'Structured data already up to date; no change.' }
      }
      return { content: `${content}\n${block}`, changed: true, summary: 'Added structured data (JSON-LD).' }
    }
  }
}

// Confirm the transform's invariant holds in `content` (used for read-back
// verification after the WordPress write).
export function verifyContentTransform(content: string, t: ContentTransform): boolean {
  switch (t.type) {
    case 'https-upgrade':
      return t.hosts.every((h) => !h || !content.includes(`http://${h}`))
    case 'prepend-h1':
      return /<h1[\s>]/i.test(content)
    case 'append-internal-links':
      return content.includes(RELATED_MARKER)
    case 'set-jsonld':
      // Confirm BOTH the marker and a real ld+json <script> survived the write.
      // WordPress strips <script> from post content unless the user has the
      // `unfiltered_html` capability, so checking the marker alone would false-
      // pass; requiring the script tag makes a stripped write verify-fail honestly.
      return content.includes(SCHEMA_MARKER) && /<script[^>]*type=["']application\/ld\+json["']/i.test(content)
  }
}
