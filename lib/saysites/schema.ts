// SaySites content model — the single source of truth for a site.
//
// A page is a tree of Containers holding Widgets, stored as JSON and validated
// here. The builder, Sofie (the chat assistant) and the SEO Operator all edit
// this same structure; none of them ever writes HTML. The renderer turns a
// validated tree into lean HTML + CSS, which is what makes the SEO guard-rails
// and the 95+ speed gate enforceable.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Responsive values
// ---------------------------------------------------------------------------

export const BREAKPOINTS = ['desktop', 'tablet', 'mobile'] as const
export type Breakpoint = (typeof BREAKPOINTS)[number]

// Max widths the tablet/mobile overrides apply at. Desktop is the base style.
export const BREAKPOINT_MAX_WIDTH: Record<Exclude<Breakpoint, 'desktop'>, number> = {
  tablet: 1024,
  mobile: 640,
}

// A style value set for desktop, optionally overridden per smaller device —
// the Elementor "responsive control" model.
export function responsive<T extends z.ZodTypeAny>(inner: T) {
  return z
    .object({ desktop: inner, tablet: inner.optional(), mobile: inner.optional() })
    .strict()
}
export type Responsive<T> = { desktop: T; tablet?: T; mobile?: T }

// ---------------------------------------------------------------------------
// Global styles (Site Settings)
// ---------------------------------------------------------------------------

const hex = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a hex color like #1a2b3c')

export const COLOR_TOKENS = ['primary', 'secondary', 'accent', 'text', 'muted', 'background', 'surface'] as const
export type ColorToken = (typeof COLOR_TOKENS)[number]

// A color is either a global token reference ("primary") or a literal hex.
// Elements default to tokens so a whole site restyles by changing globals.
export const ColorValue = z.union([z.enum(COLOR_TOKENS), hex])
export type ColorValue = z.infer<typeof ColorValue>

// Font stacks we can render without any network fetch. Self-hosted brand
// fonts come later; system stacks keep the speed gate trivially green.
export const FONT_STACKS = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
} as const
export type FontStack = keyof typeof FONT_STACKS

export const GlobalStyles = z
  .object({
    colors: z.object(Object.fromEntries(COLOR_TOKENS.map((t) => [t, hex])) as Record<ColorToken, typeof hex>).strict(),
    fonts: z.object({ heading: z.enum(['sans', 'serif', 'mono', 'rounded']), body: z.enum(['sans', 'serif', 'mono', 'rounded']) }).strict(),
    // Body font size in px and the modular scale ratio headings step up by.
    baseFontSize: z.number().min(12).max(24),
    typeScale: z.number().min(1.05).max(1.6),
    radius: z.number().min(0).max(48),
    // Max content width in px.
    containerWidth: z.number().min(640).max(1920),
  })
  .strict()
export type GlobalStyles = z.infer<typeof GlobalStyles>

// ---------------------------------------------------------------------------
// Element styles
// ---------------------------------------------------------------------------

const px = z.number().min(0).max(2000)
const spacing = z
  .object({ top: px, right: px, bottom: px, left: px })
  .strict()

export const ElementStyle = z
  .object({
    padding: responsive(spacing).optional(),
    margin: responsive(spacing).optional(),
    gap: responsive(px).optional(),
    background: ColorValue.optional(),
    color: ColorValue.optional(),
    fontSize: responsive(z.number().min(8).max(160)).optional(),
    fontWeight: z.union([z.literal(300), z.literal(400), z.literal(500), z.literal(600), z.literal(700), z.literal(800), z.literal(900)]).optional(),
    textAlign: responsive(z.enum(['left', 'center', 'right'])).optional(),
    borderRadius: px.optional(),
    maxWidth: px.optional(),
  })
  .strict()
export type ElementStyle = z.infer<typeof ElementStyle>

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/, 'ids are lowercase letters, digits and dashes')

// Internal paths ("/services") or absolute http(s) URLs, plus tel:/mailto:.
const href = z.string().regex(/^(\/[^\s]*|https?:\/\/[^\s]+|tel:[+\d\s()-]+|mailto:[^\s]+|#[\w-]*)$/, 'not a valid link')

const widgetBase = { id, style: ElementStyle.optional() }

export const HeadingWidget = z
  .object({ ...widgetBase, type: z.literal('heading'), level: z.number().int().min(1).max(6), text: z.string().min(1).max(300) })
  .strict()

export const TextWidget = z
  .object({
    ...widgetBase,
    type: z.literal('text'),
    // Plain text. Blank lines separate paragraphs. Rich text arrives with the
    // editor in Phase 1 as a constrained mark set, never raw HTML.
    text: z.string().min(1).max(20_000),
  })
  .strict()

export const ImageWidget = z
  .object({
    ...widgetBase,
    type: z.literal('image'),
    src: z.string().min(1),
    // Required and non-empty: alt text is an SEO + accessibility guard-rail.
    alt: z.string().trim().min(1, 'images need alt text').max(250),
    // Intrinsic size is required so the browser reserves space (no layout shift).
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    // The first image above the fold should load eagerly; everything else is lazy.
    priority: z.boolean().optional(),
  })
  .strict()

export const ButtonWidget = z
  .object({
    ...widgetBase,
    type: z.literal('button'),
    label: z.string().min(1).max(80),
    href,
    variant: z.enum(['primary', 'secondary', 'outline']),
  })
  .strict()

export const FaqWidget = z
  .object({
    ...widgetBase,
    type: z.literal('faq'),
    items: z
      .array(z.object({ question: z.string().min(1).max(300), answer: z.string().min(1).max(5000) }).strict())
      .min(1)
      .max(50),
  })
  .strict()

export const Widget = z.discriminatedUnion('type', [HeadingWidget, TextWidget, ImageWidget, ButtonWidget, FaqWidget])
export type Widget = z.infer<typeof Widget>
export type WidgetType = Widget['type']

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

export const CONTAINER_TAGS = ['section', 'div', 'header', 'footer', 'nav', 'article', 'aside'] as const

export interface Container {
  id: string
  type: 'container'
  tag?: (typeof CONTAINER_TAGS)[number]
  layout: 'flex' | 'grid'
  direction?: Responsive<'row' | 'column'>
  // Grid only: column count per breakpoint.
  columns?: Responsive<number>
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  // Full-bleed background, content constrained to the global containerWidth.
  boxed?: boolean
  style?: ElementStyle
  children: Element[]
}
export type Element = Container | Widget

export const ContainerSchema: z.ZodType<Container> = z.lazy(() =>
  z
    .object({
      id,
      type: z.literal('container'),
      tag: z.enum(CONTAINER_TAGS).optional(),
      layout: z.enum(['flex', 'grid']),
      direction: responsive(z.enum(['row', 'column'])).optional(),
      columns: responsive(z.number().int().min(1).max(12)).optional(),
      align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
      justify: z.enum(['start', 'center', 'end', 'between']).optional(),
      boxed: z.boolean().optional(),
      style: ElementStyle.optional(),
      children: z.array(ElementSchema).max(200),
    })
    .strict()
)

export const ElementSchema: z.ZodType<Element> = z.lazy(() => z.union([ContainerSchema, Widget]))

// ---------------------------------------------------------------------------
// Site, page, redirect
// ---------------------------------------------------------------------------

// "" is the home page; otherwise lowercase path segments.
export const Slug = z.string().regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/, 'slugs are lowercase words joined by dashes')

export const PageSeo = z
  .object({
    title: z.string().min(1).max(70),
    description: z.string().min(1).max(170),
    noindex: z.boolean().optional(),
    ogImage: z.string().optional(),
  })
  .strict()

export const PageSchema = z
  .object({
    id: z.string().min(1),
    siteId: z.string().min(1),
    slug: Slug,
    // Breadcrumb label and nav label.
    name: z.string().min(1).max(60),
    status: z.enum(['draft', 'published']),
    seo: PageSeo,
    body: z.array(ContainerSchema).max(100),
    updatedAt: z.string(),
  })
  .strict()
export type Page = z.infer<typeof PageSchema>

// The business behind the site — imported from Google Business Profile in
// Phase 4, typed in by hand until then. Drives LocalBusiness structured data.
export const BusinessInfo = z
  .object({
    name: z.string().min(1).max(120),
    // schema.org LocalBusiness subtype, e.g. "Plumber", "Dentist", "Store".
    schemaType: z.string().regex(/^[A-Z][A-Za-z]+$/).default('LocalBusiness'),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z
      .object({ street: z.string(), city: z.string(), region: z.string(), postalCode: z.string(), country: z.string().length(2) })
      .strict()
      .optional(),
    // "Mo-Fr 08:00-17:00" style, as schema.org openingHours expects.
    hours: z.array(z.string()).optional(),
    priceRange: z.string().max(10).optional(),
    logo: z.string().optional(),
    sameAs: z.array(z.string().url()).optional(),
  })
  .strict()
export type BusinessInfo = z.infer<typeof BusinessInfo>

export const SiteSchema = z
  .object({
    id: z.string().min(1),
    orgId: z.string().min(1),
    // <subdomain>.saysites.com until a custom domain is attached.
    subdomain: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
    customDomain: z.string().regex(/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/).optional(),
    language: z.string().min(2).max(10).default('en'),
    business: BusinessInfo,
    globals: GlobalStyles,
    nav: z.array(z.object({ label: z.string().min(1).max(40), href }).strict()).max(12),
    updatedAt: z.string(),
  })
  .strict()
export type Site = z.infer<typeof SiteSchema>

export const RedirectSchema = z
  .object({ from: z.string().startsWith('/'), to: z.string().startsWith('/'), status: z.union([z.literal(301), z.literal(302)]) })
  .strict()
export type Redirect = z.infer<typeof RedirectSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function siteOrigin(site: Pick<Site, 'subdomain' | 'customDomain'>): string {
  return `https://${site.customDomain ?? `${site.subdomain}.saysites.com`}`
}

export function pagePath(page: Pick<Page, 'slug'>): string {
  return page.slug === '' ? '/' : `/${page.slug}`
}

// Depth-first walk over every element in a page body.
export function* walk(elements: readonly Element[]): Generator<Element> {
  for (const el of elements) {
    yield el
    if (el.type === 'container') yield* walk(el.children)
  }
}
