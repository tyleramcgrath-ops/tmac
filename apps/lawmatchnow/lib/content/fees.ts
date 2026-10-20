// The three common ways lawyers charge, in general terms. Shown on practice pages.
export const FEE_TYPES = [
  { key: 'contingency', name: 'Contingency fee', text: 'The lawyer is paid a percentage of what you recover, and usually nothing if you recover nothing. Common in injury, malpractice and some employment cases.' },
  { key: 'hourly', name: 'Hourly rate', text: 'You pay for the time the lawyer and staff spend on your case, often drawn from an upfront retainer. Common in family, business and criminal matters.' },
  { key: 'flat', name: 'Flat fee', text: 'One set price for a defined task, such as a simple will, an uncontested divorce or a routine filing. You know the cost up front.' },
] as const

/** Which fee types are most common for an area, so the matching cards can be marked. */
export const COMMON_FEES: Record<string, string[]> = {
  'personal-injury': ['contingency'], 'medical-malpractice': ['contingency'], 'wrongful-death': ['contingency'],
  'trucking-accidents': ['contingency'], 'workers-compensation': ['contingency'], 'social-security-disability': ['contingency'],
  'product-liability': ['contingency'], 'nursing-home-abuse': ['contingency'], 'class-action': ['contingency'],
  'criminal-defense': ['flat', 'hourly'], 'dui-dwi': ['flat', 'hourly'], 'drug-crimes': ['flat', 'hourly'],
  'family-law': ['hourly', 'flat'], 'immigration': ['flat', 'hourly'], 'bankruptcy': ['flat'],
  'estate-planning': ['flat', 'hourly'], 'business-law': ['hourly', 'flat'], 'real-estate': ['flat', 'hourly'],
  'employment-law': ['contingency', 'hourly'], 'tax-law': ['hourly', 'flat'],
}
