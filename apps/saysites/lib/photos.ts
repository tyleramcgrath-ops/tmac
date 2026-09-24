// Starter photography for each kind of business: one hero and three card
// photos, all free-license Unsplash images (free for commercial use, no
// attribution required). The renderer asks Unsplash for the right size per
// screen via srcset. Owners replace these with their own photos later.

export interface Photo {
  src: string
  alt: string
  width: number
  height: number
}

export interface PhotoSet {
  hero: Photo
  cards: [Photo, Photo, Photo]
}

export function unsplash(id: string, alt: string, width = 1600, height = 1067): Photo {
  return { src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=70&w=${width}`, alt, width, height }
}

const set = (hero: [string, string], cards: [string, string][]): PhotoSet => ({
  hero: unsplash(hero[0], hero[1], 2000, 1333),
  cards: cards.slice(0, 3).map(([id, alt]) => unsplash(id, alt, 800, 600)) as [Photo, Photo, Photo],
})

export const PHOTOS: Record<string, PhotoSet> = {
  plumber: set(['1749532125405-70950966b0e5', 'Plumber repairing plumbing in a bathroom'], [
    ['1676210134188-4c05dd172f89', 'Plumber working on a pipe inside a wall'],
    ['1676210134190-3f2c0d5cf58d', 'Plumber fixing a water heater'],
    ['1650551182991-b07558247564', 'Water pipes and valves in a utility room'],
  ]),
  electrician: set(['1621905251189-08b45d6a269e', 'Electrician in a hard hat installing wiring'], [
    ['1758101755915-462eddc23f57', 'Electrician testing an electrical panel with a multimeter'],
    ['1660330589693-99889d60181e', 'Electrician using a screwdriver on an electrical panel'],
    ['1635335874521-7987db781153', 'Wires connected inside a switch box'],
  ]),
  hvac: set(['1785682118449-21da8825754d', 'Technician on a lift installing ceiling components'], [
    ['1718203862467-c33159fdc504', 'Outdoor air conditioner unit beside a brick wall'],
    ['1774290331891-5d759056c68d', 'Row of heating and cooling units on a rooftop'],
    ['1762341123870-d706f257a12e', 'Wall-mounted air conditioner'],
  ]),
  roofer: set(['1643225523483-e2c434191bba', 'Roofer carrying shingles across a residential roof'], [
    ['1633759593085-1eaeb724fc88', 'Roofer removing old shingles from a house roof'],
    ['1763665814538-8ba04597286c', 'Workers installing roof tiles on a new building'],
    ['1635424709961-f3a150459ad4', 'Two roofers working on the roof of a house'],
  ]),
  landscaper: set(['1734303023491-db8037a21f09', 'Landscaper mowing a lawn'], [
    ['1734079692079-aae7e24a7035', 'Hands pressing fresh sod into soil'],
    ['1700689807667-82630348b301', 'Brick garden path lined with flowers and trees'],
    ['1738193830098-2d92352a1856', 'House with a neat lawn and landscaped beds'],
  ]),
  cleaner: set(['1758273705627-937374bfa978', 'Cleaner vacuuming a bright living room'], [
    ['1563453392212-326f5e854473', 'Hand holding a cleaning spray bottle'],
    ['1758273705723-26ef454252ce', 'Cleaner in gloves wiping a table'],
    ['1758273238415-01ec03d9ef27', 'Cleaner mopping a living room floor'],
  ]),
  dentist: set(['1777331903190-341a3dd0441b', 'Dentist talking with a patient in a modern office'], [
    ['1629909613654-28e377c37b09', 'Modern dental treatment room'],
    ['1643660526741-094639fbe53a', 'Dental chair in a calm treatment room'],
    ['1629909614456-6b1c5c94cecc', 'Waiting area with a couch and a plant'],
  ]),
  salon: set(['1634449571010-02389ed0f9b0', 'Hair stylist cutting a client’s hair'], [
    ['1580618672591-eb180b1a973f', 'Stylist blow-drying a client’s hair'],
    ['1633681926022-84c23e8cb2d6', 'Modern salon with black chairs and round mirrors'],
    ['1717160675489-7779f2c91999', 'Client having her hair washed at a salon sink'],
  ]),
  restaurant: set(['1538334421852-687c439c92f4', 'Warm restaurant dining room with wooden tables'], [
    ['1622021142947-da7dedc7c39a', 'Chef chopping vegetables in a restaurant kitchen'],
    ['1622115837997-90c89ae689f9', 'A plated dish'],
    ['1600891964599-f61ba0e24092', 'Appetizers and drinks on a table'],
  ]),
  bakery: set(['1509440159596-0249088772ff', 'Freshly baked sourdough loaves with wheat'], [
    ['1579697096985-41fe1430e5df', 'Shelves of fresh bread and pastries'],
    ['1566698629409-787a68fc5724', 'A basket of bread on a dark table'],
    ['1567042661848-7161ce446f85', 'Hands holding a stack of country loaves'],
  ]),
  lawyer: set(['1758518731462-d091b0b4ed0d', 'Lawyer and clients signing a contract'], [
    ['1589994965851-a8f479c573a9', 'Statue of Lady Justice holding scales'],
    ['1562564055-71e051d33c19', 'Client signing legal documents'],
    ['1571055931484-22dce9d6c510', 'Conference room with chairs around a table'],
  ]),
  autorepair: set(['1727893119356-1702fe921cf9', 'Mechanics working on cars in a bright workshop'], [
    ['1625047509248-ec889cbff17f', 'Mechanic inspecting a car engine'],
    ['1619642751034-765dfdf7c58e', 'Hands using a wrench on an engine'],
    ['1645445522156-9ac06bc7a767', 'Mechanic working on a tire'],
  ]),
  store: set(['1441986300917-64674bd600d8', 'Inviting clothing store interior'], [
    ['1441984904996-e0b6ba687e04', 'Boutique clothing racks'],
    ['1573612664822-d7d347da7b80', 'Clothes on a rack beside a wooden table'],
    ['1758520387635-d290a74d3aee', 'Shoppers looking at a store window display'],
  ]),
  other: set(['1687422808248-f807f4ea2a2e', 'Small business owner in their shop'], [
    ['1546213290-e1b492ab3eee', 'Customer browsing inside a small shop'],
    ['1509440159596-0249088772ff', 'Fresh local goods on display'],
    ['1758274251589-fb70a3654a1b', 'Customers with shopping bags on a sidewalk'],
  ]),
}

export function photosFor(type: string): PhotoSet {
  return PHOTOS[type] ?? PHOTOS.other
}
