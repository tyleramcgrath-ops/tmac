// The content writer: a fuller website, in words written for this one
// business. It explains the work itself (what each service is, how it goes,
// what people ask) and never invents facts: no years, prices, credentials,
// guarantees or reviews the owner didn't give us. Every site gets its own
// wording, so pages pass the originality check (lib/vibe) and nothing on the
// SaySites network is duplicated boilerplate.

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { SOFIE_MODEL, createMessage } from './sofie'
import type { Tokens } from './usage'
import type { WrittenContent } from './starter'

export interface WriterInput {
  name: string
  // The kind of business, in words ("Plumber", "Law firm").
  kind: string
  city: string
  region: string
  services: string[]
  // The owner's own facts, if any; the only facts the writing may use.
  tagline?: string
  language?: string
}

const Written = z.object({
  about: z.object({ heading: z.string().min(3).max(90), paragraphs: z.array(z.string().min(20).max(1200)).min(2).max(4) }),
  services: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        summary: z.string().min(10).max(320),
        intro: z.string().min(20).max(900),
        sections: z.array(z.object({ heading: z.string().min(3).max(90), body: z.string().min(40).max(1400) })).min(3).max(5),
        faq: z.array(z.object({ q: z.string().min(5).max(200), a: z.string().min(10).max(700) })).min(2).max(4),
      })
    )
    .max(8),
})

export const WRITER_RULES = `Write website copy for one small local business, in its own voice ("we").

Return ONLY a JSON object:
{"about":{"heading":"…","paragraphs":["…","…","…"]},"services":[{"name":"<exact service name>","summary":"…","intro":"…","sections":[{"heading":"…","body":"…"}],"faq":[{"q":"…","a":"…"}]}]}

- about: a specific heading (not "About us") and 3 paragraphs, 170 to 230 words in all.
- One entry per service, in the order given, using each name exactly as given. For each: a summary of 1 or 2 sentences (35 words at most); an intro of 60 to 90 words; exactly 4 sections of 90 to 130 words with useful, varied headings (what it is and how it works, signs it is time, how the work goes, choices and what affects them, preparing or looking after it); exactly 3 questions with answers of 30 to 70 words.
- Explain the work the way a good, honest practitioner would to a customer, with concrete, true, general knowledge of the trade.

Never invent facts about the business. Use no years, counts, team size, ratings, awards, certifications, licences, insurance, warranties, guarantees, prices, discounts, response times, opening hours, "24/7" or emergency availability, financing, brands, named people, specific dishes or products, or policies, unless the owner's own words below state them. Use no digits at all. No customer quotes or reviews. No promised outcomes. Law firms: no legal advice, no outcome claims, no "expert" or "specialist", no statutes or deadlines; say every situation is different. Health: no promises of results or pain-free treatment.

Plain, warm, specific American English (or the language asked for). No clichés ("look no further", "one-stop shop", "top-notch", "second to none", "we pride ourselves", "state-of-the-art", "elevate"), no exclamation marks, no em dashes, no markdown. Mention the town naturally once or twice per service, never stuffed. Every service must read differently.`

// Sentences that slipped a fact in anyway (a number, a guarantee) come out;
// the rest of the paragraph stands.
const RISKY = /\d|\b(guarantee[ds]?|warrant(y|ies)|certified|licensed|insured|award|years? of experience|since (?:the )?\w+|24\/7|around the clock|best in|#\s*1|number one|five[- ]star)\b/i
export function scrub(text: string, allowed = ''): string {
  const ok = (s: string) => !RISKY.test(s) || (allowed && [...s.matchAll(new RegExp(RISKY.source, 'gi'))].every((m) => allowed.toLowerCase().includes(m[0].toLowerCase())))
  return text
    .replace(/\s*—\s*/g, ', ')
    .replace(/!/g, '.')
    .split(/(?<=[.?])\s+/)
    .filter(ok)
    .join(' ')
    .trim()
}

function clean(w: z.infer<typeof Written>, input: WriterInput): WrittenContent {
  const allowed = input.tagline ?? ''
  const s = (t: string) => scrub(t, allowed)
  const names = new Map(input.services.map((n) => [n.trim().toLowerCase(), n]))
  return {
    about: { heading: s(w.about.heading) || `${input.name}, in ${input.city}`, paragraphs: w.about.paragraphs.map(s).filter((p) => p.length > 40) },
    services: w.services
      .filter((x) => names.has(x.name.trim().toLowerCase()))
      .map((x) => ({
        name: names.get(x.name.trim().toLowerCase())!,
        summary: s(x.summary),
        intro: s(x.intro),
        sections: x.sections.map((sec) => ({ heading: s(sec.heading), body: s(sec.body) })).filter((sec) => sec.heading && sec.body.length > 60),
        faq: x.faq.map((f) => ({ q: s(f.q), a: s(f.a) })).filter((f) => f.q && f.a),
      }))
      .filter((x) => x.summary && x.intro && x.sections.length >= 2),
  }
}

export async function writeContent(input: WriterInput, client: Anthropic = new Anthropic()): Promise<{ content: WrittenContent; usage: Tokens }> {
  const services = input.services.slice(0, 8)
  const brief = [
    `Business: ${input.name}`,
    `Kind of business: ${input.kind}`,
    `Town: ${input.city}, ${input.region}`,
    `Services: ${services.map((x) => `"${x}"`).join(', ')}`,
    input.tagline ? `The owner's own words (the only facts you may use): ${input.tagline}` : 'The owner gave no other facts.',
    input.language === 'es' ? 'Write everything in Spanish.' : '',
  ]
    .filter(Boolean)
    .join('\n')
  const res = await createMessage(client, {
    model: SOFIE_MODEL,
    max_tokens: 16000,
    output_config: { effort: 'low' },
    system: WRITER_RULES,
    messages: [{ role: 'user', content: brief }],
  })
  const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('')
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  const parsed = Written.parse(JSON.parse(json))
  return { content: clean(parsed, { ...input, services }), usage: res.usage as Tokens }
}
