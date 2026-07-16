// WordPress SEO plugin detection.
//
// Authentication succeeding tells us nothing about which SEO fields we can
// actually edit — that depends entirely on which SEO plugin (if any) is
// active and which of its fields it exposes over the REST API. This module
// is deliberately separate from auth: a connection can be fully
// authenticated and still have no usable SEO plugin integration.

export type SeoPluginId = 'aioseo' | 'yoast' | 'rankmath' | 'seopress' | 'core' | 'unknown'

export interface SeoPluginReport {
  plugin: SeoPluginId
  pluginLabel: string
  /** REST namespace that indicated this plugin, if any. */
  detectedNamespace: string | null
  supportedFields: string[]
  unsupportedFields: string[]
  canDeploy: boolean
  canRollback: boolean
  knownLimitations: string[]
}

const PLUGIN_NAMESPACE_MARKERS: { plugin: SeoPluginId; label: string; test: (ns: string) => boolean }[] = [
  { plugin: 'aioseo', label: 'All in One SEO (AIOSEO)', test: (ns) => ns.includes('aioseo') },
  { plugin: 'rankmath', label: 'Rank Math', test: (ns) => ns.includes('rankmath') },
  { plugin: 'yoast', label: 'Yoast SEO', test: (ns) => ns.includes('yoast') },
  { plugin: 'seopress', label: 'SEOPress', test: (ns) => ns.includes('seopress') },
]

/**
 * Detects the active SEO plugin from the WordPress REST API namespace list
 * (GET /wp-json returns `namespaces: string[]`). Authentication is not
 * required for this — namespace discovery is public on virtually all sites.
 */
export function detectSeoPlugin(namespaces: string[]): SeoPluginReport {
  const lower = namespaces.map((n) => n.toLowerCase())

  for (const marker of PLUGIN_NAMESPACE_MARKERS) {
    const match = lower.find((ns) => marker.test(ns))
    if (match) {
      return buildReport(marker.plugin, marker.label, match)
    }
  }

  return buildReport('core', 'Core WordPress (no SEO plugin detected)', null)
}

function buildReport(plugin: SeoPluginId, label: string, namespace: string | null): SeoPluginReport {
  switch (plugin) {
    case 'aioseo':
      return {
        plugin,
        pluginLabel: label,
        detectedNamespace: namespace,
        supportedFields: ['title', 'content', 'excerpt', 'aioseo_meta_data.title', 'aioseo_meta_data.description'],
        unsupportedFields: ['aioseo_meta_data.schema (structured data editing not exposed via REST)'],
        canDeploy: true,
        canRollback: true,
        knownLimitations: [
          'AIOSEO must expose aioseo_meta_data via REST (default on recent versions) — older versions may not.',
        ],
      }
    case 'rankmath':
      return {
        plugin,
        pluginLabel: label,
        detectedNamespace: namespace,
        supportedFields: ['title', 'content', 'excerpt', 'rank_math_title (if exposed)', 'rank_math_description (if exposed)'],
        unsupportedFields: ['Rank Math schema/FAQ blocks (not exposed via REST)'],
        canDeploy: true,
        canRollback: true,
        knownLimitations: [
          'Rank Math only exposes rank_math_title / rank_math_description as REST meta if the site has enabled "Additional > REST API" support — verify during the capability test, not assumed from namespace presence alone.',
        ],
      }
    case 'yoast':
      return {
        plugin,
        pluginLabel: label,
        detectedNamespace: namespace,
        supportedFields: ['title', 'content', 'excerpt'],
        unsupportedFields: [
          'Yoast SEO title/meta description (Yoast restricts direct REST meta writes on many versions — verify with a capability test before deploying)',
        ],
        canDeploy: true,
        canRollback: true,
        knownLimitations: [
          'Yoast SEO REST meta field support varies significantly by version. Treat SEO-field writes as unverified until a capability test confirms them for this specific site.',
        ],
      }
    case 'seopress':
      return {
        plugin,
        pluginLabel: label,
        detectedNamespace: namespace,
        supportedFields: ['title', 'content', 'excerpt', '_seopress_titles_title (if exposed)', '_seopress_titles_desc (if exposed)'],
        unsupportedFields: ['SEOPress schema/social fields (not verified exposed via REST)'],
        canDeploy: true,
        canRollback: true,
        knownLimitations: [
          'SEOPress meta REST exposure depends on plugin settings — verify with a capability test before deploying.',
        ],
      }
    case 'core':
    default:
      return {
        plugin: 'core',
        pluginLabel: label,
        detectedNamespace: null,
        supportedFields: ['title', 'content', 'excerpt'],
        unsupportedFields: ['meta description', 'structured data / schema', 'social preview fields'],
        canDeploy: true,
        canRollback: true,
        knownLimitations: [
          'No SEO plugin detected — only core WordPress title/content/excerpt fields can be edited. Install Yoast SEO, Rank Math, AIOSEO, or SEOPress for full SEO field support.',
        ],
      }
  }
}
