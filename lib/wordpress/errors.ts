// WordPress connection error taxonomy.
//
// A generic "authentication failed" tells a user nothing about what to do
// next. Every category here answers four questions: what failed, why it
// likely failed, what the user should do, and whether retrying makes sense.
// classifyWordPressError() maps raw signals (HTTP status, response body,
// thrown exception, response headers) onto one of these categories using
// the same heuristics a human debugging the request would use.

export type WordPressErrorCategory =
  | 'invalid_url'
  | 'site_unreachable'
  | 'rest_api_unavailable'
  | 'rest_api_blocked'
  | 'invalid_username'
  | 'invalid_app_password'
  | 'application_passwords_disabled'
  | 'insufficient_permissions'
  | 'security_plugin_blocking'
  | 'hosting_firewall_blocking'
  | 'proxy_challenge'
  | 'incorrect_install_path'
  | 'multisite_configuration'
  | 'unsupported_auth_method'
  | 'seo_plugin_unavailable'
  | 'plugin_field_unavailable'
  | 'server_timeout'
  | 'ssl_certificate_error'
  | 'redirect_loop'
  | 'rankforge_configuration_error'
  | 'unknown'

export interface WordPressErrorReport {
  category: WordPressErrorCategory
  /** Short, user-facing summary of what failed. */
  whatFailed: string
  /** Plain-language explanation of the likely cause. */
  whyLikely: string
  /** The concrete next step for the user. */
  whatToDo: string
  /** Whether retrying the same request could succeed without changes. */
  canRetry: boolean
  /** Raw technical detail — status codes, response snippets — for an expandable section. Never contains credentials. */
  technicalDetails: string
}

const CATEGORY_COPY: Record<WordPressErrorCategory, Omit<WordPressErrorReport, 'technicalDetails'>> = {
  invalid_url: {
    category: 'invalid_url',
    whatFailed: 'The WordPress site URL is not valid.',
    whyLikely: "The address you entered doesn't parse as a domain (e.g. missing a valid TLD, or contains illegal characters).",
    whatToDo: 'Enter your site as a plain domain or full URL, e.g. example.com or https://example.com.',
    canRetry: true,
  },
  site_unreachable: {
    category: 'site_unreachable',
    whatFailed: "RankForge couldn't reach the site at all.",
    whyLikely: 'The domain may be down, DNS may not be resolving, or the site may be blocking requests from outside your network.',
    whatToDo: 'Confirm the site loads in your browser, then verify the URL you entered is correct and publicly accessible.',
    canRetry: true,
  },
  rest_api_unavailable: {
    category: 'rest_api_unavailable',
    whatFailed: "The WordPress REST API isn't responding at the expected location.",
    whyLikely: 'This usually means the WordPress install path is different than what was entered, permalinks are set to "Plain," or the REST API has been disabled.',
    whatToDo: 'Check Settings → Permalinks in WordPress (avoid "Plain"), and confirm the site URL points at the actual WordPress install, not a subdirectory in front of it.',
    canRetry: true,
  },
  rest_api_blocked: {
    category: 'rest_api_blocked',
    whatFailed: 'The REST API responded, but requests to it are being blocked.',
    whyLikely: 'A security plugin, .htaccess rule, or hosting-level rule is restricting access to /wp-json/.',
    whatToDo: 'Ask whoever manages the site to allowlist REST API access for RankForge, or temporarily disable REST API restriction plugins to confirm.',
    canRetry: true,
  },
  invalid_username: {
    category: 'invalid_username',
    whatFailed: "WordPress didn't recognize that username.",
    whyLikely: 'The username may be misspelled, or you may have entered an email address instead of the WordPress username.',
    whatToDo: 'Double check the exact username under WordPress → Users → Profile (not your email or display name).',
    canRetry: true,
  },
  invalid_app_password: {
    category: 'invalid_app_password',
    whatFailed: 'WordPress rejected the Application Password.',
    whyLikely: 'The password may have been mistyped, revoked, or regenerated since it was entered here.',
    whatToDo: 'Generate a new Application Password under WordPress → Users → Profile → Application Passwords, and paste it in exactly as shown.',
    canRetry: true,
  },
  application_passwords_disabled: {
    category: 'application_passwords_disabled',
    whatFailed: 'Application Passwords are disabled on this WordPress site.',
    whyLikely: 'A plugin or site configuration has turned off the Application Passwords feature (introduced in WordPress 5.6).',
    whatToDo: 'Ask whoever manages the site to enable Application Passwords, or check for a security plugin setting that disables them.',
    canRetry: false,
  },
  insufficient_permissions: {
    category: 'insufficient_permissions',
    whatFailed: 'The WordPress account authenticated, but lacks permission to edit content.',
    whyLikely: 'The account is likely set to a role like Subscriber or Contributor rather than Editor or Administrator.',
    whatToDo: 'Use an account with the Editor or Administrator role, or ask a site admin to grant edit_posts / edit_pages capability.',
    canRetry: false,
  },
  security_plugin_blocking: {
    category: 'security_plugin_blocking',
    whatFailed: 'A security plugin on the site is blocking the connection.',
    whyLikely: 'Plugins like Wordfence, Solid Security, or Sucuri can block REST API authentication or Application Passwords by default.',
    whatToDo: 'Check the security plugin\'s firewall/REST API settings and allowlist RankForge, or temporarily disable the rule to confirm this is the cause.',
    canRetry: true,
  },
  hosting_firewall_blocking: {
    category: 'hosting_firewall_blocking',
    whatFailed: "The hosting provider's firewall blocked the request.",
    whyLikely: 'Some hosts block Basic Authentication headers or unfamiliar user agents at the server/firewall level before WordPress even sees the request.',
    whatToDo: 'Contact the hosting provider and ask them to allow REST API requests with Basic Authentication headers.',
    canRetry: true,
  },
  proxy_challenge: {
    category: 'proxy_challenge',
    whatFailed: 'A proxy or CDN (such as Cloudflare) intercepted the request with a challenge page.',
    whyLikely: 'Bot-protection features (JS challenge, CAPTCHA, "I\'m Under Attack" mode) block automated, non-browser requests like this one.',
    whatToDo: 'In the CDN/proxy dashboard, add an allowlist rule for the WordPress REST API path (/wp-json/) or for RankForge specifically.',
    canRetry: true,
  },
  incorrect_install_path: {
    category: 'incorrect_install_path',
    whatFailed: "WordPress wasn't found at the URL entered.",
    whyLikely: 'WordPress may be installed in a subdirectory (e.g. example.com/blog) rather than at the domain root, or vice versa.',
    whatToDo: 'Enter the exact URL where WordPress is installed — the address that loads the WordPress site in a browser.',
    canRetry: true,
  },
  multisite_configuration: {
    category: 'multisite_configuration',
    whatFailed: 'This looks like a WordPress Multisite network, which needs the specific subsite URL.',
    whyLikely: 'On Multisite, each subsite has its own REST API root; the network root alone is not sufficient.',
    whatToDo: 'Enter the URL of the specific subsite you want to connect, not the network\'s primary domain.',
    canRetry: true,
  },
  unsupported_auth_method: {
    category: 'unsupported_auth_method',
    whatFailed: 'This site is using an authentication setup RankForge doesn\'t support.',
    whyLikely: 'The site may require an alternate auth plugin (JWT, OAuth) instead of core Application Passwords, or Basic Auth headers are being stripped.',
    whatToDo: 'Confirm WordPress core Application Passwords (not a third-party auth plugin) is the intended method for this connection.',
    canRetry: false,
  },
  seo_plugin_unavailable: {
    category: 'seo_plugin_unavailable',
    whatFailed: "RankForge couldn't detect a supported SEO plugin.",
    whyLikely: 'The site may be using core WordPress metadata only, an unsupported plugin, or the plugin\'s REST fields aren\'t exposed.',
    whatToDo: 'RankForge can still edit core title/content fields. For full SEO field support, install Yoast SEO, Rank Math, AIOSEO, or SEOPress.',
    canRetry: false,
  },
  plugin_field_unavailable: {
    category: 'plugin_field_unavailable',
    whatFailed: "The detected SEO plugin's fields aren't accessible over the REST API.",
    whyLikely: "The plugin may not expose its meta fields to the REST API by default, or a version mismatch is hiding them.",
    whatToDo: "Check the SEO plugin's REST API / Application Passwords compatibility settings, or update to the latest version.",
    canRetry: true,
  },
  server_timeout: {
    category: 'server_timeout',
    whatFailed: 'The WordPress site took too long to respond.',
    whyLikely: 'The server may be under heavy load, slow, or temporarily unresponsive.',
    whatToDo: 'Try again in a moment. If this keeps happening, check the site\'s hosting performance.',
    canRetry: true,
  },
  ssl_certificate_error: {
    category: 'ssl_certificate_error',
    whatFailed: "The site's SSL certificate couldn't be verified.",
    whyLikely: 'The certificate may be expired, self-signed, or misconfigured for this domain.',
    whatToDo: 'Renew or fix the SSL certificate for this domain. RankForge will not connect to a site with an untrusted certificate.',
    canRetry: false,
  },
  redirect_loop: {
    category: 'redirect_loop',
    whatFailed: 'The site redirected too many times without resolving.',
    whyLikely: 'This often happens with conflicting http/https or www/non-www redirect rules, or a caching/CDN misconfiguration.',
    whatToDo: 'Check the site\'s redirect rules (in WordPress settings, .htaccess, or the CDN) for a loop between URL variants.',
    canRetry: true,
  },
  rankforge_configuration_error: {
    category: 'rankforge_configuration_error',
    whatFailed: 'RankForge blocked this request as a safety precaution.',
    whyLikely: 'The URL resolves to a private or internal network address, which RankForge never connects to automatically.',
    whatToDo: 'If you believe this is a mistake, verify the domain resolves to a public address, or contact support.',
    canRetry: false,
  },
  unknown: {
    category: 'unknown',
    whatFailed: 'The connection failed for an unrecognized reason.',
    whyLikely: 'This doesn\'t match a known failure pattern.',
    whatToDo: 'Check the technical details below, or try again. If it persists, contact support with those details.',
    canRetry: true,
  },
}

export interface ClassifyWordPressErrorInput {
  httpStatus?: number
  bodyText?: string
  headers?: Record<string, string>
  exceptionMessage?: string
  exceptionName?: string
  /** Which diagnostic step this failure occurred at, for technical detail context. */
  step?: string
}

/** Redacts anything that could resemble a credential from technical detail strings. */
function redact(text: string): string {
  return text
    .replace(/authorization:\s*basic\s+\S+/gi, 'Authorization: Basic [redacted]')
    .replace(/"?app(?:lication)?[-_ ]?password"?\s*[:=]\s*"?[^",\s]+"?/gi, 'applicationPassword=[redacted]')
}

export function classifyWordPressError(input: ClassifyWordPressErrorInput): WordPressErrorReport {
  const { httpStatus, bodyText = '', headers = {}, exceptionMessage = '', exceptionName = '', step = '' } = input
  const body = bodyText.toLowerCase()
  const msg = exceptionMessage.toLowerCase()
  const headerBlob = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n').toLowerCase()

  let category: WordPressErrorCategory = 'unknown'

  // Network / exception-level failures first — no HTTP status was ever received.
  if (!httpStatus) {
    if (exceptionName === 'AbortError' || msg.includes('aborted') || msg.includes('timeout') || msg.includes('timed out')) {
      category = 'server_timeout'
    } else if (msg.includes('certificate') || msg.includes('self-signed') || msg.includes('self signed') || msg.includes('ssl')) {
      category = 'ssl_certificate_error'
    } else if (msg.includes('too many redirects') || msg.includes('redirect loop')) {
      category = 'redirect_loop'
    } else if (msg.includes('blocked outbound') || msg.includes('private') && msg.includes('ip')) {
      category = 'rankforge_configuration_error'
    } else if (msg.includes('enotfound') || msg.includes('econnrefused') || msg.includes('could not resolve') || msg.includes('fetch failed')) {
      category = 'site_unreachable'
    } else {
      category = 'site_unreachable'
    }
  } else if (httpStatus === 401) {
    if (body.includes('incorrect password') || body.includes('application password') || body.includes('invalid_username') === false && body.includes('password')) {
      category = 'invalid_app_password'
    } else if (body.includes('invalid_username') || body.includes('unknown_user') || body.includes('username')) {
      category = 'invalid_username'
    } else {
      category = 'invalid_app_password'
    }
  } else if (httpStatus === 403) {
    // "Lacks edit permission" only makes sense once a user identity has been
    // established (an authenticated request, or a step that explicitly checks
    // capabilities). A 403 on an unauthenticated request — e.g. the initial
    // /wp-json/ reachability check — can't mean "your account lacks
    // permission," because no account has been verified yet.
    const isPostAuthContext = step === 'edit permission' || step === 'apply' || step.includes('capability')
    if (headerBlob.includes('cf-ray') || body.includes('cloudflare') || body.includes('checking your browser') || body.includes('attention required')) {
      category = 'proxy_challenge'
    } else if (body.includes('wordfence') || body.includes('sucuri') || body.includes('ithemes') || body.includes('solid security') || body.includes('all in one wp security')) {
      category = 'security_plugin_blocking'
    } else if (isPostAuthContext && (body.includes('rest_forbidden') || body.includes('edit_posts') || body.includes('capability'))) {
      category = 'insufficient_permissions'
    } else if (body.startsWith('<') || body.includes('access denied') || !isPostAuthContext) {
      category = 'hosting_firewall_blocking'
    } else {
      category = 'insufficient_permissions'
    }
  } else if (httpStatus === 404) {
    if (body.includes('multisite') || body.includes('network')) {
      category = 'multisite_configuration'
    } else {
      category = step.includes('rest') ? 'rest_api_unavailable' : 'incorrect_install_path'
    }
  } else if (httpStatus === 405) {
    category = 'unsupported_auth_method'
  } else if (httpStatus === 421 || httpStatus === 525 || httpStatus === 526) {
    category = 'ssl_certificate_error'
  } else if (httpStatus === 503) {
    category = headerBlob.includes('cf-ray') || body.includes('cloudflare') ? 'proxy_challenge' : 'server_timeout'
  } else if (httpStatus >= 500) {
    category = 'rest_api_unavailable'
  } else if (httpStatus === 400 && body.includes('application_passwords_disabled')) {
    category = 'application_passwords_disabled'
  } else {
    category = 'unknown'
  }

  const copy = CATEGORY_COPY[category]
  const technicalParts = [
    step ? `Step: ${step}` : null,
    httpStatus ? `HTTP status: ${httpStatus}` : null,
    exceptionName ? `Exception: ${exceptionName}` : null,
    exceptionMessage ? `Message: ${exceptionMessage}` : null,
    bodyText ? `Response: ${bodyText.slice(0, 500)}` : null,
  ].filter(Boolean) as string[]

  return {
    ...copy,
    technicalDetails: redact(technicalParts.join('\n')),
  }
}
