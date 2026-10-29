import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

// Search and AI answer engines are welcome: being cited by ChatGPT, Claude,
// Perplexity and Google's AI features is the point of AEO.
export default function robots(): MetadataRoute.Robots {
  const disallow = ['/api/', '/find-a-lawyer?', '/admin/', '/_/']
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot'],
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
