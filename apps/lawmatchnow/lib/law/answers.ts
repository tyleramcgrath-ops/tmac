// Direct answers to the state-law questions people type into search engines
// ("is Texas a community property state?"). Each one is read from a single
// verified, cited fact, so the yes/no can't drift from the data.

import { type State, STATES } from '@/lib/geo'
import { type Fact, type FieldKey, fact } from './facts'

export type Verdict = 'yes' | 'no' | 'partly' | 'info'
export type Answer = { verdict: Verdict; short: string; text: string }

export type Question = {
  id: string
  key: FieldKey
  /** URL slug for one state, e.g. is-texas-a-community-property-state. */
  slug: (s: State) => string
  ask: (s: State) => string
  answer: (s: State, f: Fact) => Answer
  /** What the answer means in practice, by verdict. */
  meaning: (s: State, f: Fact, a: Answer) => string[]
  national: { slug: string; title: string; h1: string; lede: string; group: string }
  /** Label for the yes column on the national page. */
  yesLabel: string
  topic: string
  practice: string
  tool?: string
}

const v = (f: Fact) => f.value ?? ''
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const cite = (f: Fact) => (f.cite ? ` (${f.cite})` : '')
/** "3 days (excluding weekends)" -> "3 days of notice (excluding weekends)" */
const noticeOf = (val: string) => { const m = /^([^(]*?)\s*(\(.*\))?$/.exec(val)!; return `${lc(m[1])} of notice${m[2] ? ` ${m[2]}` : ''}` }
/** "next regular payday" reads as "on the next regular payday" */
export const due = (val: string) => (/^next\b/i.test(val) ? `on the ${lc(val)}` : lc(val))

export const QUESTIONS: Question[] = [
  {
    id: 'community-property',
    key: 'divorce.propertyDivision',
    slug: (s) => `is-${s.slug}-a-community-property-state`,
    ask: (s) => `Is ${s.name} a community property state?`,
    answer: (s, f) => /^community/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} is a community property state: most property and debts acquired during the marriage belong to both spouses equally${cite(f)}.` }
      : { verdict: 'no', short: 'No', text: `No. ${s.name} is an equitable distribution state, not a community property state. In a divorce, marital property is divided fairly, which is not always 50/50${cite(f)}.` },
    meaning: (s, _f, a) => a.verdict === 'yes' ? [
      `Community property belongs to both spouses equally: wages earned, homes bought and debts taken on by either spouse during the marriage, no matter whose name is on the title or account. ${s.code === 'TX' ? 'In a Texas divorce, the court divides it in a way it finds "just and right", which is often close to equal but can favor one spouse (Tex. Fam. Code § 7.001).' : `In a ${s.name} divorce, that shared ownership is the starting point for dividing it, though some community property states let the judge depart from an exact 50/50 split.`}`,
      `Separate property usually stays with the spouse who owns it: what each spouse owned before the marriage, plus gifts and inheritances received by one spouse. Mixing separate money into joint accounts can turn it into community property, which is one of the most common fights in a divorce.`,
      `Community property rules also matter when a spouse dies and for debts: a creditor may be able to reach community property for debts one spouse took on during the marriage.`,
    ] : [
      `In a ${s.name} divorce, the court divides marital property "equitably", meaning fairly, after looking at factors such as each spouse's income and earning ability, the length of the marriage, contributions as a homemaker, and each spouse's separate property.`,
      `Equitable often ends up close to equal, but it doesn't have to: a spouse who earns far less or who gave up a career to raise children may receive more. Property one spouse owned before the marriage, or received as a gift or inheritance, is usually kept out of the split.`,
      `Because "fair" is a judgment call, the outcome depends heavily on the evidence and the negotiation, which is where a family lawyer makes the biggest difference.`,
    ],
    national: { slug: 'community-property-states', title: 'Community Property States: The Full List', h1: 'Which states are community property states?', lede: 'In a community property state, most property and debt acquired during a marriage belongs to both spouses equally. Every other state divides marital property "equitably". Here is every state’s rule, with the statute.', group: 'Community property' },
    yesLabel: 'Community property',
    topic: 'divorce-laws',
    practice: 'family-law',
  },
  {
    id: 'no-fault-insurance',
    key: 'car-accident.faultSystem',
    slug: (s) => `is-${s.slug}-a-no-fault-state`,
    ask: (s) => `Is ${s.name} a no-fault state for car accidents?`,
    answer: (s, f) => /^no-fault/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} is a no-fault car insurance state: after a crash, your own personal injury protection (PIP) coverage pays your medical bills and lost wages first, whoever caused it${cite(f)}.` }
      : /choice/i.test(v(f))
        ? { verdict: 'partly', short: 'Partly', text: `Partly. ${s.name} is a "choice no-fault" state: drivers choose between no-fault coverage, which limits the right to sue, and traditional at-fault coverage${cite(f)}.` }
        : { verdict: 'no', short: 'No', text: `No. ${s.name} is an at-fault (tort) state: the driver who caused the crash, through their liability insurance, pays for the other people's injuries and damage${cite(f)}.` },
    meaning: (s, _f, a) => a.verdict === 'no' ? [
      `After a crash in ${s.name}, you claim against the at-fault driver's liability insurance, or sue them, for medical bills, lost income, repairs and pain and suffering. You can also use your own coverage, such as collision or medical payments, and let your insurer pursue the other driver.`,
      `Because fault decides who pays, evidence matters from the first minute: photos, the police report, witness names and any dashcam video. ${s.name}'s shared-fault rule decides what happens if you were partly to blame.`,
    ] : [
      `After a crash in ${s.name}, you usually turn first to your own policy's personal injury protection for medical bills and lost wages, whoever caused it. That speeds up payment for smaller injuries.`,
      `No-fault does not mean nobody is responsible. Property damage is still paid by the at-fault driver, and once an injury is serious enough to meet ${s.name}'s threshold, you can step outside no-fault and sue the at-fault driver for pain and suffering.`,
      ...(a.verdict === 'partly' ? [`Check which option you chose on your policy: it decides whether you can sue for pain and suffering after a minor injury.`] : []),
    ],
    national: { slug: 'no-fault-states', title: 'No-Fault States: Full List of No-Fault Car Insurance States', h1: 'Which states are no-fault states?', lede: 'In a no-fault state, your own insurance pays your injury costs after a crash, whoever caused it, and lawsuits are limited to serious injuries. Most states are at-fault (tort) states. Here is every state, with the statute.', group: 'No-fault or choice' },
    yesLabel: 'No-fault',
    topic: 'car-accident-laws',
    practice: 'personal-injury',
    tool: 'comparative-fault-calculator',
  },
  {
    id: 'comparative-negligence',
    key: 'car-accident.negligenceRule',
    slug: (s) => `is-${s.slug}-a-comparative-negligence-state`,
    ask: (s) => `Is ${s.name} a comparative negligence state?`,
    answer: (s, f) => /^contributory/i.test(v(f))
      ? { verdict: 'no', short: 'No', text: `No. ${s.name} follows contributory negligence, one of the strictest rules in the country: if you were even slightly at fault for an accident, you generally can't recover anything${cite(f)}.` }
      : /slight/i.test(v(f))
        ? { verdict: 'partly', short: 'Partly', text: `Partly. ${s.name} uses a slight/gross negligence rule: you can recover only if your own fault was slight compared with the other side's, and your damages are then reduced${cite(f)}.` }
        : { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} follows ${lc(v(f).replace(/\s*\(.*\)$/, ''))}${cite(f)}.${/\(/.test(v(f)) && f.detail ? ` ${f.detail}` : ''} If you were partly at fault, your compensation is reduced by your share of the blame${/bar/i.test(v(f)) && !/^pure/i.test(v(f)) ? ', and it stops entirely once your share reaches the bar' : ''}.` },
    meaning: (s, f, a) => [
      a.verdict === 'no'
        ? `Insurance adjusters in ${s.name} know that any fault on your part can end the claim, so expect them to look hard for something you did wrong, such as speeding, a missed signal or looking at your phone. Exceptions such as "last clear chance" can still help.`
        : /^pure/i.test(v(f))
          ? `Under pure comparative fault, even a driver who was 80% to blame can recover 20% of their damages. Your share of fault still matters a great deal, because every percentage point comes off what you receive.`
          : `Under ${s.name}'s rule, a few percentage points can decide the whole case: just under the bar you recover most of your damages, at or over it you recover nothing. Insurers know this and argue hard over fault.`,
      `Try the numbers for your own case with the free comparative fault calculator, and gather the evidence (photos, the police report, witnesses) that shows what the other side did wrong.`,
    ],
    national: { slug: 'comparative-negligence-states', title: 'Comparative vs. Contributory Negligence States: Full List', h1: 'Which states use comparative negligence?', lede: 'When an injured person is partly to blame, each state applies one of four rules: pure comparative fault, modified comparative fault with a 50% or 51% bar, or contributory negligence. Here is every state’s rule, with its source.', group: 'Comparative fault' },
    yesLabel: 'Comparative',
    topic: 'personal-injury-laws',
    practice: 'personal-injury',
    tool: 'comparative-fault-calculator',
  },
  {
    id: 'no-fault-divorce',
    key: 'divorce.grounds',
    slug: (s) => `is-${s.slug}-a-no-fault-divorce-state`,
    ask: (s) => `Is ${s.name} a no-fault divorce state?`,
    answer: (s, f) => /only/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} is a pure no-fault divorce state: you can't base a divorce on fault such as adultery; it is granted because the marriage has broken down${cite(f)}.` }
      : { verdict: 'yes', short: 'Yes', text: `Yes. You can get a no-fault divorce in ${s.name}, and you can also file on fault grounds such as adultery or cruelty${cite(f)}.` },
    meaning: (s, f) => [
      `A no-fault divorce means neither spouse has to prove the other did something wrong; it is enough that the marriage has broken down. One spouse can't stop the divorce simply by refusing to agree.`,
      /only/i.test(v(f))
        ? `Because ${s.name} doesn't use fault grounds, misconduct like adultery usually matters only in narrow ways, for example if marital money was spent on an affair, or where it bears on the children's best interests.`
        : `Filing on fault grounds in ${s.name} can sometimes affect alimony or property division, but it usually takes longer and costs more, so most couples file no-fault.`,
    ],
    national: { slug: 'no-fault-divorce-states', title: 'No-Fault Divorce States: Which States Allow Fault Grounds Too', h1: 'Which states are no-fault divorce states?', lede: 'Every state now allows no-fault divorce, but many still let you file on fault grounds such as adultery. Here is each state’s rule, with the statute.', group: 'No-fault only' },
    yesLabel: 'No-fault only',
    topic: 'divorce-laws',
    practice: 'family-law',
  },
  {
    id: 'divorce-time',
    key: 'divorce.waitingPeriod',
    slug: (s) => `how-long-does-a-divorce-take-in-${s.slug}`,
    ask: (s) => `How long does a divorce take in ${s.name}?`,
    answer: (s, f) => /^none/i.test(v(f))
      ? { verdict: 'info', short: 'No waiting period', text: `${s.name} has no mandatory waiting period, so an uncontested divorce can be finalized as soon as the court approves the paperwork${cite(f)}. Contested divorces take far longer.` }
      : { verdict: 'info', short: v(f), text: `The shortest possible divorce in ${s.name} is set by its waiting period: ${lc(v(f))}${cite(f)}. That is the minimum for an uncontested case; a contested divorce usually takes many months or more.` },
    meaning: (s, f) => [
      f.detail ?? '',
      `The biggest factor isn't the law but agreement: when spouses agree on property, support and parenting, a ${s.name} divorce can finish soon after the waiting period. Disputes over children, a business or hidden assets can stretch it to a year or more.`,
      `Before you can file at all, ${s.name} also requires one spouse to have lived in the state for a minimum time; see the ${s.name} divorce guide for the residency rule.`,
    ].filter(Boolean),
    national: { slug: 'divorce-waiting-period-by-state', title: 'Divorce Waiting Period by State: How Long a Divorce Takes', h1: 'How long does a divorce take in each state?', lede: 'Many states make spouses wait a set time between filing and the final decree. Here is the minimum waiting period in every state, with the statute.', group: 'No waiting period' },
    yesLabel: 'Waiting period',
    topic: 'divorce-laws',
    practice: 'family-law',
  },
  {
    id: 'child-choose',
    key: 'custody.childPreference',
    slug: (s) => `at-what-age-can-a-child-choose-which-parent-to-live-with-in-${s.slug}`,
    ask: (s) => `At what age can a child choose which parent to live with in ${s.name}?`,
    answer: (s, f) => {
      const age = /^(\d+)\s*\((.*)\)$/.exec(v(f))
      if (age) return { verdict: 'info', short: `Age ${age[1]}`, text: `In ${s.name}, a child's preference gets special weight from age ${age[1]}: ${age[2]}${cite(f)}. ${f.detail ?? ''}`.trim() }
      const rule = /\((.*)\)$/.exec(v(f))?.[1]
      return { verdict: 'info', short: 'No set age', text: `${s.name} sets no age at which a child can choose which parent to live with${rule ? `; the child's wishes are ${rule.replace(/^considered/, 'considered')}` : ''}${cite(f)}. ${f.detail ?? ''}`.trim() }
    },
    meaning: (s) => [
      `Even where a child's choice carries great weight, a ${s.name} judge can override it if living with that parent isn't in the child's best interests, for example if the choice seems driven by fewer rules or by pressure from a parent.`,
      'Judges usually hear from children privately, in chambers or through a guardian ad litem or custody evaluator, so the child doesn’t have to testify against a parent in open court.',
      `A parent hoping a child's preference will change custody should let the child speak freely rather than coach them; judges notice rehearsed answers, and coaching can count against the parent.`,
    ],
    national: { slug: 'child-custody-age-by-state', title: 'At What Age Can a Child Choose Which Parent to Live With? (By State)', h1: 'At what age can a child choose which parent to live with?', lede: 'Only a few states give a child of a set age a strong say in custody; most let the judge weigh any mature child’s wishes. Here is every state’s rule, with the statute or case.', group: 'Set age' },
    yesLabel: 'Age',
    topic: 'child-custody-laws',
    practice: 'family-law',
  },
  {
    id: 'support-end',
    key: 'custody.supportEndAge',
    slug: (s) => `when-does-child-support-end-in-${s.slug}`,
    ask: (s) => `When does child support end in ${s.name}?`,
    answer: (s, f) => ({ verdict: 'info', short: `Age ${v(f).replace(/\s*\(.*$/, '')}`, text: `Child support in ${s.name} normally ends at ${v(f)}${cite(f)}. ${f.detail ?? ''}`.trim() }),
    meaning: (s) => [
      `The date in your own support order controls, so read it: some ${s.name} orders end on a set date, others when the child finishes high school, and a parent may need to ask the court to formally end the withholding from a paycheck.`,
      'Support for a child with a disability can continue into adulthood in many states, and parents can agree in writing to pay for college even where the law doesn’t require it.',
      'Past-due support doesn’t disappear when payments stop. It can still be collected, often with interest, through wage garnishment, tax refund intercepts and license suspensions.',
    ],
    national: { slug: 'child-support-age-by-state', title: 'When Does Child Support End? Age by State', h1: 'At what age does child support end in each state?', lede: 'In most states child support ends at 18, or later if the child is still in high school; a few run to 19, 21 or beyond. Here is every state’s rule, with the statute.', group: '18' },
    yesLabel: 'Ends at',
    topic: 'child-custody-laws',
    practice: 'family-law',
  },
  {
    id: 'one-party-consent',
    key: 'recording.consent',
    slug: (s) => `is-${s.slug}-a-one-party-consent-state`,
    ask: (s) => `Is ${s.name} a one-party consent state?`,
    answer: (s, f) => /^one-party/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} is a one-party consent state: you can legally record a phone call or conversation you are part of without the other people's permission${cite(f)}.` }
      : /^all-party/i.test(v(f))
        ? { verdict: 'no', short: 'No', text: `No. ${s.name} is an all-party (two-party) consent state: everyone in a private conversation or phone call must agree before it is recorded${cite(f)}.` }
        : { verdict: 'partly', short: 'It depends', text: `It depends. ${s.name}'s rules are mixed${cite(f)}. ${f.detail ?? ''}`.trim() },
    meaning: (s, f, a) => [
      a.verdict === 'yes'
        ? `In ${s.name} you can record your own calls and conversations, for example with a landlord, a boss or a debt collector, without announcing it. You can't record a conversation you aren't part of, or plant a device to capture other people's private talk.`
        : a.verdict === 'no'
          ? `In ${s.name}, record only after everyone agrees. Saying "this call is being recorded" at the start and having people continue usually counts as consent. Secretly recording a private conversation can be a crime and lets the other side sue.`
          : `Because ${s.name}'s rule changes with the situation, the safe practice is to tell everyone you are recording before you start.`,
      f.detail && a.verdict !== 'partly' ? f.detail : '',
      `Calls with someone in another state can bring in that state's stricter rule. If a recording matters to a divorce, custody, workplace or criminal case, ask a ${s.name} lawyer before you rely on it.`,
    ].filter(Boolean),
    national: { slug: 'one-party-consent-states', title: 'One-Party Consent States: Recording Laws by State', h1: 'Which states are one-party consent states?', lede: 'Most states let you record a conversation you take part in without telling the others. A minority require everyone’s consent. Here is every state’s recording law, with the statute.', group: 'One-party consent' },
    yesLabel: 'One-party consent',
    topic: 'recording-laws',
    practice: 'criminal-defense',
  },
  {
    id: 'dog-bite-strict',
    key: 'dog-bite.liability',
    slug: (s) => `is-${s.slug}-a-strict-liability-dog-bite-state`,
    ask: (s) => `Is ${s.name} a strict liability state for dog bites?`,
    answer: (s, f) => /^strict/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. In ${s.name}, a dog owner is strictly liable for bite injuries: the victim doesn't have to prove the owner knew the dog was dangerous${cite(f)}.` }
      : /^one-bite/i.test(v(f))
        ? { verdict: 'no', short: 'No', text: `No. ${s.name} follows the "one-bite" rule: an owner is liable if they knew or should have known the dog was dangerous, or if they were negligent${cite(f)}.` }
        : { verdict: 'partly', short: 'Partly', text: `Partly. ${s.name} has a strict liability law that applies only in some situations${cite(f)}. ${f.detail ?? ''}`.trim() },
    meaning: (s, f, a) => [
      a.verdict === 'yes'
        ? `Strict liability makes a ${s.name} dog bite claim simpler: you show the dog bit you and you were lawfully where you were. Provoking the dog or trespassing can still defeat or reduce the claim.`
        : a.verdict === 'no'
          ? `Under the one-bite rule, evidence of the dog's history wins the case: earlier bites, complaints, aggressive behavior or a "beware of dog" sign. Owners who broke a leash law or let the dog roam can be liable for negligence even without that history.`
          : `When ${s.name}'s strict liability rule doesn't apply, for example when a dog knocks someone down without biting, the injured person must usually prove the owner knew the dog was dangerous or was negligent.`,
      a.verdict !== 'partly' && f.detail ? f.detail : '',
      `Most dog bite claims are paid by the owner's homeowner's or renter's insurance. Get medical care, report the bite to animal control, and keep photos of the injuries.`,
    ].filter(Boolean),
    national: { slug: 'dog-bite-strict-liability-states', title: 'Dog Bite Laws by State: Strict Liability vs. One-Bite Rule', h1: 'Which states have strict liability for dog bites?', lede: 'Some states make owners automatically liable for bites; others follow the one-bite rule, which requires knowing the dog was dangerous. Here is every state’s rule, with the statute or case.', group: 'Strict liability' },
    yesLabel: 'Strict liability',
    topic: 'dog-bite-laws',
    practice: 'personal-injury',
  },
  {
    id: 'eviction-notice',
    key: 'eviction.nonpaymentNotice',
    slug: (s) => `how-much-notice-to-evict-for-unpaid-rent-in-${s.slug}`,
    ask: (s) => `How much notice does a landlord have to give to evict for unpaid rent in ${s.name}?`,
    answer: (s, f) => ({ verdict: 'info', short: v(f).replace(/\s*\(.*$/, ''), text: `${/^no\b/i.test(v(f)) ? `In ${s.name}, there is ${lc(v(f)).replace(/^no notice required/, 'no notice requirement').replace(/^no set notice period/, 'no set notice period')}` : `In ${s.name}, the landlord must give ${noticeOf(v(f))}`} before filing an eviction case for unpaid rent${cite(f)}. ${f.detail ?? ''}`.trim() }),
    meaning: (s) => [
      `The notice is only the first step. If the rent isn't paid or the tenant doesn't leave, the landlord must file a case in court, the tenant gets a chance to respond at a hearing, and only a court order carried out by a sheriff or marshal can remove the tenant. Lockouts and utility shutoffs are illegal in ${s.name}.`,
      'Paying in full within the notice period usually stops the eviction. A notice that is served the wrong way, demands the wrong amount or gives too few days can get a case dismissed, so tenants should read it closely and landlords should follow the statute exactly.',
    ],
    national: { slug: 'eviction-notice-by-state', title: 'Eviction Notice Periods by State (Unpaid Rent)', h1: 'How much notice is required to evict for unpaid rent?', lede: 'Before filing an eviction for unpaid rent, a landlord must give the tenant written notice. The required time ranges from a few days to two weeks. Here is every state, with the statute.', group: 'Notice' },
    yesLabel: 'Notice',
    topic: 'eviction-laws',
    practice: 'real-estate',
    tool: 'security-deposit-calculator',
  },
  {
    id: 'final-paycheck',
    key: 'final-pay.fired',
    slug: (s) => `when-do-you-get-your-final-paycheck-in-${s.slug}`,
    ask: (s) => `When do you get your final paycheck in ${s.name}?`,
    answer: (s, f) => {
      const quit = fact(s.code, 'final-pay.quit')
      return /^no state law/i.test(v(f))
        ? { verdict: 'info', short: 'No state deadline', text: `${s.name} has no state law setting a special deadline for final paychecks${cite(f)}, so final wages are due on the employer's regular payday.` }
        : { verdict: 'info', short: v(f).replace(/\s*\(.*$/, '').replace(/,.*$/, ''), text: `If you're fired in ${s.name}, your final paycheck is due ${due(v(f))}${cite(f)}.${quit ? ` If you quit, it is due ${due(v(quit))}${cite(quit)}.` : ''}` }
    },
    meaning: (s, f) => [
      f.detail ?? '',
      `The final check must include every hour worked, including overtime, at no less than ${s.name}'s minimum wage. Whether unused vacation must be added depends on ${s.name} law and your employer's written policy.`,
      `If it's late, ask in writing, then file a wage claim with the ${s.name} labor department or the U.S. Department of Labor. Many states add penalties for late final pay.`,
    ].filter(Boolean),
    national: { slug: 'final-paycheck-laws-by-state', title: 'Final Paycheck Laws by State: When Your Last Check Is Due', h1: 'When is a final paycheck due in each state?', lede: 'States set different deadlines for a final paycheck, and many treat being fired differently from quitting. Here is every state’s rule, with the statute.', group: 'Deadline' },
    yesLabel: 'If fired',
    topic: 'final-paycheck-laws',
    practice: 'employment-law',
    tool: 'minimum-wage-calculator',
  },
  {
    id: 'vacation-payout',
    key: 'final-pay.accruedVacation',
    slug: (s) => `does-${s.slug}-require-vacation-payout`,
    ask: (s) => `Does ${s.name} require employers to pay out unused vacation?`,
    answer: (s, f) => /^required unless/i.test(v(f))
      ? { verdict: 'partly', short: 'Unless policy says otherwise', text: `Usually. In ${s.name}, earned vacation must be paid out when you leave unless the employer's written policy or contract clearly says otherwise${cite(f)}.` }
      : /^required/i.test(v(f))
        ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} treats earned, unused vacation as wages that must be paid out when employment ends${/\(/.test(v(f)) ? ` (${v(f).replace(/^.*\((.*)\)$/, '$1')})` : ''}${cite(f)}.` }
        : { verdict: 'no', short: 'No', text: `No. ${s.name} law doesn't require employers to pay out unused vacation; it depends on the employer's policy or your contract${cite(f)}.` },
    meaning: (s, f, a) => [
      f.detail ?? '',
      a.verdict === 'no'
        ? `Check your handbook or offer letter: if your employer promised to pay out unused vacation, that promise can be enforced in ${s.name} like any other wage agreement.`
        : `Some ${s.name} employers try "use it or lose it" policies; whether those are allowed depends on the state's rule above. Keep your last pay stub showing your vacation balance.`,
    ].filter(Boolean),
    national: { slug: 'vacation-payout-laws-by-state', title: 'Vacation Payout Laws by State (Unused PTO at Termination)', h1: 'Which states require unused vacation to be paid out?', lede: 'A minority of states treat earned vacation as wages that must be paid when a job ends; most leave it to company policy. Here is every state’s rule, with the source.', group: 'Required' },
    yesLabel: 'Required',
    topic: 'final-paycheck-laws',
    practice: 'employment-law',
  },
  {
    id: 'pip',
    key: 'car-accident.pipRequired',
    slug: (s) => `does-${s.slug}-require-pip-insurance`,
    ask: (s) => `Does ${s.name} require PIP insurance?`,
    answer: (s, f) => /^yes/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} requires personal injury protection (PIP): ${lc(v(f).replace(/^yes\s*/i, '').replace(/^\((.*)\)$/, '$1')) || 'it is mandatory'}${cite(f)}.` }
      : { verdict: 'no', short: 'No', text: `No. ${s.name} does not require personal injury protection (PIP) coverage${cite(f)}, though insurers may offer it or medical payments coverage as an option.` },
    meaning: (s, _f, a) => a.verdict === 'yes' ? [
      `PIP pays your own medical bills and part of your lost wages after a crash, no matter who caused it, up to your policy limit. In ${s.name} it is part of every auto policy.`,
      `If your injuries cost more than your PIP limit, you may be able to claim the rest from the at-fault driver, depending on ${s.name}'s rules for stepping outside no-fault.`,
    ] : [
      `Without required PIP, medical bills after a ${s.name} crash are paid by the at-fault driver's liability insurance, your health insurance, or optional medical payments coverage on your own policy.`,
      `Optional medical payments or PIP coverage is often inexpensive and pays quickly, regardless of fault, which can cover deductibles and copays while a liability claim is pending.`,
    ],
    national: { slug: 'pip-states', title: 'PIP States: Where Personal Injury Protection Is Required', h1: 'Which states require PIP insurance?', lede: 'Personal injury protection pays your own medical bills after a crash, whoever caused it. Some states require it; most don’t. Here is every state, with the statute.', group: 'PIP required' },
    yesLabel: 'PIP required',
    topic: 'car-accident-laws',
    practice: 'personal-injury',
  },
  {
    id: 'estate-tax',
    key: 'wills.estateTax',
    slug: (s) => `does-${s.slug}-have-an-estate-tax`,
    ask: (s) => `Does ${s.name} have an estate or inheritance tax?`,
    answer: (s, f) => /^none/i.test(v(f))
      ? { verdict: 'no', short: 'No', text: `No. ${s.name} has no estate tax and no inheritance tax${cite(f)}. Only the federal estate tax can apply, and only to very large estates.` }
      : /estate tax/i.test(v(f))
        ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} has a state ${lc(v(f))}${cite(f)}.` }
        : { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} has an inheritance tax, paid by some heirs depending on their relationship to the person who died, but no separate estate tax${cite(f)}.` },
    meaning: (s, f, a) => a.verdict === 'no' ? [
      `Estates in ${s.name} owe no state tax at death. The federal estate tax applies only above a high exemption, so most families owe no estate tax at all.`,
      `Heirs may still owe income tax on some inherited assets, such as traditional retirement accounts, and property inherited from another state can be taxed by that state.`,
    ] : [
      f.detail ?? `${s.name}'s tax applies on top of any federal estate tax.`,
      `State exemptions are often far lower than the federal one, so an estate can owe ${s.name} tax without owing any federal tax. Gifts, trusts and how assets are titled can reduce the bill, which is why estate planning matters most in states like ${s.name}.`,
    ].filter(Boolean),
    national: { slug: 'states-with-estate-tax', title: 'States With an Estate or Inheritance Tax (Full List)', h1: 'Which states have an estate or inheritance tax?', lede: 'Most states have neither. A minority tax estates above an exemption, and a few tax heirs through an inheritance tax. Here is every state, with the law.', group: 'Has a death tax' },
    yesLabel: 'Has a tax',
    topic: 'wills-and-probate',
    practice: 'estate-planning',
  },
  {
    id: 'handwritten-wills',
    key: 'wills.holographic',
    slug: (s) => `are-handwritten-wills-valid-in-${s.slug}`,
    ask: (s) => `Are handwritten wills valid in ${s.name}?`,
    answer: (s, f) => /^recognized$/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} recognizes handwritten (holographic) wills${cite(f)}. ${f.detail ?? ''}`.trim() }
      : /^recognized only/i.test(v(f))
        ? { verdict: 'partly', short: 'Only in narrow cases', text: `Only in narrow cases. ${s.name} accepts a handwritten will only ${v(f).replace(/^recognized only\s*/i, '')}${cite(f)}; otherwise a will must be signed and witnessed under the usual formalities.` }
        : { verdict: 'no', short: 'No', text: `No. ${s.name} does not recognize a will that is only handwritten and signed; a valid will must meet the state's witnessing requirements${cite(f)}.` },
    meaning: (s, _f, a) => [
      a.verdict === 'yes'
        ? `A handwritten will is better than none, but it is the type most often challenged: unclear wording, missing dates and doubts about the writer's state of mind lead to disputes in probate court.`
        : `A handwritten note that isn't properly witnessed can leave someone treated as dying without a will in ${s.name}, so their property passes under the state's default inheritance rules instead of their wishes.`,
      `The safest route in ${s.name} is a typed will signed in front of the required witnesses, ideally with a self-proving affidavit so the witnesses never need to appear in court.`,
    ],
    national: { slug: 'states-that-allow-handwritten-wills', title: 'Which States Allow Handwritten (Holographic) Wills?', h1: 'Which states recognize handwritten wills?', lede: 'About half the states accept a will written entirely in the testator’s handwriting without witnesses. Here is every state’s rule, with the statute.', group: 'Recognized' },
    yesLabel: 'Recognized',
    topic: 'wills-and-probate',
    practice: 'estate-planning',
  },
  {
    id: 'electronic-wills',
    key: 'wills.electronicWills',
    slug: (s) => `are-electronic-wills-legal-in-${s.slug}`,
    ask: (s) => `Are electronic wills legal in ${s.name}?`,
    answer: (s, f) => /^yes/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} allows electronic wills that are signed and witnessed electronically under its statute${cite(f)}.` }
      : { verdict: 'no', short: 'No', text: `No. ${s.name} does not have a law authorizing electronic wills, so a will should be a signed paper document that meets the state's witnessing rules${cite(f)}.` },
    meaning: (s, f, a) => [
      f.detail ?? '',
      a.verdict === 'yes'
        ? `Electronic wills still have to follow ${s.name}'s exact rules for signatures, witnesses and, where required, remote notarization. A will typed into a phone note or emailed PDF is not the same thing.`
        : `Online will services can still help you draft a will in ${s.name}, but you will need to print it and sign it with witnesses for it to be valid.`,
    ].filter(Boolean),
    national: { slug: 'states-that-allow-electronic-wills', title: 'States That Allow Electronic Wills (Full List)', h1: 'Which states allow electronic wills?', lede: 'A growing number of states let you sign and witness a will electronically. Here is every state’s rule, with the statute.', group: 'Allowed' },
    yesLabel: 'Allowed',
    topic: 'wills-and-probate',
    practice: 'estate-planning',
  },
  {
    id: 'malpractice-cap',
    key: 'damages-bar.medMalCap',
    slug: (s) => `does-${s.slug}-cap-medical-malpractice-damages`,
    ask: (s) => `Does ${s.name} cap medical malpractice damages?`,
    answer: (s, f) => /^no cap/i.test(v(f))
      ? { verdict: 'no', short: 'No', text: `No. ${s.name} does not cap damages for pain and suffering in medical malpractice cases${cite(f)}.` }
      : { verdict: 'yes', short: 'Yes', text: `Yes. ${s.name} limits medical malpractice damages: ${lc(v(f))}${cite(f)}.` },
    meaning: (s, f, a) => [
      f.detail ?? '',
      a.verdict === 'yes'
        ? `A cap usually limits non-economic damages (pain, suffering, loss of enjoyment of life), not medical bills or lost income. It shapes which cases lawyers in ${s.name} can afford to take, since malpractice cases often need costly expert witnesses.`
        : `Without a cap, a ${s.name} jury can award what it finds fair for pain and suffering. Malpractice cases still have strict pre-suit steps and short deadlines, so talk to a lawyer early.`,
    ].filter(Boolean),
    national: { slug: 'medical-malpractice-caps-by-state', title: 'Medical Malpractice Damage Caps by State', h1: 'Which states cap medical malpractice damages?', lede: 'Many states limit how much a malpractice victim can recover for pain and suffering. Here is every state’s cap, or lack of one, with the statute.', group: 'Has a cap' },
    yesLabel: 'Has a cap',
    topic: 'medical-malpractice-laws',
    practice: 'medical-malpractice',
  },
  {
    id: 'uninsured-motorist',
    key: 'car-accident.uninsuredMotorist',
    slug: (s) => `is-uninsured-motorist-coverage-required-in-${s.slug}`,
    ask: (s) => `Is uninsured motorist coverage required in ${s.name}?`,
    answer: (s, f) => /^required/i.test(v(f))
      ? { verdict: 'yes', short: 'Yes', text: `Yes. Uninsured motorist coverage is required in ${s.name}${cite(f)}.` }
      : /must be offered/i.test(v(f))
        ? { verdict: 'partly', short: 'Not unless you keep it', text: `Not strictly. ${s.name} insurers must include uninsured motorist coverage, but you can reject it in writing${cite(f)}.` }
        : { verdict: 'no', short: 'No', text: `No. Uninsured motorist coverage is optional in ${s.name}${cite(f)}.` },
    meaning: (s, f) => [
      f.detail ?? '',
      `Uninsured motorist (UM) coverage pays your injury costs when the driver who hit you has no insurance or flees the scene; underinsured coverage (UIM) fills the gap when their policy is too small. Given how many drivers carry only minimum limits, it is one of the most valuable coverages to keep in ${s.name}.`,
      `After a crash with an uninsured driver, the claim is against your own insurer, which can still dispute fault and value, so the same evidence and advice apply.`,
    ].filter(Boolean),
    national: { slug: 'uninsured-motorist-coverage-by-state', title: 'Uninsured Motorist Coverage Requirements by State', h1: 'Which states require uninsured motorist coverage?', lede: 'Some states require uninsured motorist coverage, others make insurers offer it, and a few leave it optional. Here is every state, with the statute.', group: 'Required' },
    yesLabel: 'Required',
    topic: 'car-accident-laws',
    practice: 'personal-injury',
  },
  {
    id: 'minimum-wage',
    key: 'employment.minimumWage',
    slug: (s) => `what-is-the-minimum-wage-in-${s.slug}`,
    ask: (s) => `What is the minimum wage in ${s.name}?`,
    answer: (s, f) => ({ verdict: 'info', short: v(f), text: `The minimum wage in ${s.name} is ${v(f)}${cite(f)}.${/federal/i.test(v(f)) ? ` ${s.name} follows the federal minimum.` : ''}` }),
    meaning: (s, f) => [
      f.detail ?? '',
      `Some cities and counties set a higher minimum than the state, and certain workers, such as tipped employees, can be paid a lower cash wage as long as tips bring them up to the full minimum. Check a paycheck against the law with the free ${s.name} minimum wage calculator.`,
      `If you are paid less than the minimum or denied overtime, you can file a wage claim with the ${s.name} labor department or the U.S. Department of Labor, and many employment lawyers take wage cases without an upfront fee.`,
    ].filter(Boolean),
    national: { slug: 'minimum-wage-by-state', title: 'Minimum Wage by State (Current Rates, All 50 States)', h1: 'What is the minimum wage in each state?', lede: 'States can set a minimum wage above the federal $7.25. Here is the current rate in every state, with the law that sets it.', group: 'Above $7.25' },
    yesLabel: 'Rate',
    topic: 'employment-laws',
    practice: 'employment-law',
    tool: 'minimum-wage-calculator',
  },
]

export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id)

export type AnswerPage = { q: Question; s: State; f: Fact; a: Answer }

/** Every state-question page, keyed by its slug. */
let index: Map<string, AnswerPage> | null = null
export function answerPages(): Map<string, AnswerPage> {
  if (index) return index
  index = new Map()
  for (const q of QUESTIONS) {
    for (const s of STATES) {
      const f = fact(s.code, q.key)
      if (f) index.set(q.slug(s), { q, s, f, a: q.answer(s, f) })
    }
  }
  return index
}

export const answerPage = (slug: string) => answerPages().get(slug) ?? null
export const answersForState = (code: string) => [...answerPages().values()].filter((p) => p.s.code === code)
export const answersForQuestion = (id: string) => [...answerPages().values()].filter((p) => p.q.id === id)
export const questionByNationalSlug = (slug: string) => QUESTIONS.find((q) => q.national.slug === slug)
