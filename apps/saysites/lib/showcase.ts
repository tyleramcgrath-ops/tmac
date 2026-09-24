// The live example sites linked from saysites.com. They are built by the
// same starter code every customer gets, with fixed ids so they never change
// between deploys, and served from /preview/<subdomain>.

import type { Page, Site } from './schema'
import { buildStarterSite } from './starter'

const NOW = '2026-09-24T00:00:00.000Z'
const OWNER = 'org_showcase'

function make(input: Parameters<typeof buildStarterSite>[0], subdomain: string): { site: Site; pages: Page[] } {
  return buildStarterSite(input, OWNER, subdomain, { siteId: `site_showcase_${subdomain.replace(/-/g, '_')}`, now: NOW })
}

export const SHOWCASE: Record<string, { site: Site; pages: Page[] }> = {
  'rivertown-plumbing': make(
    {
      name: 'Rivertown Plumbing',
      type: 'plumber',
      city: 'Rivertown',
      region: 'OH',
      phone: '(555) 201-4480',
      email: 'hello@rivertownplumbing.com',
      street: '118 Mill Street',
      postalCode: '44101',
      hours: ['Mo-Fr 07:00-18:00', 'Sa 08:00-14:00'],
      services: ['Leak and burst pipe repair', 'Water heaters', 'Drain cleaning', 'Bathroom remodels', 'Sump pumps', 'Gas lines'],
      palette: 'ocean',
      tagline: 'Family-run plumbers serving Rivertown and the valley since 2009.',
    },
    'rivertown-plumbing'
  ),
  'rosies-bakery': make(
    {
      name: 'Rosie’s Bakery',
      type: 'bakery',
      city: 'Portland',
      region: 'OR',
      phone: '(555) 310-2291',
      street: '2210 SE Division St',
      postalCode: '97202',
      hours: ['Tu-Fr 07:00-15:00', 'Sa-Su 07:00-14:00'],
      services: ['Country sourdough', 'Pastries and buns', 'Celebration cakes'],
      palette: 'sunset',
      tagline: 'Sourdough, cakes and good coffee on SE Division, baked every morning at five.',
    },
    'rosies-bakery'
  ),
  'salt-and-stone': make(
    {
      name: 'Salt & Stone',
      type: 'salon',
      city: 'Savannah',
      region: 'GA',
      phone: '(555) 406-7712',
      street: '31 Jones Street',
      postalCode: '31401',
      hours: ['Tu-Sa 10:00-19:00'],
      services: ['Cut and style', 'Lived-in color', 'Balayage'],
      palette: 'plum',
      tagline: 'Lived-in color and precise cuts on Jones Street, by appointment.',
    },
    'salt-and-stone'
  ),
}
