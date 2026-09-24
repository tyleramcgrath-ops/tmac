// The live example sites linked from saysites.com. They are built by the
// same starter code every customer gets, with fixed ids so they never change
// between deploys, and served from /preview/<subdomain>.

import type { Page, Site } from './schema'
import { buildStarterSite, type BusinessTypeKey } from './starter'

const NOW = '2026-09-24T00:00:00.000Z'
export const SHOWCASE_ORG = 'org_showcase'
const OWNER = SHOWCASE_ORG

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
  'field-and-thread': make(
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
  ),
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
