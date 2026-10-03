// Three logo directions at once, for the owner to pick from. Sofie works as
// an art director: she chooses typefaces, spacing, layout, mark and colours;
// lib/logo-compose builds each logo with real typefaces and exact spacing;
// then she sees the rendered result and refines it before the owner does.

import type { Tokens } from './usage'
import Anthropic from '@anthropic-ai/sdk'
import { LOGO_CRAFT, LOGO_FONTS, LOGO_ICONS, LOGO_SPEC_PROPERTIES, LOGO_SPEC_REQUIRED, composeLogo, googleFontLoader, specFromInput, type FontLoader } from './logo-compose'
import { renderSheet } from './logo-render'
import type { Site } from './schema'
import { SOFIE_MODEL, createMessage } from './sofie'
import { SvgError, type CleanSvg } from './svg'

export interface DrawnIdea {
  name: string
  note: string
  logo: CleanSvg
  icon: CleanSvg
}

const TOOL: Anthropic.Beta.BetaTool = {
  name: 'present_logos',
  description: 'Show your three logo directions. Each is built exactly from your spec with real typefaces.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ideas: {
        type: 'array',
        description: 'Exactly three ideas, each a clearly different direction (different typeface and structure).',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            direction: { type: 'string', description: 'Two or three words naming the direction, e.g. "Warm serif wordmark".' },
            note: { type: 'string', description: 'One short, plain sentence for the owner about the idea.' },
            ...LOGO_SPEC_PROPERTIES,
          },
          required: ['direction', 'note', ...LOGO_SPEC_REQUIRED],
        },
      },
    },
    required: ['ideas'],
  },
}

const FONT_LIST = Object.entries(LOGO_FONTS)
  .map(([name, f]) => `- ${name} (${f.weights.join('/')}): ${f.style}`)
  .join('\n')

export const LOGO_SYSTEM = `You are Sofie, the art director inside SaySites, designing a logo for a small local business. You don't draw letters by hand: you specify the design (typeface, weight, case, letter-spacing, layout, mark, colours) and SaySites builds it precisely with the real typeface. Then you see the result and refine it.

Typefaces you can use:
${FONT_LIST}

${LOGO_CRAFT}

Icons you can use (professionally drawn): ${LOGO_ICONS.join(', ')}.

Give three genuinely different directions built on three different structures from the list above (for example: a classic or framed wordmark, a two-weight name, and an icon lockup), each with a different typeface, and each clearly made for this business rather than any business. Each logo is shown about 56px tall in the website header, and its mark (or first letter) becomes the browser-tab icon.`

function brief(site: Site, ask: string): string {
  const b = site.business
  const c = site.globals.colors
  return [
    `Business: ${b.name}`,
    site.tagline ? `About: ${site.tagline}` : '',
    b.address ? `Town: ${b.address.city}, ${b.address.region}` : '',
    `Brand colours from the site: primary ${c.primary}, secondary ${c.secondary}, accent ${c.accent}, text ${c.text}, background ${c.background}. Use these unless the owner asks otherwise.`,
    ask ? `What the owner asked for: ${ask}` : 'The owner has not described a style: give three strong, fitting options.',
  ]
    .filter(Boolean)
    .join('\n')
}

interface Built {
  name: string
  note: string
  logo: CleanSvg
  icon: CleanSvg
}

async function build(raw: unknown, load: FontLoader): Promise<{ built: (Built | null)[]; problems: string[] }> {
  const list = Array.isArray((raw as { ideas?: unknown })?.ideas) ? (raw as { ideas: Record<string, unknown>[] }).ideas.slice(0, 3) : []
  const problems: string[] = []
  const built = await Promise.all(
    list.map(async (it, i) => {
      try {
        const out = await composeLogo(specFromInput(it ?? {}), load)
        return { name: String(it.direction ?? `Idea ${i + 1}`).slice(0, 40), note: String(it.note ?? '').slice(0, 200), logo: { svg: out.svg, width: out.width, height: out.height }, icon: { svg: out.icon, width: 64, height: 64 } }
      } catch (e) {
        if (!(e instanceof SvgError)) throw e
        problems.push(`Idea ${i + 1}: ${e.message}`)
        return null
      }
    })
  )
  if (list.length < 3) problems.push(`Only ${list.length} idea(s) were given; give three.`)
  return { built, problems }
}

export async function drawLogoIdeas(site: Site, ask: string, client: Anthropic = new Anthropic(), load: FontLoader = googleFontLoader, meter?: (u: Tokens) => void): Promise<DrawnIdea[]> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: brief(site, ask.trim().slice(0, 500)) }]
  let first: (Built | null)[] = []
  // Round 1 designs; round 2 looks at the renders and refines; round 3 only
  // happens if round 2's call was missing.
  for (let round = 0; round < 3; round++) {
    const response = await createMessage(client, {
      model: SOFIE_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: LOGO_SYSTEM,
      tools: [TOOL],
      messages,
    })
    if (response.usage) meter?.(response.usage as Tokens)
    const call = response.content.find((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use' && b.name === TOOL.name)
    if (!call) {
      if (first.length) break
      messages.push({ role: 'assistant', content: response.content }, { role: 'user', content: 'Please call present_logos with your three ideas.' })
      continue
    }
    const { built, problems } = await build(call.input, load)
    if (!first.length) {
      first = built
      const shown = built.filter((b): b is Built => b !== null)
      const content: Anthropic.Beta.BetaToolResultBlockParam['content'] = [
        {
          type: 'text',
          text:
            (shown.length ? `Here is exactly how your ${shown.length} logo(s) render, top to bottom in order: each at twice header size on the site's background, then the icon large and at browser-tab size.\n` : '') +
            (problems.length ? `These could not be built:\n- ${problems.join('\n- ')}\n` : '') +
            `Measured width to height: ${built.map((b, i) => (b ? `idea ${i + 1} ${(b.logo.width / b.logo.height).toFixed(1)}:1` : `idea ${i + 1} failed`)).join(', ')}. In a 56px-tall header, anything over 4.5:1 gets small and hard to read: stack words (a two-weight name stacks automatically) or shorten the tagline.\n` +
            'Look hard, like a senior identity designer reviewing a junior\'s work: is the name easy to read at small size? Is the spacing even, the letter-spacing right for the case, the mark in balance with the name (not too big or small), the colours calm with good contrast, and does each feel made for this business rather than generic? Fix every weakness you see (change typeface, weight, tracking, layout, tagline or colours as needed), replace any idea that is weak or too similar to another, then call present_logos with the final three.',
        },
      ]
      if (shown.length) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: renderSheet(shown.map((b) => ({ logo: b.logo.svg, icon: b.icon.svg })), site.globals.colors.background).toString('base64') } })
      messages.push({ role: 'assistant', content: response.content }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: call.id, content }] })
      continue
    }
    // Final round: keep each refined idea, or the first version if it broke.
    return built.map((b, i) => b ?? first[i] ?? null).filter((b): b is Built => b !== null)
  }
  return first.filter((b): b is Built => b !== null)
}
