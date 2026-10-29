// The colours a new site starts with, by kind of business, so a salon, a
// restaurant and a plumber don't all open in the same navy. The owner can
// pick any palette (lib/starter PALETTES). Small on purpose: the new-site
// wizard imports it on the client.
export const TYPE_PALETTE: Record<string, string> = {
  plumber: 'ocean', electrician: 'electric', hvac: 'ocean', roofer: 'oxblood', landscaper: 'forest', cleaner: 'forest', autorepair: 'slate',
  dentist: 'ocean', salon: 'plum', lawyer: 'oxblood', doctor: 'ocean', medspa: 'plum', restaurant: 'sunset', bakery: 'sunset', store: 'slate', professional: 'slate', other: 'forest',
}
