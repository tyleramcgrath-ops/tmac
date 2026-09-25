// The live example sites linked from saysites.com. They are built by the
// same starter code every customer gets, with fixed ids so they never change
// between deploys, and served from /preview/<subdomain>.

import { PHOTOS, unsplash } from './photos'
import { buildBlogIndex, buildPostPage } from './posts'
import type { Page, Product, Site } from './schema'
import { buildStarterSite, type BusinessTypeKey } from './starter'

const NOW = '2026-09-24T00:00:00.000Z'
export const SHOWCASE_ORG = 'org_showcase'
const OWNER = SHOWCASE_ORG

function make(input: Parameters<typeof buildStarterSite>[0], subdomain: string): { site: Site; pages: Page[] } {
  const demo = buildStarterSite(input, OWNER, subdomain, { siteId: `site_showcase_${subdomain.replace(/-/g, '_')}`, now: NOW })
  // Logos drawn by the same engine Sofie uses (scripts/showcase-logos.ts).
  demo.site.business = { ...demo.site.business, logo: `/media/logos/${subdomain}.svg`, icon: `/media/logos/${subdomain}-icon.svg` }
  return demo
}

// Gives an example site products and a Shop page, so the store can be seen
// working. No payment links: the buttons ask the visitor to get in touch.
function withShop(demo: { site: Site; pages: Page[] }, products: Product[], intro: string): { site: Site; pages: Page[] } {
  const { site, pages } = demo
  const shop: Page = {
    id: `${site.id}_shop`,
    siteId: site.id,
    slug: 'shop',
    name: 'Shop',
    status: 'published',
    seo: { title: `Shop ${site.business.name} online`.slice(0, 60), description: `${intro} Order online from ${site.business.name}.`.slice(0, 160) },
    body: [
      {
        id: 'shop',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: { desktop: { top: 88, right: 24, bottom: 96, left: 24 }, mobile: { top: 48, right: 20, bottom: 56, left: 20 } }, gap: { desktop: 14 } },
        children: [
          { id: 'shop-h', type: 'heading', level: 1, text: 'Shop', style: { fontSize: { desktop: 52, mobile: 36 } } },
          { id: 'shop-t', type: 'text', text: intro, style: { color: 'muted', fontSize: { desktop: 18 }, maxWidth: 560 } },
          { id: 'shop-products', type: 'products', style: { margin: { desktop: { top: 28, right: 0, bottom: 0, left: 0 } } } },
        ],
      },
    ],
    updatedAt: site.updatedAt,
  }
  return {
    site: { ...site, nav: [{ label: 'Shop', href: '/shop' }, ...site.nav], store: { currency: 'USD', products } },
    pages: [...pages, shop],
  }
}

// Gives an example site a blog with a few posts.
function withBlog(demo: { site: Site; pages: Page[] }, posts: { title: string; date: string; body: string; image?: { src: string; alt: string } }[]): { site: Site; pages: Page[] } {
  const { site, pages } = demo
  const fixed = (p: Page, slug: string): Page => ({ ...p, id: `${site.id}_${slug.replace(/\//g, '_')}`, updatedAt: site.updatedAt })
  const postPages = posts.map((p) => {
    const page = buildPostPage(site, p)
    return fixed(page, page.slug)
  })
  const nav = [...site.nav.filter((n) => n.href !== '/contact'), { label: 'Blog', href: '/blog' }, ...site.nav.filter((n) => n.href === '/contact')]
  return { site: { ...site, nav }, pages: [...pages, fixed(buildBlogIndex(site), 'blog'), ...postPages] }
}

const img = (id: string, alt: string) => ({ src: unsplash(id, alt, 800, 800).src, alt })

export const SHOWCASE: Record<string, { site: Site; pages: Page[] }> = {
  'rivertown-plumbing': withBlog(make(
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
  ), [
    {
      title: '5 signs your water heater is about to give out',
      date: '2026-09-10',
      image: { src: PHOTOS.plumber.cards[1].src, alt: PHOTOS.plumber.cards[1].alt },
      body: `Most water heaters last 8 to 12 years, and they usually warn you before they fail. Catching the signs early means you can replace it on your schedule instead of after a cold shower and a wet basement.

## 1. Rusty or muddy hot water
If only your hot water looks brown or orange, the inside of the tank may be corroding. Once the tank rusts through, a leak isn't far behind.

## 2. Rumbling and popping
Sediment settles at the bottom of the tank and hardens. When the burner heats it, you hear rumbling. Flushing can help if it's caught early; if it's been going on for years, the tank is working much harder than it should.

## 3. Water around the base
Even a small puddle is worth a look. Sometimes it's a loose fitting or the relief valve, which are easy fixes. If the tank itself is weeping, it needs replacing.

## 4. Hot water runs out faster
If showers are getting shorter, sediment may be taking up room in the tank or a heating element may be failing.

## 5. It's past its tenth birthday
The date is on the label on the side of the tank. Past ten years, it's worth planning for a replacement before it picks the day for you.

Not sure what you're looking at? Call us and describe it. We'll tell you honestly whether it's a repair or a replacement.`,
    },
    {
      title: 'What to do in the first ten minutes of a burst pipe',
      date: '2026-08-21',
      image: { src: PHOTOS.plumber.cards[0].src, alt: PHOTOS.plumber.cards[0].alt },
      body: `A burst pipe can put hundreds of gallons on the floor in an hour. What you do before the plumber arrives makes the biggest difference to the damage.

## Shut off the water
Find your main shutoff valve. It's usually where the water line enters the house: in the basement, a utility closet or near the water heater. Turn it clockwise until it stops. It's worth finding it today, before you need it.

## Turn off the electricity near the water
If water is near outlets, appliances or the electrical panel, switch off power to that area at the breaker, but only if you can reach the panel without standing in water.

## Open the taps
Open a cold tap at the lowest point in the house to drain the pipes and relieve pressure. Flush toilets to empty them too.

## Move things and take photos
Move what you can out of the water, and take photos of the damage for your insurer before you start cleaning up.

## Call us
Tell us what you've shut off and we'll tell you what to do next, and how soon we can be there.`,
    },
  ]),
  'rosies-bakery': withShop(make(
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
  ), [
    { id: 'p-sourdough', name: 'Country sourdough', price: 900, description: 'Our everyday loaf: long-fermented, crackly crust, open crumb.', image: img('1509440159596-0249088772ff', 'Sourdough loaves with wheat') },
    { id: 'p-pastry-box', name: 'Morning pastry box (6)', price: 2200, description: 'A mix of croissants, buns and whatever came out of the oven best that morning.', image: img('1579697096985-41fe1430e5df', 'Shelves of fresh bread and pastries') },
    { id: 'p-bread-share', name: 'Weekly bread share', price: 3200, description: 'Four loaves a month, a different bake each Saturday. Pick up at the shop.', image: img('1566698629409-787a68fc5724', 'A basket of bread on a dark table') },
    { id: 'p-cake', name: 'Celebration cake', price: 5200, description: 'Serves 12. Tell us the flavor and message when you order.' },
  ], 'Order bread, pastries and cakes for pickup on SE Division.'),
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
  'northside-electric': make(
    {
      name: 'Northside Electric',
      type: 'electrician',
      city: 'Denver',
      region: 'CO',
      phone: '(555) 303-0188',
      street: '400 Blake Street',
      postalCode: '80205',
      hours: ['Mo-Fr 07:00-17:00'],
      services: ['Panel upgrades', 'EV charger installs', 'Lighting and fans', 'Whole-home rewiring', 'Generators', 'Safety inspections'],
      palette: 'slate',
      tagline: 'Licensed electricians keeping Denver homes safe, tidy and up to code.',
    },
    'northside-electric'
  ),
  'summit-heating-air': make(
    {
      name: 'Summit Heating & Air',
      type: 'hvac',
      city: 'Boise',
      region: 'ID',
      phone: '(555) 208-4410',
      street: '1290 W Main Street',
      postalCode: '83702',
      hours: ['Mo-Fr 07:00-18:00', 'Sa 08:00-12:00'],
      services: ['Furnace repair', 'AC installation', 'Heat pumps', 'Duct cleaning', 'Maintenance plans', 'Thermostats'],
      palette: 'ocean',
      tagline: 'Comfortable homes across the Treasure Valley, winter and summer.',
    },
    'summit-heating-air'
  ),
  'ridgeline-roofing': make(
    {
      name: 'Ridgeline Roofing',
      type: 'roofer',
      city: 'Knoxville',
      region: 'TN',
      phone: '(555) 865-2201',
      street: '77 Emory Road',
      postalCode: '37918',
      hours: ['Mo-Sa 07:00-17:00'],
      services: ['Roof replacement', 'Storm damage repair', 'Gutters', 'Free inspections'],
      palette: 'slate',
      tagline: 'Roofs built to outlast the weather, with a 25-year workmanship warranty.',
    },
    'ridgeline-roofing'
  ),
  'green-acre-landscapes': make(
    {
      name: 'Green Acre Landscapes',
      type: 'landscaper',
      city: 'Raleigh',
      region: 'NC',
      phone: '(555) 919-3302',
      street: '5 Oak Park Drive',
      postalCode: '27607',
      hours: ['Mo-Fr 07:00-17:00'],
      services: ['Lawn care', 'Garden design', 'Patios and paths', 'Seasonal cleanups'],
      palette: 'forest',
      tagline: 'Lawns, gardens and patios that make Raleigh neighbors slow down.',
    },
    'green-acre-landscapes'
  ),
  'bright-and-tidy': make(
    {
      name: 'Bright & Tidy Cleaning',
      type: 'cleaner',
      city: 'Austin',
      region: 'TX',
      phone: '(555) 512-7780',
      hours: ['Mo-Sa 08:00-18:00'],
      services: ['Weekly home cleaning', 'Deep cleans', 'Move-in and move-out', 'Office cleaning'],
      palette: 'ocean',
      tagline: 'Insured, background-checked cleaners. Same team every visit.',
    },
    'bright-and-tidy'
  ),
  'harbor-auto': make(
    {
      name: 'Harbor Auto Repair',
      type: 'autorepair',
      city: 'Tacoma',
      region: 'WA',
      phone: '(555) 253-9914',
      street: '2101 Pacific Avenue',
      postalCode: '98402',
      hours: ['Mo-Fr 08:00-18:00', 'Sa 09:00-14:00'],
      services: ['Brakes', 'Oil changes', 'Engine diagnostics', 'Tires and alignment', 'State inspections'],
      palette: 'slate',
      tagline: 'Honest repairs, straight answers and a written quote before we start.',
    },
    'harbor-auto'
  ),
  'willow-dental': make(
    {
      name: 'Willow Dental',
      type: 'dentist',
      city: 'Madison',
      region: 'WI',
      phone: '(555) 608-4120',
      street: '18 S Pinckney Street',
      postalCode: '53703',
      hours: ['Mo-Th 08:00-17:00', 'Fr 08:00-13:00'],
      services: ['Checkups and cleanings', 'Teeth whitening', 'Invisalign', 'Crowns'],
      palette: 'forest',
      tagline: 'Gentle, modern dentistry for the whole family, a block from the Capitol.',
    },
    'willow-dental'
  ),
  'olive-and-ember': make(
    {
      name: 'Olive & Ember',
      type: 'restaurant',
      city: 'Asheville',
      region: 'NC',
      phone: '(555) 828-6604',
      street: '12 Wall Street',
      postalCode: '28801',
      hours: ['We-Su 17:00-22:00'],
      services: ['Wood-fired dinners', 'Private dining', 'Weekend brunch'],
      palette: 'sunset',
      tagline: 'Wood-fired Mediterranean cooking and natural wine in downtown Asheville.',
    },
    'olive-and-ember'
  ),
  'hale-and-porter': make(
    {
      name: 'Hale & Porter Law',
      type: 'lawyer',
      city: 'Columbus',
      region: 'OH',
      phone: '(555) 614-2290',
      street: '250 E Broad Street',
      postalCode: '43215',
      hours: ['Mo-Fr 08:30-17:30'],
      services: ['Estate planning', 'Family law', 'Real estate closings', 'Small business law'],
      palette: 'slate',
      tagline: 'Clear, practical legal help for Ohio families and small businesses.',
    },
    'hale-and-porter'
  ),
  'field-and-thread': withShop(make(
    {
      name: 'Field & Thread',
      type: 'store',
      city: 'Burlington',
      region: 'VT',
      phone: '(555) 802-1175',
      street: '96 Church Street',
      postalCode: '05401',
      hours: ['Mo-Sa 10:00-18:00', 'Su 11:00-16:00'],
      services: ['Everyday clothing', 'Local makers', 'Gifts and cards'],
      palette: 'forest',
      tagline: 'Well-made clothing and gifts from Vermont makers, on Church Street.',
    },
    'field-and-thread'
  ), [
    { id: 'p-flannel', name: 'Heavy flannel shirt', price: 8800, description: 'Brushed cotton flannel, cut in Vermont. Warm enough for October mornings.', image: img('1573612664822-d7d347da7b80', 'Clothes on a rack beside a wooden table') },
    { id: 'p-tee', name: 'Everyday organic tee', price: 3400, description: 'Heavyweight organic cotton in six colors. The one you reach for first.', image: img('1441984904996-e0b6ba687e04', 'Boutique clothing racks') },
    { id: 'p-card', name: 'Letterpress card set', price: 1800, description: 'Six cards and envelopes, printed a mile from the shop.' },
    { id: 'p-scarf', name: 'Merino scarf', price: 6400, description: 'Soft, warm and knit in New England.', soldOut: true },
  ], 'Clothing and gifts from Vermont makers, shipped or ready for pickup on Church Street.'),
}

// How the gallery groups and describes each example.
export const SHOWCASE_INFO: Record<string, { type: BusinessTypeKey; kind: string; place: string }> = {
  'rivertown-plumbing': { type: 'plumber', kind: 'Plumber', place: 'Rivertown, OH' },
  'northside-electric': { type: 'electrician', kind: 'Electrician', place: 'Denver, CO' },
  'summit-heating-air': { type: 'hvac', kind: 'Heating & air', place: 'Boise, ID' },
  'ridgeline-roofing': { type: 'roofer', kind: 'Roofer', place: 'Knoxville, TN' },
  'green-acre-landscapes': { type: 'landscaper', kind: 'Landscaping', place: 'Raleigh, NC' },
  'bright-and-tidy': { type: 'cleaner', kind: 'Cleaning', place: 'Austin, TX' },
  'harbor-auto': { type: 'autorepair', kind: 'Auto repair', place: 'Tacoma, WA' },
  'salt-and-stone': { type: 'salon', kind: 'Hair salon', place: 'Savannah, GA' },
  'willow-dental': { type: 'dentist', kind: 'Dentist', place: 'Madison, WI' },
  'hale-and-porter': { type: 'lawyer', kind: 'Law firm', place: 'Columbus, OH' },
  'rosies-bakery': { type: 'bakery', kind: 'Bakery', place: 'Portland, OR' },
  'olive-and-ember': { type: 'restaurant', kind: 'Restaurant', place: 'Asheville, NC' },
  'field-and-thread': { type: 'store', kind: 'Shop', place: 'Burlington, VT' },
}
