// Free calculators built on the verified state law facts. Each tool turns one
// or two cited rules into an answer for the reader's own dates and numbers.
// A rule is only computed when its value is a plain duration or amount; when
// a state's rule has conditions, we show the rule and its citation instead.

import { type State, STATES } from '@/lib/geo'
import { type Fact, type FieldKey, fact } from './facts'

export type Dur = { n: number; unit: 'years' | 'months' | 'days' | 'bdays' | 'hours' }

/** A cited rule, ready to send to the browser. */
export type Rule = {
  key: string
  label: string
  value: string
  detail?: string
  cite?: string
  source?: string
  /** Set only when the rule is a plain duration we can count from a date. */
  dur: Dur | null
  start: string
  hint?: string
}

export type FaultRule = 'pure' | 'bar51' | 'bar50' | 'contributory' | 'slight'

export type ToolData =
  | { kind: 'deadline'; mode: 'pick' | 'all'; rules: Rule[]; capMonths?: number | null; cap?: Rule | null }
  | { kind: 'fault'; rule: FaultRule; fact: Rule; joint?: Rule | null }
  | { kind: 'smallclaims'; limit: number | null; fact: Rule; court?: Rule | null; lawyers?: Rule | null }
  | { kind: 'wage'; min: number | null; tipped: number | null; tipCredit: boolean; fact: Rule; tippedFact?: Rule | null }

// What may follow a duration and still be a plain, countable rule.
const PLAIN_TAIL = /^(|from (the )?(injury|discovery|death)|\((EEOC|federal|discovery rule|standard)\))$/i

export function parseDur(value: string): Dur | null {
  const m = value.trim().match(/^(\d+(?:\.\d+)?)\s+(business days?|years?|months?|days?|hours?)\s*(.*)$/i)
  if (!m || !PLAIN_TAIL.test(m[3].trim())) return null
  const u = m[2].toLowerCase()
  const unit = u.startsWith('business') ? 'bdays' : u.startsWith('year') ? 'years' : u.startsWith('month') ? 'months' : u.startsWith('day') ? 'days' : 'hours'
  return { n: Number(m[1]), unit }
}

const money = (value: string) => {
  const m = value.match(/^\$([\d,]+(?:\.\d+)?)/)
  return m ? Number(m[1].replace(/,/g, '')) : null
}

function rule(code: string, key: FieldKey, label: string, start: string, hint?: string, countable = true): Rule | null {
  const f: Fact | null = fact(code, key)
  if (!f?.value) return null
  return {
    key, label, value: f.value, detail: f.detail, cite: f.cite, source: f.source,
    dur: countable ? parseDur(f.value) : null, start, ...(hint ? { hint } : {}),
  }
}

export type Faq = { q: string; a: string }

export type Tool = {
  slug: string
  name: string
  /** Short line for cards. */
  blurb: string
  icon: string
  heading: (s: State) => string
  title: (s: State) => string
  description: (s: State, d: ToolData) => string
  data: (code: string) => ToolData | null
  /** Plain-English answer for the top of the state page. */
  answer: (s: State, d: ToolData) => string
  faqs: (s: State, d: ToolData) => Faq[]
  how: string[]
  practice: string
  topic?: string
  related: { label: string; href: (s: State) => string }[]
}

const lc = (v: string) => v.charAt(0).toLowerCase() + v.slice(1)
const cite = (r?: Rule | null) => (r?.cite ? ` (${r.cite})` : '')
const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 })}`

function faultRule(value: string): FaultRule | null {
  if (/^pure/i.test(value)) return 'pure'
  if (/51%/.test(value)) return 'bar51'
  if (/50%/.test(value)) return 'bar50'
  if (/^contributory/i.test(value)) return 'contributory'
  if (/slight/i.test(value)) return 'slight'
  return null
}

export const FAULT_TEXT: Record<FaultRule, string> = {
  pure: 'pure comparative fault: you can recover even if you were mostly at fault, minus your share',
  bar51: 'modified comparative fault with a 51% bar: you recover, minus your share, as long as you were not 51% or more at fault',
  bar50: 'modified comparative fault with a 50% bar: you recover, minus your share, only if you were less than 50% at fault',
  contributory: 'contributory negligence: if you were even slightly at fault, you generally recover nothing',
  slight: 'the slight/gross negligence rule: you recover only if your fault was slight compared with the other side’s',
}

const SOL_CLAIMS: [FieldKey, string, string, string?][] = [
  ['sol-injury.personalInjury', 'Personal injury', 'Date of the injury', 'Some states start the clock when you discovered the injury; when in doubt, count from the date it happened.'],
  ['sol-injury.medicalMalpractice', 'Medical malpractice', 'Date of the malpractice or when you discovered it', 'Malpractice deadlines often have discovery rules and an outer limit (statute of repose). Count from the earliest date that could apply.'],
  ['sol-injury.wrongfulDeath', 'Wrongful death', 'Date of death', 'Most states start the clock on the date of death; a few count from the injury.'],
  ['sol-injury.propertyDamage', 'Property damage', 'Date of the damage'],
  ['sol-civil.writtenContract', 'Written contract', 'Date the contract was broken'],
  ['sol-civil.oralContract', 'Oral contract', 'Date the contract was broken'],
  ['sol-civil.fraud', 'Fraud', 'Date you discovered the fraud'],
  ['sol-civil.defamation', 'Defamation', 'Date the statement was published'],
]

export const TOOLS: Tool[] = [
  {
    slug: 'statute-of-limitations-calculator',
    name: 'Statute of limitations calculator',
    blurb: 'Find the last day to file a lawsuit, counted from your own date, with the statute cited.',
    icon: '⏳',
    heading: (s) => `${s.name} Statute of Limitations Calculator`,
    title: (s) => `${s.name} Statute of Limitations Calculator: Find Your Filing Deadline`,
    description: (s, d) => {
      const pi = d.kind === 'deadline' ? d.rules.find((r) => r.key === 'sol-injury.personalInjury') : null
      return `Calculate your deadline to sue in ${s.name}.${pi ? ` Personal injury: ${pi.value}.` : ''} Pick your claim, enter the date, and get the last day to file, with the ${s.name} statute cited.`
    },
    data: (code) => {
      const rules = SOL_CLAIMS.map(([k, l, st, h]) => rule(code, k, l, st, h)).filter((r): r is Rule => !!r)
      return rules.length ? { kind: 'deadline', mode: 'pick', rules } : null
    },
    answer: (s, d) => {
      const r = d.kind === 'deadline' ? d.rules : []
      const pi = r.find((x) => x.key === 'sol-injury.personalInjury')
      const wc = r.find((x) => x.key === 'sol-civil.writtenContract')
      return `In ${s.name}, you generally have ${pi ? `${pi.value} to file a personal injury lawsuit${cite(pi)}` : 'a fixed time to file'}${wc ? ` and ${lc(wc.value)} to sue over a written contract${cite(wc)}` : ''}. Pick your type of claim below to count the deadline from your own date.`
    },
    faqs: (s, d) => {
      const r = d.kind === 'deadline' ? d.rules : []
      const out: Faq[] = r.slice(0, 5).map((x) => ({ q: `What is the statute of limitations for ${x.label.toLowerCase()} in ${s.name}?`, a: `${x.value}${cite(x)}. ${x.detail ?? ''}`.trim() }))
      out.push({ q: `What happens if I miss the deadline in ${s.name}?`, a: `The court will almost always dismiss a lawsuit filed after the statute of limitations runs out, no matter how strong the case. Exceptions (such as for minors or when the defendant left the state) are narrow, so treat the date as final and talk to a ${s.name} lawyer well before it.` })
      out.push({ q: 'Does the calculator account for exceptions?', a: 'No. It counts the basic period from the date you enter. Discovery rules, tolling for minors or disability, notice-of-claim rules for government defendants and statutes of repose can shorten or extend the time. Use the result as a warning date, not a promise.' })
      return out
    },
    how: [
      'A statute of limitations is the deadline to file a lawsuit. It starts on a set event, usually the date of the injury or the broken promise, and runs for a fixed number of years set by state law.',
      'Pick your type of claim, enter the date the clock started, and the calculator adds the period from the cited statute to give the last day to file and how many days are left.',
      'Claims against a city, county or state agency often need a written notice within months, far sooner than the lawsuit deadline. If a government vehicle, employee or property was involved, talk to a lawyer right away.',
    ],
    practice: 'personal-injury',
    topic: 'statute-of-limitations',
    related: [
      { label: 'Statute of limitations guide', href: (s) => `/state/${s.slug}/statute-of-limitations` },
      { label: 'Personal injury laws', href: (s) => `/state/${s.slug}/personal-injury-laws` },
    ],
  },
  {
    slug: 'comparative-fault-calculator',
    name: 'Comparative fault calculator',
    blurb: 'Partly to blame for an accident? See what your state’s fault rule lets you recover.',
    icon: '⚖️',
    heading: (s) => `${s.name} Comparative Fault Calculator`,
    title: (s) => `${s.name} Comparative Negligence Calculator: What If You Were Partly at Fault?`,
    description: (s, d) => `${s.name} uses ${d.kind === 'fault' ? lc(d.fact.value) : 'a shared-fault rule'}. Enter your damages and your share of fault to see what you could still recover, with the ${s.name} law cited.`,
    data: (code) => {
      const r = rule(code, 'car-accident.negligenceRule', 'Shared-fault rule', '', undefined, false)
      const fr = r && faultRule(r.value)
      if (!r || !fr) return null
      return { kind: 'fault', rule: fr, fact: r, joint: rule(code, 'damages-bar.jointSeveral', 'Joint and several liability', '', undefined, false) }
    },
    answer: (s, d) => d.kind === 'fault' ? `${s.name} follows ${FAULT_TEXT[d.rule]}${cite(d.fact)}.` : '',
    faqs: (s, d) => {
      if (d.kind !== 'fault') return []
      const ex = (f: number) => {
        const got = recovery(d.rule, 100000, f)
        return got === null ? 'depends on how a jury compares the two sides’ fault' : got === 0 ? 'nothing' : usd(got)
      }
      return [
        { q: `Can I recover damages in ${s.name} if I was partly at fault?`, a: `${s.name} follows ${FAULT_TEXT[d.rule]}${cite(d.fact)}. ${d.fact.detail ?? ''}`.trim() },
        { q: `If I was 30% at fault and my damages are $100,000, what do I get in ${s.name}?`, a: `Under ${s.name}’s rule you would recover ${ex(30)}. This is before insurance limits, liens and fees.` },
        { q: `What if I was 50% at fault in ${s.name}?`, a: `With $100,000 in damages and 50% fault, you would recover ${ex(50)} under ${s.name}’s rule.` },
        { q: 'Who decides the fault percentages?', a: 'Insurance adjusters estimate them during settlement talks; at trial, the jury (or judge) assigns each side a percentage. Evidence such as the police report, photos, witnesses and vehicle data drives those numbers, which is why a lawyer’s early investigation matters.' },
      ]
    },
    how: [
      'When more than one person is to blame for an accident, each state uses a rule to decide whether the injured person can still recover and how much.',
      'Enter your total damages (medical bills, lost pay, repairs, and pain and suffering) and the percentage of fault you think could be assigned to you. The calculator applies your state’s rule.',
      'Insurers often push a higher share of blame onto the injured person, because every point lowers what they pay. In a 50% or 51% bar state, or a contributory negligence state, a few points can decide the whole claim.',
    ],
    practice: 'personal-injury',
    topic: 'personal-injury-laws',
    related: [
      { label: 'Personal injury laws', href: (s) => `/state/${s.slug}/personal-injury-laws` },
      { label: 'Car accident laws', href: (s) => `/state/${s.slug}/car-accident-laws` },
    ],
  },
  {
    slug: 'small-claims-checker',
    name: 'Small claims checker',
    blurb: 'Can your case go to small claims court? Check the limit and how the court works.',
    icon: '🏛️',
    heading: (s) => `${s.name} Small Claims Court Checker`,
    title: (s) => `${s.name} Small Claims Limit: Can You Sue in Small Claims Court?`,
    description: (s, d) => `${d.kind === 'smallclaims' ? `${s.name}’s small claims limit is ${d.fact.value}. ` : ''}Enter the amount you are owed to see whether your case fits ${s.name} small claims court, which court hears it and whether lawyers are allowed.`,
    data: (code) => {
      const r = rule(code, 'small-claims.smallClaimsLimit', 'Small claims limit', '', undefined, false)
      if (!r) return null
      return {
        kind: 'smallclaims', limit: money(r.value), fact: r,
        court: rule(code, 'small-claims.smallClaimsCourt', 'Court', '', undefined, false),
        lawyers: rule(code, 'small-claims.lawyersAllowed', 'Lawyers allowed', '', undefined, false),
      }
    },
    answer: (s, d) => d.kind === 'smallclaims' ? `In ${s.name}, you can sue for up to ${d.fact.value} in small claims court${cite(d.fact)}${d.court ? `, which is heard by the ${d.court.value.replace(/^the /i, '')}` : ''}.` : '',
    faqs: (s, d) => {
      if (d.kind !== 'smallclaims') return []
      const out: Faq[] = [{ q: `What is the small claims limit in ${s.name}?`, a: `${d.fact.value}${cite(d.fact)}. ${d.fact.detail ?? ''}`.trim() }]
      if (d.lawyers) out.push({ q: `Can I bring a lawyer to small claims court in ${s.name}?`, a: `${d.lawyers.value}${cite(d.lawyers)}. ${d.lawyers.detail ?? ''}`.trim() })
      out.push({ q: 'What if I am owed more than the limit?', a: `You can usually give up the amount over the limit and stay in small claims, or file in the regular civil court, where the process is slower and more formal and a lawyer is more useful. You generally cannot split one claim into several small cases to get under the limit.` })
      out.push({ q: 'Does winning in small claims mean I get paid?', a: 'Not automatically. A judgment says you are owed the money; if the other side does not pay, you may need to use collection tools such as wage garnishment or a bank levy, which have their own forms and fees.' })
      return out
    },
    how: [
      'Small claims court is a faster, simpler court for smaller money disputes: unpaid debts, security deposits, minor property damage, and broken agreements. Each state sets a dollar limit.',
      'Enter the amount you are owed. The checker compares it with your state’s limit and shows which court hears the case and whether lawyers can appear.',
    ],
    practice: 'consumer-protection',
    topic: 'small-claims-court',
    related: [
      { label: 'Small claims court guide', href: (s) => `/state/${s.slug}/small-claims-court` },
      { label: 'Statute of limitations', href: (s) => `/state/${s.slug}/statute-of-limitations` },
    ],
  },
  {
    slug: 'security-deposit-calculator',
    name: 'Security deposit deadline calculator',
    blurb: 'When does your landlord have to return your deposit? Count it from your move-out date.',
    icon: '🔑',
    heading: (s) => `${s.name} Security Deposit Return Calculator`,
    title: (s) => `${s.name} Security Deposit Return Deadline Calculator`,
    description: (s, d) => `${d.kind === 'deadline' && d.rules[0] ? `${s.name} landlords have ${d.rules[0].value} to return a deposit. ` : ''}Enter your move-out date to get the exact deadline, plus the ${s.name} limit on deposits, with the law cited.`,
    data: (code) => {
      const r = rule(code, 'small-claims.securityDepositReturn', 'Deposit return deadline', 'Date you moved out and returned the keys', 'Most states count from the end of the lease or the day you give back possession. Keep proof of the date.')
      if (!r) return null
      const cap = rule(code, 'small-claims.securityDepositCap', 'Deposit limit', '', undefined, false)
      const m = cap?.value.match(/^(\d+(?:\.\d+)?) months?['’]? rent$/i)
      return { kind: 'deadline', mode: 'all', rules: [r], cap, capMonths: m ? Number(m[1]) : null }
    },
    answer: (s, d) => d.kind === 'deadline' ? `${s.name} landlords must return a security deposit, or send an itemized list of deductions, within ${lc(d.rules[0].value)}${cite(d.rules[0])}${d.cap ? `. Deposits are limited to ${lc(d.cap.value)}${cite(d.cap)}` : ''}.` : '',
    faqs: (s, d) => {
      if (d.kind !== 'deadline') return []
      const r = d.rules[0]
      const out: Faq[] = [{ q: `How long does a landlord have to return a security deposit in ${s.name}?`, a: `${r.value}${cite(r)}. ${r.detail ?? ''}`.trim() }]
      if (d.cap) out.push({ q: `How much can a landlord charge for a security deposit in ${s.name}?`, a: `${d.cap.value}${cite(d.cap)}. ${d.cap.detail ?? ''}`.trim() })
      out.push({ q: 'What can a landlord deduct from a deposit?', a: 'Generally unpaid rent and the cost of repairing damage beyond normal wear and tear. Normal wear (faded paint, light carpet wear, small nail holes) usually cannot be charged. Move-out photos and a forwarding address in writing make a dispute much easier to win.' })
      out.push({ q: 'What if the landlord misses the deadline?', a: `Many states let tenants recover the deposit plus a penalty when a landlord keeps it wrongfully or misses the deadline. You can usually sue in ${s.name} small claims court without a lawyer.` })
      return out
    },
    how: [
      'Every state sets a deadline for landlords to return a tenant’s security deposit or explain, in writing, what was kept and why.',
      'Enter the date you moved out and gave back the keys. The calculator counts your state’s deadline from that date, and, if you enter your monthly rent, checks the deposit against your state’s limit.',
    ],
    practice: 'real-estate',
    topic: 'small-claims-court',
    related: [
      { label: 'Small claims court guide', href: (s) => `/state/${s.slug}/small-claims-court` },
      { label: 'Small claims checker', href: (s) => `/calculators/small-claims-checker/${s.slug}` },
    ],
  },
  {
    slug: 'workers-comp-deadline-calculator',
    name: 'Workers’ comp deadline calculator',
    blurb: 'Hurt at work? Count the deadlines to tell your employer and to file your claim.',
    icon: '🦺',
    heading: (s) => `${s.name} Workers’ Comp Deadline Calculator`,
    title: (s) => `${s.name} Workers’ Comp Deadlines: When to Report and File a Claim`,
    description: (s, d) => `${d.kind === 'deadline' ? d.rules.map((r) => `${r.label}: ${r.value}.`).join(' ') : ''} Enter your injury date to count both ${s.name} workers’ comp deadlines.`.trim(),
    data: (code) => {
      const notice = rule(code, 'employment.wcInjuryNotice', 'Tell your employer', 'Date of the injury')
      const claimFact = fact(code, 'employment.wcClaimDeadline')
      const fromInjury = claimFact?.value && !/denial|report|benefits/i.test(claimFact.value)
      const claim = rule(code, 'employment.wcClaimDeadline', 'File your claim', 'Date of the injury', undefined, !!fromInjury)
      const rules = [notice, claim].filter((r): r is Rule => !!r)
      return rules.length ? { kind: 'deadline', mode: 'all', rules } : null
    },
    answer: (s, d) => {
      if (d.kind !== 'deadline') return ''
      const n = d.rules.find((r) => r.key === 'employment.wcInjuryNotice')
      const c = d.rules.find((r) => r.key === 'employment.wcClaimDeadline')
      return `In ${s.name}, ${n ? `tell your employer about a work injury within ${lc(n.value)}${cite(n)}` : 'report a work injury to your employer right away'}${c ? `, and file a workers’ compensation claim within ${lc(c.value)}${cite(c)}` : ''}.`
    },
    faqs: (s, d) => {
      if (d.kind !== 'deadline') return []
      const out: Faq[] = d.rules.map((r) => ({ q: r.key.endsWith('Notice') ? `How long do I have to report a work injury in ${s.name}?` : `What is the deadline to file a workers’ comp claim in ${s.name}?`, a: `${r.value}${cite(r)}. ${r.detail ?? ''}`.trim() }))
      out.push({ q: 'What if my injury developed over time?', a: 'For repetitive-stress injuries and occupational diseases, deadlines usually start when you knew, or should have known, that the condition was caused by work. Report it as soon as a doctor connects it to your job.' })
      out.push({ q: 'Can my employer fire me for filing a claim?', a: 'Retaliating against a worker for filing a workers’ compensation claim is illegal in every state, though the remedies differ. Keep copies of your injury report and every letter you receive.' })
      return out
    },
    how: [
      'Workers’ compensation has two clocks: a short one to tell your employer about the injury, and a longer one to file the formal claim with the state.',
      'Enter the date you were hurt. The calculator counts both deadlines and lets you add them to your calendar. Report in writing and keep a copy.',
    ],
    practice: 'workers-compensation',
    topic: 'workers-compensation-laws',
    related: [
      { label: 'Workers’ comp laws', href: (s) => `/state/${s.slug}/workers-compensation-laws` },
      { label: 'Employment laws', href: (s) => `/state/${s.slug}/employment-laws` },
    ],
  },
  {
    slug: 'discrimination-deadline-calculator',
    name: 'Job discrimination deadline calculator',
    blurb: 'Count the deadline to file a discrimination or harassment charge in your state.',
    icon: '📋',
    heading: (s) => `${s.name} Discrimination Complaint Deadline Calculator`,
    title: (s) => `${s.name} Deadline to File a Discrimination Charge: Calculator`,
    description: (s, d) => `${d.kind === 'deadline' && d.rules[0] ? `In ${s.name} you have ${d.rules[0].value} to file a job discrimination charge. ` : ''}Enter the date of the last discriminatory act to count your deadline.`,
    data: (code) => {
      const r = rule(code, 'employment.discriminationDeadline', 'File a discrimination charge', 'Date of the last discriminatory act', 'For harassment that continued over time, the clock usually runs from the last incident.')
      return r ? { kind: 'deadline', mode: 'all', rules: [r] } : null
    },
    answer: (s, d) => {
      if (d.kind !== 'deadline') return ''
      const r = d.rules[0]
      const agency = fact(s.code, 'employment.fairEmploymentAgency')
      return `In ${s.name}, a job discrimination charge must be filed within ${lc(r.value)}${cite(r)}${agency ? `, with the ${agency.value!.replace(/^the /i, '')} or the federal EEOC` : ''}.`
    },
    faqs: (s, d) => {
      if (d.kind !== 'deadline') return []
      const r = d.rules[0]
      return [
        { q: `How long do I have to file a discrimination complaint in ${s.name}?`, a: `${r.value}${cite(r)}. ${r.detail ?? ''}`.trim() },
        { q: 'What is the federal EEOC deadline?', a: 'Under federal law, a charge must be filed with the EEOC within 180 days of the discriminatory act, extended to 300 days when a state or local agency enforces a law against the same discrimination (42 U.S.C. § 2000e-5(e)(1)).' },
        { q: 'Do I need a lawyer to file a charge?', a: 'No, you can file a charge yourself. But how you describe what happened shapes the investigation and any later lawsuit, and many employment lawyers offer a free consultation.' },
      ]
    },
    how: [
      'Before suing for workplace discrimination or harassment, you usually must first file a charge with the EEOC or your state’s civil rights agency, and the deadline is short.',
      'Enter the date of the last discriminatory act (the firing, demotion, or last incident of harassment) to count your state’s deadline.',
    ],
    practice: 'employment-law',
    topic: 'employment-laws',
    related: [
      { label: 'Employment laws', href: (s) => `/state/${s.slug}/employment-laws` },
      { label: 'Minimum wage calculator', href: (s) => `/calculators/minimum-wage-calculator/${s.slug}` },
    ],
  },
  {
    slug: 'minimum-wage-calculator',
    name: 'Minimum wage and overtime calculator',
    blurb: 'Check a paycheck against your state’s minimum wage and federal overtime rules.',
    icon: '💵',
    heading: (s) => `${s.name} Minimum Wage Calculator`,
    title: (s) => `${s.name} Minimum Wage Calculator: Are You Being Paid Enough?`,
    description: (s, d) => `${d.kind === 'wage' ? `${s.name}’s minimum wage is ${d.fact.value}. ` : ''}Enter your hours and pay to check a paycheck against the ${s.name} minimum wage, the tipped wage and federal overtime.`,
    data: (code) => {
      const r = rule(code, 'employment.minimumWage', 'Minimum wage', '', undefined, false)
      if (!r) return null
      const t = rule(code, 'employment.tippedWage', 'Tipped cash wage', '', undefined, false)
      const plain = (v: string) => !v.includes(';') ? money(v) : null
      return { kind: 'wage', min: plain(r.value), tipped: t ? plain(t.value) : null, tipCredit: !!t && !/no tip credit/i.test(t.value), fact: r, tippedFact: t }
    },
    answer: (s, d) => d.kind === 'wage' ? `The minimum wage in ${s.name} is ${d.fact.value}${cite(d.fact)}${d.tippedFact ? `; for tipped workers the minimum cash wage is ${d.tippedFact.value}${cite(d.tippedFact)}` : ''}.` : '',
    faqs: (s, d) => {
      if (d.kind !== 'wage') return []
      const out: Faq[] = [{ q: `What is the minimum wage in ${s.name}?`, a: `${d.fact.value}${cite(d.fact)}. ${d.fact.detail ?? ''}`.trim() }]
      if (d.tippedFact) out.push({ q: `What is the tipped minimum wage in ${s.name}?`, a: `${d.tippedFact.value}${cite(d.tippedFact)}. ${d.tipCredit ? 'Your tips plus that cash wage must add up to at least the full minimum wage for every hour; if they fall short, the employer must make up the difference.' : `${s.name} does not allow a tip credit, so tipped workers get the full minimum wage before tips.`}` })
      out.push({ q: 'When do I get overtime?', a: 'Under the federal Fair Labor Standards Act, covered non-exempt employees earn at least 1.5 times their regular rate for hours over 40 in a workweek (29 U.S.C. § 207). Some states add daily overtime or other rules. Salaried, managerial and some other jobs can be exempt.' })
      out.push({ q: 'What can I do about unpaid wages?', a: `You can file a wage claim with the ${s.name} labor department or the U.S. Department of Labor, or sue. Unpaid-wage cases can carry extra damages, and many lawyers take them without an upfront fee.` })
      return out
    },
    how: [
      'Enter the hours you worked in one workweek and your total pay for that week before taxes (including tips, if you earn them).',
      'The calculator works out your effective hourly rate and the least you could legally be paid for those hours, using your state’s minimum wage and federal time-and-a-half overtime for hours over 40.',
      'Cities and counties can set a higher minimum wage than the state, and some jobs are exempt from minimum wage or overtime. The result is a quick check, not a final answer.',
    ],
    practice: 'employment-law',
    topic: 'employment-laws',
    related: [
      { label: 'Employment laws', href: (s) => `/state/${s.slug}/employment-laws` },
      { label: 'Discrimination deadline', href: (s) => `/calculators/discrimination-deadline-calculator/${s.slug}` },
    ],
  },
]

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug)
export const statesFor = (t: Tool) => STATES.filter((s) => t.data(s.code))

/** What you could recover under a fault rule, or null when the rule can't be reduced to a number. */
export function recovery(r: FaultRule, damages: number, fault: number): number | null {
  if (fault <= 0) return damages
  if (r === 'slight') return null
  if (r === 'contributory') return 0
  if (r === 'bar51' && fault >= 51) return 0
  if (r === 'bar50' && fault >= 50) return 0
  if (fault >= 100) return 0
  return Math.round(damages * (1 - fault / 100) * 100) / 100
}
