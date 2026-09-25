// Three logo directions at once, for the owner to pick from. Drawing is
// hit-and-miss, so options beat a single try: one call asks Sofie for three
// distinct ideas, each checked by the SVG allowlist before it is kept.

import Anthropic from '@anthropic-ai/sdk'
import type { Site } from './schema'
import { SOFIE_MODEL, createMessage } from './sofie'
import { sanitizeSvg, SvgError, type CleanSvg } from './svg'

export interface DrawnIdea {
  name: string
  note: string
  logo: CleanSvg
  icon: CleanSvg
}

const TOOL: Anthropic.Beta.BetaTool = {
  name: 'present_logos',
  description: 'Show the owner your logo ideas. Call this exactly once with three distinct directions.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ideas: {
        type: 'array',
        description: 'Exactly three ideas, each a different direction.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', description: 'Two or three words naming the direction, e.g. "Classic badge".' },
            note: { type: 'string', description: 'One short sentence for the owner on the idea.' },
            svg: { type: 'string', description: 'The horizontal logo: one <svg> with xmlns and a viewBox like 0 0 360 80.' },
            icon_svg: { type: 'string', description: 'The mark alone in a square viewBox 0 0 64 64.' },
          },
          required: ['name', 'note', 'svg', 'icon_svg'],
        },
      },
    },
    required: ['ideas'],
  },
}

export const LOGO_SYSTEM = `You are Sofie, the designer inside SaySites, drawing logo ideas for a small local business. You draw in SVG code.

Give three genuinely different directions, for example: a wordmark where the name itself is the logo (set well, maybe one custom touch), a monogram or badge, and a simple symbol of the trade beside the name. Each is a horizontal lockup (viewBox wider than tall, like 0 0 360 80) that is shown 56px tall in the website header, plus the mark alone in a square 0 0 64 64 for the browser tab.

Craft:
- The name is the hero: its main line takes at least half the logo's height and is easy to read small. A second line (the trade or town), if any, is short and quiet.
- Marks are bold and simple: a few confident geometric shapes, even stroke weights, no hairlines, no tiny details. It must still read at 32px.
- Vertically centre text on the mark; leave even breathing room; nothing touches the edges of the viewBox.
- Two or three colours at most. Use the site's colours unless the owner asks otherwise.
- Text uses the visitor's fonts, so choose font-family stacks: a serif "Georgia, 'Times New Roman', serif", a sans "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", or "'Trebuchet MS', 'Segoe UI', sans-serif". Use font-weight and letter-spacing to give it character.
- Never copy another company's logo or trademark; avoid clichés (swooshes, globes, lightbulbs, generic houses with a roof line unless it's a trade that fits) and marks that could be read as a stray letter.

Allowed SVG: svg, g, path, circle, ellipse, rect, line, polyline, polygon, text, tspan, defs, linearGradient, radialGradient, stop, clipPath, title. Presentation attributes only (fill, stroke, transform, font-*…). No style attributes or <style>, no classes, no <use>, <image>, links, scripts or external URLs; url(#id) may point at a gradient or clip path in the same SVG.`

function brief(site: Site, ask: string): string {
  const b = site.business
  const c = site.globals.colors
  return [
    `Business: ${b.name}`,
    site.tagline ? `About: ${site.tagline}` : '',
    b.address ? `Town: ${b.address.city}, ${b.address.region}` : '',
    `Site colours: primary ${c.primary}, secondary ${c.secondary}, accent ${c.accent}, text ${c.text}, background ${c.background}.`,
    `Site heading font style: ${site.globals.fonts.heading}.`,
    ask ? `What the owner asked for: ${ask}` : 'The owner has not described a style; surprise them with three strong, fitting options.',
  ]
    .filter(Boolean)
    .join('\n')
}

function check(raw: unknown): { ideas: DrawnIdea[]; problems: string[] } {
  const list = Array.isArray((raw as { ideas?: unknown })?.ideas) ? ((raw as { ideas: unknown[] }).ideas) : []
  const ideas: DrawnIdea[] = []
  const problems: string[] = []
  list.slice(0, 3).forEach((item, i) => {
    const it = (item ?? {}) as Record<string, unknown>
    try {
      const logo = sanitizeSvg(String(it.svg ?? ''))
      const ratio = logo.width / logo.height
      if (ratio < 1.5 || ratio > 8) throw new SvgError('the logo should be a horizontal lockup, 1.5:1 to 8:1.')
      const icon = sanitizeSvg(String(it.icon_svg ?? ''))
      if (Math.abs(icon.width - icon.height) > 1) throw new SvgError('the icon must be square.')
      ideas.push({ name: String(it.name ?? `Idea ${i + 1}`).slice(0, 40), note: String(it.note ?? '').slice(0, 200), logo, icon })
    } catch (e) {
      if (!(e instanceof SvgError)) throw e
      problems.push(`Idea ${i + 1}: ${e.message}`)
    }
  })
  if (list.length < 3) problems.push(`Only ${list.length} idea(s) were given; give three.`)
  return { ideas, problems }
}

export async function drawLogoIdeas(site: Site, ask: string, client: Anthropic = new Anthropic()): Promise<DrawnIdea[]> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: brief(site, ask.trim().slice(0, 500)) }]
  let best: DrawnIdea[] = []
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await createMessage(client, {
      model: SOFIE_MODEL,
      max_tokens: 20000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: LOGO_SYSTEM,
      tools: [TOOL],
      messages,
    })
    const call = response.content.find((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use' && b.name === TOOL.name)
    if (!call) {
      messages.push({ role: 'assistant', content: response.content }, { role: 'user', content: 'Please call present_logos with your three ideas.' })
      continue
    }
    const { ideas, problems } = check(call.input)
    if (ideas.length > best.length) best = ideas
    if (!problems.length || attempt === 1) break
    messages.push(
      { role: 'assistant', content: response.content },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: call.id, is_error: true, content: `Some ideas can't be used:\n- ${problems.join('\n- ')}\nCall present_logos again with three ideas, fixing these.` }] }
    )
  }
  return best
}
