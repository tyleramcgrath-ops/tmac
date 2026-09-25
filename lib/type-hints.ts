// Words in a business name that give away the kind of business, so a law
// firm can't end up with a plumber's site by a slip of the dropdown.
const TYPE_HINTS: [RegExp, string][] = [
  [/\b(law|legal|attorneys?|lawyers?|esq)\b/i, 'lawyer'],
  [/plumb/i, 'plumber'],
  [/electric/i, 'electrician'],
  [/\b(hvac|heating|cooling|air ?conditioning)\b/i, 'hvac'],
  [/roof/i, 'roofer'],
  [/\b(landscap\w*|lawn|garden\w*)\b/i, 'landscaper'],
  [/\b(clean\w*|maids?)\b/i, 'cleaner'],
  [/\b(auto|mechanic\w*|garage|tires?)\b/i, 'autorepair'],
  [/\b(dental|dentist\w*|orthodont\w*)\b/i, 'dentist'],
  [/\b(salon|hair|barber\w*)\b/i, 'salon'],
  [/\b(bakery|bakes?|caf[eé]|coffee)\b/i, 'bakery'],
  [/\b(restaurant|grill|kitchen|bistro|diner|pizza\w*|tacos?)\b/i, 'restaurant'],
]
export function typeFromName(name: string): string | null {
  for (const [re, t] of TYPE_HINTS) if (re.test(name)) return t
  return null
}
