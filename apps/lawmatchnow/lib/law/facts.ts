// State law facts, researched per state with a citation and source for each.
// Only facts marked verified are ever shown; anything uncertain stays out.

import carAccident from './data/car-accident.json'
import damagesBar from './data/damages-bar.json'
import divorce from './data/divorce.json'
import dui from './data/dui.json'
import employment from './data/employment.json'
import smallClaims from './data/small-claims.json'
import solCivil from './data/sol-civil.json'
import solInjury from './data/sol-injury.json'
import wills from './data/wills.json'

export type Fact = {
  value: string | null
  years?: number | null
  detail?: string
  cite?: string
  source?: string
  verified?: boolean
  note?: string
}

type Dataset = { researchedOn: string; states: Record<string, Record<string, Fact>> }

const DATA: Record<string, Dataset> = {
  'sol-injury': solInjury as Dataset,
  'sol-civil': solCivil as Dataset,
  'car-accident': carAccident as Dataset,
  divorce: divorce as Dataset,
  dui: dui as Dataset,
  'small-claims': smallClaims as Dataset,
  wills: wills as Dataset,
  employment: employment as Dataset,
  'damages-bar': damagesBar as Dataset,
}

/** What each fact is, for table labels and FAQ wording. */
export const FIELDS = {
  'sol-injury.personalInjury': { label: 'Personal injury', ask: 'deadline to file a personal injury lawsuit' },
  'sol-injury.wrongfulDeath': { label: 'Wrongful death', ask: 'deadline to file a wrongful death lawsuit' },
  'sol-injury.medicalMalpractice': { label: 'Medical malpractice', ask: 'deadline to file a medical malpractice lawsuit' },
  'sol-injury.propertyDamage': { label: 'Property damage', ask: 'deadline to sue for damage to property' },
  'sol-civil.writtenContract': { label: 'Written contracts', ask: 'deadline to sue over a written contract' },
  'sol-civil.oralContract': { label: 'Oral contracts', ask: 'deadline to sue over an oral contract' },
  'sol-civil.fraud': { label: 'Fraud', ask: 'deadline to sue for fraud' },
  'sol-civil.defamation': { label: 'Defamation (libel and slander)', ask: 'deadline to sue for defamation' },
  'sol-civil.debtCollection': { label: 'Debt collection', ask: 'deadline for a creditor to sue on a debt' },
  'car-accident.faultSystem': { label: 'Insurance system', ask: 'car insurance system' },
  'car-accident.negligenceRule': { label: 'Shared-fault rule', ask: 'rule when both sides share fault' },
  'car-accident.minimumLiability': { label: 'Minimum liability insurance', ask: 'minimum car insurance' },
  'car-accident.pipRequired': { label: 'Personal injury protection (PIP)', ask: 'PIP requirement' },
  'car-accident.uninsuredMotorist': { label: 'Uninsured motorist coverage', ask: 'uninsured motorist coverage rule' },
  'car-accident.accidentReport': { label: 'Reporting a crash', ask: 'crash reporting requirement' },
  'divorce.residency': { label: 'Residency to file', ask: 'residency requirement for divorce' },
  'divorce.waitingPeriod': { label: 'Waiting period', ask: 'waiting period for a divorce' },
  'divorce.grounds': { label: 'Grounds', ask: 'grounds for divorce' },
  'divorce.propertyDivision': { label: 'Property division', ask: 'way property is divided in a divorce' },
  'divorce.childSupportGuidelines': { label: 'Child support model', ask: 'child support guideline model' },
  'divorce.legalSeparation': { label: 'Legal separation', ask: 'availability of legal separation' },
  'dui.name': { label: 'Name of the offense', ask: 'name for drunk driving' },
  'dui.bacLimit': { label: 'Legal limit (21+)', ask: 'legal blood alcohol limit' },
  'dui.under21': { label: 'Limit under 21', ask: 'blood alcohol limit for drivers under 21' },
  'dui.commercial': { label: 'Commercial drivers', ask: 'blood alcohol limit for commercial drivers' },
  'dui.refusalSuspension': { label: 'Refusing a breath or blood test (first time)', ask: 'license suspension for refusing a chemical test' },
  'dui.interlockFirstOffense': { label: 'Ignition interlock, first offense', ask: 'ignition interlock rule for a first offense' },
  'dui.lookback': { label: 'Look-back period for repeat offenses', ask: 'look-back period for prior DUIs' },
  'small-claims.smallClaimsLimit': { label: 'Small claims limit', ask: 'small claims limit' },
  'small-claims.smallClaimsCourt': { label: 'Court that hears small claims', ask: 'court that hears small claims' },
  'small-claims.lawyersAllowed': { label: 'Lawyers in small claims', ask: 'rule on lawyers in small claims court' },
  'small-claims.securityDepositReturn': { label: 'Security deposit return deadline', ask: 'deadline for a landlord to return a security deposit' },
  'small-claims.securityDepositCap': { label: 'Security deposit limit', ask: 'limit on security deposits' },
  'wills.witnesses': { label: 'Witnesses for a will', ask: 'number of witnesses a will needs' },
  'wills.holographic': { label: 'Handwritten (holographic) wills', ask: 'rule on handwritten wills' },
  'wills.selfProving': { label: 'Self-proving affidavit', ask: 'rule on self-proving wills' },
  'wills.smallEstate': { label: 'Small estate threshold', ask: 'small estate limit for skipping full probate' },
  'wills.estateTax': { label: 'State estate or inheritance tax', ask: 'state estate or inheritance tax' },
  'wills.electronicWills': { label: 'Electronic wills', ask: 'rule on electronic wills' },
  'employment.minimumWage': { label: 'Minimum wage', ask: 'minimum wage' },
  'employment.tippedWage': { label: 'Tipped minimum cash wage', ask: 'minimum cash wage for tipped workers' },
  'employment.fairEmploymentAgency': { label: 'Agency for discrimination complaints', ask: 'agency that handles job discrimination complaints' },
  'employment.discriminationDeadline': { label: 'Deadline to file a discrimination charge', ask: 'deadline to file a job discrimination charge' },
  'employment.wcInjuryNotice': { label: 'Tell your employer within', ask: 'deadline to report a work injury to your employer' },
  'employment.wcClaimDeadline': { label: 'File a workers’ comp claim within', ask: 'deadline to file a workers’ compensation claim' },
  'employment.wcAgency': { label: 'Workers’ comp agency', ask: 'workers’ compensation agency' },
  'damages-bar.medMalCap': { label: 'Cap on non-economic damages (malpractice)', ask: 'cap on pain-and-suffering damages in malpractice cases' },
  'damages-bar.meritRequirement': { label: 'Before suing for malpractice', ask: 'pre-suit requirement for malpractice cases' },
  'damages-bar.punitiveCap': { label: 'Punitive damages', ask: 'limit on punitive damages' },
  'damages-bar.jointSeveral': { label: 'Joint and several liability', ask: 'rule on joint and several liability' },
  'damages-bar.barName': { label: 'Licensing body', ask: 'body that licenses lawyers' },
  'damages-bar.lawyerLookup': { label: 'Check a lawyer’s license', ask: 'way to check a lawyer’s license' },
  'damages-bar.barReferral': { label: 'Bar lawyer referral service', ask: 'state bar lawyer referral service' },
} as const

export type FieldKey = keyof typeof FIELDS

/** A verified fact, or null. */
export function fact(state: string, key: FieldKey): Fact | null {
  const [set, field] = key.split('.')
  const f = DATA[set]?.states[state]?.[field]
  return f && f.verified === true && f.value ? f : null
}

/** When each dataset was researched, for "last reviewed" dates. */
export const researchedOn = (key: FieldKey) => DATA[key.split('.')[0]]?.researchedOn ?? '2026-10-20'

/** Every state's verified value for one fact (for 50-state tables and comparisons). */
export function allStates(key: FieldKey) {
  return Object.keys(DATA[key.split('.')[0]]?.states ?? {})
    .map((code) => ({ code, f: fact(code, key) }))
    .filter((r): r is { code: string; f: Fact } => r.f !== null)
}
