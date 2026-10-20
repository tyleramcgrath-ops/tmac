// The state law guides: one page per state per topic (/state/florida/divorce-laws).
// Copy is written once per topic; sentences that depend on a state's rules
// read that state's verified facts, so each page says what's true there.

import type { PhotoKey } from '@/lib/photos'
import type { State } from '@/lib/geo'
import { type Fact, FIELDS, type FieldKey, fact } from './facts'

export type Ctx = { s: State; f: (k: FieldKey) => Fact | null }
export const ctxFor = (s: State): Ctx => ({ s, f: (k) => fact(s.code, k) })

type Para = string | null | false | undefined
export type Topic = {
  slug: string
  name: string
  /** "Florida Divorce Laws" */
  heading: (s: State) => string
  description: (c: Ctx) => string
  fields: FieldKey[]
  /** The fact the page leads with; the page only exists when it's verified. */
  lead: FieldKey
  answer: (c: Ctx) => string
  sections: { h: (c: Ctx) => string; body: (c: Ctx) => Para[] }[]
  faqs: (c: Ctx) => { q: string; a: string }[]
  practices: string[]
  photo: PhotoKey
}

const lc = (v: string) => v.charAt(0).toLowerCase() + v.slice(1)
const cited = (f: Fact | null) => (f?.cite ? ` (${f.cite})` : '')
const v = (f: Fact | null) => f?.value ?? ''
const lookback = (f: Fact | null) => (/^lifetime$/i.test(v(f)) ? 'life' : lc(v(f)))
const has = (f: Fact | null, re: RegExp) => !!f && re.test(f.value ?? '')
const faq = (q: string, a: string | null | false | undefined) => (a ? [{ q, a }] : [])

export const TOPICS: Topic[] = [
  {
    slug: 'statute-of-limitations',
    name: 'Statute of Limitations',
    heading: (s) => `${s.name} Statute of Limitations`,
    description: ({ s, f }) =>
      `${s.name} deadlines to sue: ${[f('sol-injury.personalInjury') && `personal injury ${v(f('sol-injury.personalInjury'))}`, f('sol-civil.writtenContract') && `written contracts ${v(f('sol-civil.writtenContract'))}`, f('sol-injury.medicalMalpractice') && `malpractice ${v(f('sol-injury.medicalMalpractice'))}`].filter(Boolean).join(', ')}. Statutes cited, plain English.`,
    fields: ['sol-injury.personalInjury', 'sol-injury.wrongfulDeath', 'sol-injury.medicalMalpractice', 'sol-injury.propertyDamage', 'sol-civil.writtenContract', 'sol-civil.oralContract', 'sol-civil.fraud', 'sol-civil.defamation', 'sol-civil.debtCollection'],
    lead: 'sol-injury.personalInjury',
    answer: ({ s, f }) => {
      const pi = f('sol-injury.personalInjury')!
      return `In ${s.name}, you generally have ${v(pi)} to file a personal injury lawsuit${cited(pi)}. Other claims have their own deadlines, listed below with the statute for each.`
    },
    sections: [
      {
        h: () => 'What a statute of limitations is',
        body: ({ s }) => [
          `A statute of limitations is the deadline for filing a lawsuit. Once it passes, the court will almost always dismiss the case if the other side raises it, however strong the claim was. ${s.name}, like every state, sets different deadlines for different kinds of claims.`,
          'The deadline is for filing in court, not for settling. Negotiating with an insurance company or the other side does not stop the clock, which is why lawyers often file before talks are finished.',
        ],
      },
      {
        h: () => 'When the clock starts',
        body: ({ f }) => [
          'For most injuries the clock starts on the day of the injury. For harm you couldn’t reasonably have noticed right away, such as some medical errors or fraud, many states use a "discovery rule" that starts the clock when you found out, or should have found out, about it.',
          f('sol-injury.medicalMalpractice')?.detail && `For medical malpractice here: ${f('sol-injury.medicalMalpractice')!.detail}`,
          f('sol-civil.fraud')?.detail && `For fraud: ${f('sol-civil.fraud')!.detail}`,
          'Deadlines can also be paused ("tolled") in some situations, for example while the injured person is a minor. These exceptions are narrow, so don’t count on one without advice.',
        ],
      },
      {
        h: ({ s }) => `Claims against the government in ${s.name}`,
        body: ({ s }) => [
          `If a city, county, state agency or public employee caused the harm, there is usually a much shorter deadline to give written notice of the claim before you can sue, sometimes only months. ${s.name}'s rules for government claims are separate from the deadlines on this page, so talk to a lawyer quickly in these cases.`,
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`How long do you have to sue for personal injury in ${s.name}?`, f('sol-injury.personalInjury') && `Generally ${v(f('sol-injury.personalInjury'))}${cited(f('sol-injury.personalInjury'))}. ${f('sol-injury.personalInjury')!.detail ?? ''}`.trim()),
      ...faq(`What is the statute of limitations for medical malpractice in ${s.name}?`, f('sol-injury.medicalMalpractice') && `${v(f('sol-injury.medicalMalpractice'))}${cited(f('sol-injury.medicalMalpractice'))}. ${f('sol-injury.medicalMalpractice')!.detail ?? ''}`.trim()),
      ...faq(`How long does a creditor have to sue on a debt in ${s.name}?`, f('sol-civil.debtCollection') && `${v(f('sol-civil.debtCollection'))}${cited(f('sol-civil.debtCollection'))}. ${f('sol-civil.debtCollection')!.detail ?? ''} Making a payment can restart the clock in some states, so get advice before paying an old debt.`.trim()),
      ...faq(`What is the deadline for a breach of contract claim in ${s.name}?`, f('sol-civil.writtenContract') && `${v(f('sol-civil.writtenContract'))} for written contracts${cited(f('sol-civil.writtenContract'))}${f('sol-civil.oralContract') ? ` and ${v(f('sol-civil.oralContract'))} for oral contracts${cited(f('sol-civil.oralContract'))}` : ''}.`),
      { q: 'What happens if I miss the deadline?', a: 'The other side can ask the court to dismiss the case, and courts almost always grant that. A lawyer can tell you whether an exception, such as the discovery rule or tolling for a minor, might still apply.' },
    ],
    practices: ['personal-injury', 'medical-malpractice', 'wrongful-death', 'business-law', 'consumer-protection'],
    photo: 'columns',
  },
  {
    slug: 'personal-injury-laws',
    name: 'Personal Injury Laws',
    heading: (s) => `${s.name} Personal Injury Laws`,
    description: ({ s, f }) => `${s.name} personal injury law: ${v(f('sol-injury.personalInjury'))} to sue${f('car-accident.negligenceRule') ? `, ${lc(v(f('car-accident.negligenceRule')))}` : ''}, damages rules and more, with statutes cited.`,
    fields: ['sol-injury.personalInjury', 'car-accident.negligenceRule', 'sol-injury.wrongfulDeath', 'sol-injury.propertyDamage', 'damages-bar.punitiveCap', 'damages-bar.jointSeveral'],
    lead: 'sol-injury.personalInjury',
    answer: ({ s, f }) => {
      const nr = f('car-accident.negligenceRule')
      return `In ${s.name}, an injured person generally has ${v(f('sol-injury.personalInjury'))} to file a lawsuit${cited(f('sol-injury.personalInjury'))}${nr ? `, and the state follows ${lc(v(nr))}${cited(nr)}` : ''}.`
    },
    sections: [
      {
        h: ({ s }) => `How fault affects what you can recover in ${s.name}`,
        body: ({ s, f }) => {
          const nr = f('car-accident.negligenceRule')
          return [
            nr?.value?.startsWith('Contributory') &&
              `${s.name} is one of the few places that still uses contributory negligence. Under this rule, if you were even slightly at fault for your own injury, you can be barred from recovering anything. Insurers know this, and they often argue that the injured person was partly to blame. That makes evidence about what happened especially important here.`,
            nr?.value?.startsWith('Pure') &&
              `${s.name} uses pure comparative negligence. You can recover damages even if you were mostly at fault, but your award is reduced by your share of the blame. If a jury finds your damages are $100,000 and you were 30% at fault, you would receive $70,000.`,
            has(nr, /^Modified.*51%/) &&
              `${s.name} uses modified comparative negligence with a 51% bar. You can recover if you were 50% or less at fault, reduced by your share. If you were more at fault than the other side combined, you recover nothing.`,
            has(nr, /^Modified.*50%/) &&
              `${s.name} uses modified comparative negligence with a 50% bar. You can recover only if you were less at fault than the other side (49% or less), and your award is reduced by your share.`,
            nr?.detail,
          ]
        },
      },
      {
        h: () => 'Damages you can claim',
        body: ({ f }) => [
          'Personal injury damages usually include economic losses (medical bills, future care, lost wages and lost earning capacity) and non-economic losses such as pain and suffering. Punitive damages, meant to punish especially reckless conduct, are rare and need a higher level of proof.',
          f('damages-bar.punitiveCap') && `Punitive damages here: ${v(f('damages-bar.punitiveCap'))}${cited(f('damages-bar.punitiveCap'))}. ${f('damages-bar.punitiveCap')!.detail ?? ''}`,
          f('damages-bar.jointSeveral') && `When more than one party is at fault: ${v(f('damages-bar.jointSeveral'))}${cited(f('damages-bar.jointSeveral'))}. ${f('damages-bar.jointSeveral')!.detail ?? ''}`,
        ],
      },
      {
        h: () => 'How injury lawyers are paid',
        body: () => [
          'Most personal injury lawyers work on contingency. They take a percentage of what you recover, often about a third, and nothing if you recover nothing. Case costs such as filing fees and expert witnesses are handled separately, so ask how they’re paid before you sign.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`How long do I have to file a personal injury claim in ${s.name}?`, `Generally ${v(f('sol-injury.personalInjury'))} to file a lawsuit${cited(f('sol-injury.personalInjury'))}. Insurance claims should be made much sooner, and claims against a government body have shorter notice deadlines.`),
      ...faq(`Can I recover if I was partly at fault in ${s.name}?`, f('car-accident.negligenceRule') && `${s.name} follows ${lc(v(f('car-accident.negligenceRule')))}${cited(f('car-accident.negligenceRule'))}. ${f('car-accident.negligenceRule')!.detail ?? ''}`.trim()),
      ...faq(`What is the deadline for a wrongful death lawsuit in ${s.name}?`, f('sol-injury.wrongfulDeath') && `${v(f('sol-injury.wrongfulDeath'))}${cited(f('sol-injury.wrongfulDeath'))}. ${f('sol-injury.wrongfulDeath')!.detail ?? ''}`.trim()),
      { q: 'Do I need a lawyer for a personal injury claim?', a: 'Not for every claim, but a lawyer helps when injuries are serious, fault is disputed or the insurer’s offer seems low. Most offer a free consultation and charge only if you recover.' },
    ],
    practices: ['personal-injury', 'wrongful-death', 'product-liability', 'trucking-accidents'],
    photo: 'gavel',
  },
  {
    slug: 'car-accident-laws',
    name: 'Car Accident Laws',
    heading: (s) => `${s.name} Car Accident Laws`,
    description: ({ s, f }) => `${s.name} car accident law: ${lc(v(f('car-accident.faultSystem')) || 'insurance rules')}${f('car-accident.minimumLiability') ? `, ${v(f('car-accident.minimumLiability'))} minimum coverage` : ''}, deadlines to sue and reporting rules.`,
    fields: ['car-accident.faultSystem', 'car-accident.negligenceRule', 'car-accident.minimumLiability', 'car-accident.pipRequired', 'car-accident.uninsuredMotorist', 'car-accident.accidentReport', 'sol-injury.personalInjury', 'sol-injury.propertyDamage'],
    lead: 'car-accident.faultSystem',
    answer: ({ s, f }) => {
      const fs = f('car-accident.faultSystem')!
      return `${s.name} is ${/^at-fault/i.test(v(fs)) ? 'an' : 'a'} ${lc(v(fs))} state${cited(fs)}${f('sol-injury.personalInjury') ? `, and you generally have ${v(f('sol-injury.personalInjury'))} to sue for injuries from a crash${cited(f('sol-injury.personalInjury'))}` : ''}.`
    },
    sections: [
      {
        h: ({ s }) => `Who pays after a crash in ${s.name}`,
        body: ({ s, f }) => {
          const fs = f('car-accident.faultSystem')
          return [
            has(fs, /^No-fault/i) && `In a no-fault state like ${s.name}, your own personal injury protection (PIP) coverage pays your medical bills and some lost income first, whoever caused the crash. You can step outside the no-fault system and sue the at-fault driver only if your injuries meet the state's threshold.`,
            has(fs, /^Choice/i) && `${s.name} lets drivers choose between no-fault and traditional at-fault coverage when they buy insurance. Your choice affects whether you can sue for pain and suffering after a crash, so check which option your policy has.`,
            has(fs, /^At-fault/i) && `In an at-fault state like ${s.name}, the driver who caused the crash, through their liability insurance, pays for the other people's injuries and damage. You can claim against their insurer, go through your own coverage, or file a lawsuit.`,
            fs?.detail,
          ]
        },
      },
      {
        h: () => 'Insurance you must carry',
        body: ({ f }) => [
          f('car-accident.minimumLiability') && `The minimum liability coverage is ${v(f('car-accident.minimumLiability'))}${cited(f('car-accident.minimumLiability'))}: the first number is the most paid per injured person, the second per crash for all injuries, and the third for property damage, in thousands of dollars. ${f('car-accident.minimumLiability')!.detail ?? ''}`,
          f('car-accident.pipRequired') && `Personal injury protection: ${v(f('car-accident.pipRequired'))}. ${f('car-accident.pipRequired')!.detail ?? ''}`,
          f('car-accident.uninsuredMotorist') && `Uninsured motorist coverage: ${v(f('car-accident.uninsuredMotorist'))}. ${f('car-accident.uninsuredMotorist')!.detail ?? ''}`,
          'State minimums are low compared with the cost of a serious injury. If the at-fault driver has only the minimum, your own uninsured/underinsured coverage may be what pays the rest.',
        ],
      },
      {
        h: () => 'What to do after an accident',
        body: ({ f }) => [
          'Check for injuries and call 911 if anyone is hurt. Exchange names, insurance and plate numbers, take photos of the scene and vehicles, and get witnesses’ contact details. See a doctor promptly, even if you feel fine; some injuries show up later, and a gap in treatment can hurt a claim.',
          f('car-accident.accidentReport') && `Reporting: ${v(f('car-accident.accidentReport'))}${cited(f('car-accident.accidentReport'))}. ${f('car-accident.accidentReport')!.detail ?? ''}`,
          'Tell your insurer promptly, but be careful about giving a recorded statement to the other driver’s insurer before you understand your rights.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`Is ${s.name} a no-fault state?`, f('car-accident.faultSystem') && `${s.name} is ${lc(v(f('car-accident.faultSystem')))}${cited(f('car-accident.faultSystem'))}. ${f('car-accident.faultSystem')!.detail ?? ''}`.trim()),
      ...faq(`What is the minimum car insurance in ${s.name}?`, f('car-accident.minimumLiability') && `${v(f('car-accident.minimumLiability'))} in liability coverage${cited(f('car-accident.minimumLiability'))}. ${f('car-accident.minimumLiability')!.detail ?? ''}`.trim()),
      ...faq(`How long do I have to sue after a car accident in ${s.name}?`, f('sol-injury.personalInjury') && `Generally ${v(f('sol-injury.personalInjury'))} for injuries${cited(f('sol-injury.personalInjury'))}${f('sol-injury.propertyDamage') ? ` and ${v(f('sol-injury.propertyDamage'))} for vehicle damage${cited(f('sol-injury.propertyDamage'))}` : ''}.`),
      ...faq(`Do I have to report a car accident in ${s.name}?`, f('car-accident.accidentReport') && `${v(f('car-accident.accidentReport'))}${cited(f('car-accident.accidentReport'))}. ${f('car-accident.accidentReport')!.detail ?? ''}`.trim()),
    ],
    practices: ['personal-injury', 'trucking-accidents', 'wrongful-death'],
    photo: 'gavel',
  },
  {
    slug: 'medical-malpractice-laws',
    name: 'Medical Malpractice Laws',
    heading: (s) => `${s.name} Medical Malpractice Laws`,
    description: ({ s, f }) => `${s.name} medical malpractice law: ${v(f('sol-injury.medicalMalpractice'))} to sue${f('damages-bar.medMalCap') ? `, damage cap: ${lc(v(f('damages-bar.medMalCap')))}` : ''}, and what you must do before filing.`,
    fields: ['sol-injury.medicalMalpractice', 'damages-bar.medMalCap', 'damages-bar.meritRequirement', 'damages-bar.punitiveCap', 'damages-bar.jointSeveral', 'sol-injury.wrongfulDeath'],
    lead: 'sol-injury.medicalMalpractice',
    answer: ({ s, f }) => `In ${s.name}, the deadline to file a medical malpractice lawsuit is generally ${v(f('sol-injury.medicalMalpractice'))}${cited(f('sol-injury.medicalMalpractice'))}${f('damages-bar.medMalCap') ? `, and the cap on non-economic damages is: ${lc(v(f('damages-bar.medMalCap')))}` : ''}.`,
    sections: [
      {
        h: () => 'What counts as medical malpractice',
        body: () => [
          'Malpractice is more than a bad outcome. You generally have to show that a provider owed you a duty of care, fell below the standard a reasonably careful provider in that field would meet, and that this caused you real harm. Proving it almost always takes testimony from another medical expert.',
          'Common examples include missed or late diagnoses, surgical errors, medication errors, birth injuries and failing to get informed consent.',
        ],
      },
      {
        h: ({ s }) => `Steps before you can sue in ${s.name}`,
        body: ({ f }) => [
          f('damages-bar.meritRequirement') && `${v(f('damages-bar.meritRequirement'))}${cited(f('damages-bar.meritRequirement'))}. ${f('damages-bar.meritRequirement')!.detail ?? ''}`,
          'Getting medical records and an expert review takes time, so these cases need to start well before the filing deadline.',
        ],
      },
      {
        h: () => 'Limits on damages',
        body: ({ f }) => [
          f('damages-bar.medMalCap') && `Non-economic damages: ${v(f('damages-bar.medMalCap'))}${cited(f('damages-bar.medMalCap'))}. ${f('damages-bar.medMalCap')!.detail ?? ''}`,
          'Caps, where they exist, usually limit pain-and-suffering damages, not medical bills or lost income.',
          f('sol-injury.medicalMalpractice')?.detail && `On timing: ${f('sol-injury.medicalMalpractice')!.detail}`,
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`How long do you have to sue for medical malpractice in ${s.name}?`, `${v(f('sol-injury.medicalMalpractice'))}${cited(f('sol-injury.medicalMalpractice'))}. ${f('sol-injury.medicalMalpractice')!.detail ?? ''}`.trim()),
      ...faq(`Is there a cap on medical malpractice damages in ${s.name}?`, f('damages-bar.medMalCap') && `${v(f('damages-bar.medMalCap'))}${cited(f('damages-bar.medMalCap'))}. ${f('damages-bar.medMalCap')!.detail ?? ''}`.trim()),
      ...faq(`Do I need an expert to file a malpractice case in ${s.name}?`, f('damages-bar.meritRequirement') && `${v(f('damages-bar.meritRequirement'))}${cited(f('damages-bar.meritRequirement'))}. ${f('damages-bar.meritRequirement')!.detail ?? ''}`.trim()),
      { q: 'How much does a malpractice lawyer cost?', a: 'Most work on contingency, taking a percentage of any recovery. Some states limit malpractice contingency fees. Expert and record costs can be significant, so ask who pays them and when.' },
    ],
    practices: ['medical-malpractice', 'nursing-home-abuse', 'wrongful-death'],
    photo: 'library',
  },
  {
    slug: 'divorce-laws',
    name: 'Divorce Laws',
    heading: (s) => `${s.name} Divorce Laws`,
    description: ({ s, f }) => `${s.name} divorce law: ${v(f('divorce.residency'))} residency to file${f('divorce.propertyDivision') ? `, ${lc(v(f('divorce.propertyDivision')))}` : ''}${f('divorce.waitingPeriod') ? `, waiting period: ${lc(v(f('divorce.waitingPeriod')))}` : ''}. Statutes cited.`,
    fields: ['divorce.residency', 'divorce.waitingPeriod', 'divorce.grounds', 'divorce.propertyDivision', 'divorce.childSupportGuidelines', 'divorce.legalSeparation'],
    lead: 'divorce.residency',
    answer: ({ s, f }) => `To file for divorce in ${s.name}, at least one spouse generally must have lived in the state for ${v(f('divorce.residency'))}${cited(f('divorce.residency'))}${f('divorce.propertyDivision') ? `. ${s.name} is ${/^equitable/i.test(v(f('divorce.propertyDivision'))) ? 'an' : 'a'} ${lc(v(f('divorce.propertyDivision')))} state` : ''}.`,
    sections: [
      {
        h: ({ s }) => `Grounds for divorce in ${s.name}`,
        body: ({ s, f }) => [
          f('divorce.grounds') && `${s.name}: ${lc(v(f('divorce.grounds')))}${cited(f('divorce.grounds'))}. ${f('divorce.grounds')!.detail ?? ''}`,
          'In a no-fault divorce, neither spouse has to prove the other did something wrong; it is enough that the marriage has broken down. Where fault grounds exist, they can sometimes affect alimony or property division.',
        ],
      },
      {
        h: () => 'How property is divided',
        body: ({ s, f }) => {
          const pd = f('divorce.propertyDivision')
          return [
            has(pd, /^Community/i) && `${s.name} is a community property state. Property and debts acquired during the marriage generally belong to both spouses equally and are usually divided 50/50, while property owned before the marriage or received as a gift or inheritance usually stays separate.`,
            has(pd, /^Equitable/i) && `${s.name} uses equitable distribution. Marital property is divided fairly, which isn’t always equally. Courts look at factors such as each spouse’s income and earning capacity, the length of the marriage and each spouse’s contributions, including homemaking.`,
            pd?.detail,
          ]
        },
      },
      {
        h: () => 'Children and support',
        body: ({ f }) => [
          'Custody decisions are based on the best interests of the child. Courts look at each parent’s involvement, stability and ability to support the child’s relationship with the other parent.',
          f('divorce.childSupportGuidelines') && `Child support is calculated with the ${v(f('divorce.childSupportGuidelines'))} model${cited(f('divorce.childSupportGuidelines'))}. ${f('divorce.childSupportGuidelines')!.detail ?? ''}`,
        ],
      },
      {
        h: () => 'Timing and separation',
        body: ({ f }) => [
          f('divorce.waitingPeriod') && `Waiting period: ${v(f('divorce.waitingPeriod'))}${cited(f('divorce.waitingPeriod'))}. ${f('divorce.waitingPeriod')!.detail ?? ''}`,
          f('divorce.legalSeparation') && `Legal separation: ${lc(v(f('divorce.legalSeparation')))}${cited(f('divorce.legalSeparation'))}. ${f('divorce.legalSeparation')!.detail ?? ''}`,
          'Uncontested divorces, where spouses agree on everything, move fastest. Contested cases over property, support or custody can take a year or more.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`How long do you have to live in ${s.name} to file for divorce?`, `${v(f('divorce.residency'))}${cited(f('divorce.residency'))}. ${f('divorce.residency')!.detail ?? ''}`.trim()),
      ...faq(`Is ${s.name} a community property state?`, f('divorce.propertyDivision') && (has(f('divorce.propertyDivision'), /^Community/i) ? `Yes. ${s.name} is a community property state${cited(f('divorce.propertyDivision'))}.` : `No. ${s.name} uses ${lc(v(f('divorce.propertyDivision')))}${cited(f('divorce.propertyDivision'))}, dividing marital property fairly rather than automatically 50/50.`)),
      ...faq(`Is there a waiting period for divorce in ${s.name}?`, f('divorce.waitingPeriod') && `${v(f('divorce.waitingPeriod'))}${cited(f('divorce.waitingPeriod'))}. ${f('divorce.waitingPeriod')!.detail ?? ''}`.trim()),
      ...faq(`Is ${s.name} a no-fault divorce state?`, f('divorce.grounds') && `${v(f('divorce.grounds'))}${cited(f('divorce.grounds'))}. ${f('divorce.grounds')!.detail ?? ''}`.trim()),
    ],
    practices: ['family-law'],
    photo: 'signing',
  },
  {
    slug: 'child-custody-laws',
    name: 'Child Custody Laws',
    heading: (s) => `${s.name} Child Custody Laws`,
    description: ({ s, f }) => `${s.name} child custody law: when a child's preference counts${f('custody.childPreference') ? ` (${lc(v(f('custody.childPreference')).replace(/\s*\(.*$/, ''))})` : ''}, the best-interest factors, and when child support ends${f('custody.supportEndAge') ? ` (${v(f('custody.supportEndAge')).replace(/\s*\(.*$/, '')})` : ''}. Statutes cited.`,
    fields: ['custody.childPreference', 'custody.supportEndAge', 'custody.custodyFactorsCite', 'divorce.childSupportGuidelines'],
    lead: 'custody.supportEndAge',
    answer: ({ s, f }) => {
      const pref = f('custody.childPreference')
      const age = pref && /^\d+/.exec(v(pref))?.[0]
      return `${s.name} courts decide custody by the child's best interests${cited(f('custody.custodyFactorsCite'))}. ${pref ? (age ? `From age ${age}, a child's preference carries special weight${cited(pref)}` : `There is no age at which a child can choose; the judge considers the child's wishes as one factor${cited(pref)}`) : 'A child’s wishes are one factor the judge can consider'}. Child support normally ends at ${v(f('custody.supportEndAge'))}${cited(f('custody.supportEndAge'))}.`
    },
    sections: [
      {
        h: ({ s }) => `How ${s.name} courts decide custody`,
        body: ({ s, f }) => [
          `Every custody decision in ${s.name} turns on the best interests of the child. Judges decide two things: legal custody (who makes major decisions about school, health care and religion) and physical custody (where the child lives), and either can be shared.`,
          f('custody.custodyFactorsCite') && `${has(f('custody.custodyFactorsCite'), /^No comprehensive/i) ? `${s.name}'s statute has no complete list of factors; courts apply factors from case law` : `${s.name}'s statute lists the factors a judge must weigh`}${cited(f('custody.custodyFactorsCite'))}. ${f('custody.custodyFactorsCite')!.detail ?? ''}`,
          'A parenting plan the parents agree on is usually approved if it serves the child, which keeps the decision with the people who know the child best and avoids a costly custody trial.',
        ],
      },
      {
        h: ({ s }) => `Does the child get a say in ${s.name}?`,
        body: ({ s, f }) => [
          f('custody.childPreference') && `${s.name}: ${lc(v(f('custody.childPreference')))}${cited(f('custody.childPreference'))}. ${f('custody.childPreference')!.detail ?? ''}`,
          'Judges usually hear a child’s views privately in chambers, through a guardian ad litem, or through a custody evaluator, rather than on the witness stand. A preference that is well reasoned, consistent and free of pressure from a parent carries the most weight.',
        ],
      },
      {
        h: ({ s }) => `Child support in ${s.name}`,
        body: ({ s, f }) => [
          f('custody.supportEndAge') && `Child support in ${s.name} normally ends at ${v(f('custody.supportEndAge'))}${cited(f('custody.supportEndAge'))}. ${f('custody.supportEndAge')!.detail ?? ''}`,
          f('divorce.childSupportGuidelines') && `The amount is set with the ${v(f('divorce.childSupportGuidelines'))} model${cited(f('divorce.childSupportGuidelines'))}.`,
          'Support doesn’t stop on its own in every case: check the order’s end date, and ask the court to modify it if income or parenting time changes substantially. Unpaid support doesn’t go away when the child turns 18.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`At what age can a child choose which parent to live with in ${s.name}?`, f('custody.childPreference') && `${v(f('custody.childPreference'))}${cited(f('custody.childPreference'))}. ${f('custody.childPreference')!.detail ?? ''}`.trim()),
      ...faq(`When does child support end in ${s.name}?`, f('custody.supportEndAge') && `${v(f('custody.supportEndAge'))}${cited(f('custody.supportEndAge'))}. ${f('custody.supportEndAge')!.detail ?? ''}`.trim()),
      ...faq(`What do ${s.name} judges look at to decide custody?`, f('custody.custodyFactorsCite') && `The child's best interests${cited(f('custody.custodyFactorsCite'))}. ${f('custody.custodyFactorsCite')!.detail ?? ''}`.trim()),
      { q: 'Do mothers get custody more often?', a: 'Custody laws are gender-neutral: judges are not allowed to favor a parent because they are the mother or the father. What matters is each parent’s involvement, stability and ability to meet the child’s needs and support the child’s relationship with the other parent.' },
    ],
    practices: ['family-law'],
    photo: 'signing',
  },
  {
    slug: 'recording-laws',
    name: 'Recording Laws',
    heading: (s) => `${s.name} Recording Laws`,
    description: ({ s, f }) => `${s.name} recording law: ${lc(v(f('recording.consent')))}${f('recording.penalty') ? `; illegal recording is ${lc(v(f('recording.penalty')))}` : ''}. When you can record calls and conversations, with the statute cited.`,
    fields: ['recording.consent', 'recording.penalty'],
    lead: 'recording.consent',
    answer: ({ s, f }) => {
      const c = f('recording.consent')
      return has(c, /^One-party/i)
        ? `${s.name} is a one-party consent state: you can record a conversation or phone call you take part in without telling the others${cited(c)}.`
        : has(c, /^All-party/i)
          ? `${s.name} is an all-party (two-party) consent state: everyone in a private conversation or call must agree before it is recorded${cited(c)}.`
          : `${s.name}'s recording rules are mixed: whether you need everyone's consent depends on the kind of conversation${cited(c)}.`
    },
    sections: [
      {
        h: ({ s }) => `Can you record a conversation in ${s.name}?`,
        body: ({ s, f }) => [
          f('recording.consent') && `${s.name}: ${lc(v(f('recording.consent')))}${cited(f('recording.consent'))}. ${f('recording.consent')!.detail ?? ''}`,
          'Recording laws protect conversations where people reasonably expect privacy. Talk in a public place, where anyone could overhear, generally isn’t protected the same way, but secretly recording a conversation you’re not part of is illegal almost everywhere.',
          'For calls between states, the stricter state’s rule may apply. When in doubt, tell everyone on the call it’s being recorded; their staying on the line is usually treated as consent.',
        ],
      },
      {
        h: ({ s }) => `Penalties in ${s.name}`,
        body: ({ s, f }) => [
          f('recording.penalty') && `Illegally recording or intercepting a conversation in ${s.name}: ${lc(v(f('recording.penalty')))}${cited(f('recording.penalty'))}. ${f('recording.penalty')!.detail ?? ''}`,
          'Beyond criminal charges, people recorded illegally can often sue for damages, and an illegal recording may be excluded as evidence in court, which matters in divorce, custody and employment disputes.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`Is ${s.name} a one-party consent state?`, f('recording.consent') && `${v(f('recording.consent'))}${cited(f('recording.consent'))}. ${f('recording.consent')!.detail ?? ''}`.trim()),
      ...faq(`Is it illegal to record someone without their permission in ${s.name}?`, f('recording.penalty') && `It can be: ${lc(v(f('recording.penalty')))}${cited(f('recording.penalty'))} for recording that breaks ${s.name}'s consent rule.`),
      { q: 'Can I use a secret recording in court?', a: 'Sometimes. A recording made legally can be offered as evidence if it is authenticated and relevant; one made in violation of a consent law is often excluded and can expose the person who made it to criminal and civil liability. Ask a lawyer before relying on one.' },
    ],
    practices: ['criminal-defense', 'family-law'],
    photo: 'library',
  },
  {
    slug: 'dog-bite-laws',
    name: 'Dog Bite Laws',
    heading: (s) => `${s.name} Dog Bite Laws`,
    description: ({ s, f }) => `${s.name} dog bite law${f('dog-bite.liability') ? `: ${lc(v(f('dog-bite.liability')))}` : ''}, and ${v(f('dog-bite.deadline'))} to file a claim. Who pays after a dog attack, with the statute cited.`,
    fields: ['dog-bite.liability', 'dog-bite.deadline'],
    lead: 'dog-bite.deadline',
    answer: ({ s, f }) => {
      const l = f('dog-bite.liability')
      const rule = has(l, /^Strict/i) ? `${s.name} holds dog owners strictly liable for bites, even if the dog never bit anyone before${cited(l)}` : has(l, /^One-bite/i) ? `${s.name} follows the "one-bite" rule: an owner is liable if they knew or should have known the dog was dangerous${cited(l)}` : has(l, /^Mixed/i) ? `${s.name}'s dog bite rule is partly strict liability, depending on how the injury happened${cited(l)}` : `In ${s.name}, a dog owner can be liable for a bite`
      return `${rule}. You generally have ${v(f('dog-bite.deadline'))} to file a lawsuit${cited(f('dog-bite.deadline'))}.`
    },
    sections: [
      {
        h: ({ s }) => `Who is liable for a dog bite in ${s.name}?`,
        body: ({ s, f }) => [
          f('dog-bite.liability') && `${s.name}: ${lc(v(f('dog-bite.liability')))}${cited(f('dog-bite.liability'))}. ${f('dog-bite.liability')!.detail ?? ''}`,
          'Under strict liability, the victim doesn’t have to prove the owner did anything wrong. Under the one-bite rule, the victim must show the owner knew the dog had dangerous tendencies, for example an earlier bite, growling and lunging, or a warning sign. In every state, an owner who was negligent (such as breaking a leash law) can also be liable.',
          'Defenses usually include provoking the dog and trespassing. Most dog bite claims are paid by the owner’s homeowner’s or renter’s insurance, not out of pocket.',
        ],
      },
      {
        h: () => 'What to do after a dog bite',
        body: ({ s, f }) => [
          'Get medical care right away; bites infect easily and rabies exposure must be ruled out. Identify the dog and owner, photograph the injuries and the scene, get witness names, and report the bite to animal control or the local health department.',
          f('dog-bite.deadline') && `The deadline to sue in ${s.name} is ${v(f('dog-bite.deadline'))}${cited(f('dog-bite.deadline'))}. ${f('dog-bite.deadline')!.detail ?? ''}`,
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`Is ${s.name} a strict liability state for dog bites?`, f('dog-bite.liability') && `${v(f('dog-bite.liability'))}${cited(f('dog-bite.liability'))}. ${f('dog-bite.liability')!.detail ?? ''}`.trim()),
      ...faq(`How long do you have to sue for a dog bite in ${s.name}?`, f('dog-bite.deadline') && `${v(f('dog-bite.deadline'))}${cited(f('dog-bite.deadline'))}. ${f('dog-bite.deadline')!.detail ?? ''}`.trim()),
      { q: 'Does homeowner’s insurance cover dog bites?', a: 'Usually, yes. Most homeowner’s and renter’s policies include liability coverage that pays for injuries caused by the policyholder’s dog, up to the policy limit, though some exclude certain breeds or dogs with a bite history.' },
    ],
    practices: ['personal-injury'],
    photo: 'justice',
  },
  {
    slug: 'dui-laws',
    name: 'DUI Laws',
    heading: (s) => `${s.name} DUI Laws`,
    description: ({ s, f }) => `${s.name} ${v(f('dui.name')) || 'DUI'} law: ${v(f('dui.bacLimit'))} legal limit${f('dui.under21') ? `, ${v(f('dui.under21'))} under 21` : ''}, test refusal, ignition interlock and repeat-offense rules.`,
    fields: ['dui.name', 'dui.bacLimit', 'dui.under21', 'dui.commercial', 'dui.refusalSuspension', 'dui.interlockFirstOffense', 'dui.lookback'],
    lead: 'dui.bacLimit',
    answer: ({ s, f }) => `In ${s.name}, it is illegal to drive with a blood alcohol concentration of ${v(f('dui.bacLimit'))} or higher if you are 21 or older${cited(f('dui.bacLimit'))}${f('dui.under21') ? `; for drivers under 21 the limit is ${lc(v(f('dui.under21')))}` : ''}.`,
    sections: [
      {
        h: ({ s, f }) => `How ${v(f('dui.name')) || 'DUI'} works in ${s.name}`,
        body: ({ s, f }) => [
          `${f('dui.name') ? `${s.name} calls the offense ${v(f('dui.name'))}${cited(f('dui.name'))}. ` : ''}You can be charged in two ways: for driving with a BAC at or over the legal limit ("per se"), or for driving while impaired by alcohol or drugs, even below the limit.`,
          f('dui.commercial') && `Commercial drivers face a stricter limit of ${v(f('dui.commercial'))} while driving a commercial vehicle.`,
          'A DUI usually leads to two separate cases: a criminal case in court and an administrative case over your driver’s license, often with its own short deadline to request a hearing.',
        ],
      },
      {
        h: () => 'Refusing a breath or blood test',
        body: ({ f }) => [
          'By driving on public roads you are treated as having agreed to chemical testing if lawfully arrested for DUI ("implied consent"). Refusing usually brings an automatic license suspension, separate from any criminal penalty, and the refusal can often be used as evidence.',
          f('dui.refusalSuspension') && `First refusal: ${v(f('dui.refusalSuspension'))}${cited(f('dui.refusalSuspension'))}. ${f('dui.refusalSuspension')!.detail ?? ''}`,
        ],
      },
      {
        h: () => 'Ignition interlock and repeat offenses',
        body: ({ f }) => [
          f('dui.interlockFirstOffense') && `Ignition interlock for a first offense: ${lc(v(f('dui.interlockFirstOffense')))}${cited(f('dui.interlockFirstOffense'))}. ${f('dui.interlockFirstOffense')!.detail ?? ''}`,
          f('dui.lookback') && `Prior offenses count toward harsher repeat-offense penalties for ${lookback(f('dui.lookback'))}${cited(f('dui.lookback'))}.`,
          'Penalties rise sharply with a high BAC, a crash with injuries, a child in the car or prior convictions. A DUI defense lawyer can review the stop, the testing and deadlines in your case.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`What is the legal alcohol limit in ${s.name}?`, `${v(f('dui.bacLimit'))} for drivers 21 and older${cited(f('dui.bacLimit'))}${f('dui.under21') ? `, ${lc(v(f('dui.under21')))} for drivers under 21` : ''}${f('dui.commercial') ? `, and ${v(f('dui.commercial'))} for commercial drivers` : ''}.`),
      ...faq(`What happens if you refuse a breathalyzer in ${s.name}?`, f('dui.refusalSuspension') && `A first refusal brings a license suspension: ${lc(v(f('dui.refusalSuspension')))}${cited(f('dui.refusalSuspension'))}. ${f('dui.refusalSuspension')!.detail ?? ''}`.trim()),
      ...faq(`Is an ignition interlock required for a first DUI in ${s.name}?`, f('dui.interlockFirstOffense') && `${v(f('dui.interlockFirstOffense'))}${cited(f('dui.interlockFirstOffense'))}. ${f('dui.interlockFirstOffense')!.detail ?? ''}`.trim()),
      ...faq(`How long does a DUI stay on your record in ${s.name}?`, f('dui.lookback') && `For sentencing repeat offenses, prior DUIs count for ${lookback(f('dui.lookback'))}${cited(f('dui.lookback'))}. How long it appears on your criminal or driving record can differ; ask a local lawyer about sealing or expungement.`),
    ],
    practices: ['dui-dwi', 'criminal-defense'],
    photo: 'justice',
  },
  {
    slug: 'small-claims-court',
    name: 'Small Claims Court',
    heading: (s) => `${s.name} Small Claims Court`,
    description: ({ s, f }) => `${s.name} small claims court: sue for up to ${v(f('small-claims.smallClaimsLimit'))}${f('small-claims.smallClaimsCourt') ? ` in ${v(f('small-claims.smallClaimsCourt'))}` : ''}. Rules on lawyers, deadlines and security deposit disputes.`,
    fields: ['small-claims.smallClaimsLimit', 'small-claims.smallClaimsCourt', 'small-claims.lawyersAllowed', 'small-claims.securityDepositReturn', 'small-claims.securityDepositCap', 'sol-civil.writtenContract', 'sol-civil.oralContract'],
    lead: 'small-claims.smallClaimsLimit',
    answer: ({ s, f }) => `In ${s.name}, you can sue for up to ${v(f('small-claims.smallClaimsLimit'))} in small claims court${cited(f('small-claims.smallClaimsLimit'))}${f('small-claims.smallClaimsCourt') ? `, which is heard by ${lc(v(f('small-claims.smallClaimsCourt')))}` : ''}.`,
    sections: [
      {
        h: () => 'What small claims court is for',
        body: ({ f }) => [
          'Small claims court is a simpler, faster and cheaper way to resolve money disputes, such as unpaid bills or loans, damaged property, a contractor who didn’t finish a job, or a landlord who kept a security deposit. Filing fees are modest and the rules of evidence are relaxed.',
          f('small-claims.smallClaimsLimit')?.detail,
          f('small-claims.lawyersAllowed') && `Lawyers: ${v(f('small-claims.lawyersAllowed'))}${cited(f('small-claims.lawyersAllowed'))}. ${f('small-claims.lawyersAllowed')!.detail ?? ''}`,
        ],
      },
      {
        h: () => 'How to file',
        body: () => [
          'Ask for payment in writing first; many courts expect a demand letter. Then file a claim form in the right county (usually where the other party lives or where the dispute happened), pay the filing fee and have the other side formally served. Bring contracts, receipts, photos, texts and any witnesses to the hearing.',
          'Winning gets you a judgment, but collecting it is up to you. If the other side doesn’t pay, ask the court clerk about wage garnishment or bank levies.',
        ],
      },
      {
        h: ({ s }) => `Security deposit disputes in ${s.name}`,
        body: ({ f }) => [
          f('small-claims.securityDepositReturn') && `Landlords must return a deposit, or send an itemized list of deductions, within ${lc(v(f('small-claims.securityDepositReturn')))}${cited(f('small-claims.securityDepositReturn'))}. ${f('small-claims.securityDepositReturn')!.detail ?? ''}`,
          f('small-claims.securityDepositCap') && `Deposit limit: ${v(f('small-claims.securityDepositCap'))}${cited(f('small-claims.securityDepositCap'))}. ${f('small-claims.securityDepositCap')!.detail ?? ''}`,
          'Take dated photos when you move in and out, and send your forwarding address in writing. Those two steps decide many deposit cases.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`What is the small claims limit in ${s.name}?`, `${v(f('small-claims.smallClaimsLimit'))}${cited(f('small-claims.smallClaimsLimit'))}. ${f('small-claims.smallClaimsLimit')!.detail ?? ''}`.trim()),
      ...faq(`Can you have a lawyer in ${s.name} small claims court?`, f('small-claims.lawyersAllowed') && `${v(f('small-claims.lawyersAllowed'))}. ${f('small-claims.lawyersAllowed')!.detail ?? ''}`.trim()),
      ...faq(`How long does a landlord have to return a security deposit in ${s.name}?`, f('small-claims.securityDepositReturn') && `${v(f('small-claims.securityDepositReturn'))}${cited(f('small-claims.securityDepositReturn'))}. ${f('small-claims.securityDepositReturn')!.detail ?? ''}`.trim()),
      ...faq(`How long do I have to file a small claims case in ${s.name}?`, f('sol-civil.writtenContract') && `It depends on the claim. For example, ${v(f('sol-civil.writtenContract'))} for a written contract${f('sol-civil.oralContract') ? ` and ${v(f('sol-civil.oralContract'))} for an oral agreement` : ''}. See the full list on our ${s.name} statute of limitations page.`),
    ],
    practices: ['consumer-protection', 'business-law', 'real-estate'],
    photo: 'columns',
  },
  {
    slug: 'wills-and-probate',
    name: 'Wills and Probate',
    heading: (s) => `${s.name} Wills and Probate Laws`,
    description: ({ s, f }) => `${s.name} wills and probate: ${v(f('wills.witnesses'))}${f('wills.holographic') ? `, handwritten wills ${lc(v(f('wills.holographic')))}` : ''}${f('wills.smallEstate') ? `, small estates up to ${v(f('wills.smallEstate'))}` : ''}.`,
    fields: ['wills.witnesses', 'wills.holographic', 'wills.selfProving', 'wills.electronicWills', 'wills.smallEstate', 'wills.estateTax'],
    lead: 'wills.witnesses',
    answer: ({ s, f }) => `A will in ${s.name} must be signed by the person making it, and the witnessing rule is: ${lc(v(f('wills.witnesses')))}${cited(f('wills.witnesses'))}${f('wills.holographic') ? `. Handwritten, unwitnessed wills: ${lc(v(f('wills.holographic')))}` : ''}.`,
    sections: [
      {
        h: ({ s }) => `Making a valid will in ${s.name}`,
        body: ({ f }) => [
          'To make a will you must be an adult of sound mind, and the will must be signed with the formalities the state requires. A will that misses a formality can be thrown out, leaving your property to pass under the default inheritance rules.',
          f('wills.witnesses')?.detail,
          f('wills.holographic') && `Handwritten (holographic) wills: ${v(f('wills.holographic'))}${cited(f('wills.holographic'))}. ${f('wills.holographic')!.detail ?? ''}`,
          f('wills.selfProving') && `Self-proving affidavit: ${v(f('wills.selfProving'))}${cited(f('wills.selfProving'))}. A self-proving affidavit, signed before a notary, lets the court accept the will without tracking down the witnesses later. ${f('wills.selfProving')!.detail ?? ''}`,
          f('wills.electronicWills') && `Electronic wills: ${v(f('wills.electronicWills'))}${cited(f('wills.electronicWills'))}. ${f('wills.electronicWills')!.detail ?? ''}`,
        ],
      },
      {
        h: () => 'Probate and small estates',
        body: ({ f }) => [
          'Probate is the court process that confirms a will, pays debts and transfers property. Assets with a named beneficiary (life insurance, retirement accounts, payable-on-death accounts) and property in a living trust usually pass outside probate.',
          f('wills.smallEstate') && `Small estates: ${v(f('wills.smallEstate'))}${cited(f('wills.smallEstate'))}. ${f('wills.smallEstate')!.detail ?? ''}`,
        ],
      },
      {
        h: () => 'Estate and inheritance tax',
        body: ({ s, f }) => [
          f('wills.estateTax') && `${s.name}: ${v(f('wills.estateTax'))}${cited(f('wills.estateTax'))}. ${f('wills.estateTax')!.detail ?? ''}`,
          'The federal estate tax applies only to very large estates. An estate planning lawyer can tell you whether trusts or gifting make sense for you.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`How many witnesses does a will need in ${s.name}?`, `${v(f('wills.witnesses'))}${cited(f('wills.witnesses'))}. ${f('wills.witnesses')!.detail ?? ''}`.trim()),
      ...faq(`Are handwritten wills valid in ${s.name}?`, f('wills.holographic') && `${v(f('wills.holographic'))}${cited(f('wills.holographic'))}. ${f('wills.holographic')!.detail ?? ''}`.trim()),
      ...faq(`Can you avoid probate for a small estate in ${s.name}?`, f('wills.smallEstate') && `${s.name} has a simplified process for estates up to ${v(f('wills.smallEstate'))}${cited(f('wills.smallEstate'))}. ${f('wills.smallEstate')!.detail ?? ''}`.trim()),
      ...faq(`Does ${s.name} have an estate or inheritance tax?`, f('wills.estateTax') && `${v(f('wills.estateTax'))}${cited(f('wills.estateTax'))}. ${f('wills.estateTax')!.detail ?? ''}`.trim()),
    ],
    practices: ['estate-planning', 'elder-law'],
    photo: 'signing',
  },
  {
    slug: 'employment-laws',
    name: 'Employment Laws',
    heading: (s) => `${s.name} Employment Laws`,
    description: ({ s, f }) => `${s.name} employment law: minimum wage ${v(f('employment.minimumWage'))}${f('employment.tippedWage') ? `, tipped wage ${v(f('employment.tippedWage'))}` : ''}, and how and when to file a discrimination complaint.`,
    fields: ['employment.minimumWage', 'employment.tippedWage', 'employment.fairEmploymentAgency', 'employment.discriminationDeadline'],
    lead: 'employment.minimumWage',
    answer: ({ s, f }) => `The minimum wage in ${s.name} is ${v(f('employment.minimumWage'))}${cited(f('employment.minimumWage'))}${f('employment.tippedWage') ? `, and the minimum cash wage for tipped employees is ${v(f('employment.tippedWage'))}` : ''}.`,
    sections: [
      {
        h: () => 'Wages',
        body: ({ f }) => [
          f('employment.minimumWage')?.detail,
          'Where state and federal minimum wages differ, workers are entitled to the higher one. Some cities and counties set their own, higher minimums. Most hourly workers must be paid overtime at 1.5 times their regular rate for hours over 40 in a week, and a few states also require daily overtime.',
          f('employment.tippedWage') && `Tipped employees can be paid a lower cash wage of ${v(f('employment.tippedWage'))} if tips bring them up to the full minimum; if they don’t, the employer must make up the difference. ${f('employment.tippedWage')!.detail ?? ''}`,
        ],
      },
      {
        h: () => 'Discrimination and harassment',
        body: ({ s, f }) => [
          'Federal law prohibits job discrimination based on race, color, religion, sex (including pregnancy, sexual orientation and gender identity), national origin, age (40+), disability and genetic information, and protects employees who complain about it. Many state laws cover more employers and more categories.',
          f('employment.fairEmploymentAgency') && `In ${s.name}, discrimination complaints can be filed with the ${v(f('employment.fairEmploymentAgency'))}${cited(f('employment.fairEmploymentAgency'))}, as well as with the federal Equal Employment Opportunity Commission (EEOC).`,
          f('employment.discriminationDeadline') && `Deadline: ${v(f('employment.discriminationDeadline'))}${cited(f('employment.discriminationDeadline'))}. ${f('employment.discriminationDeadline')!.detail ?? ''}`,
          'You usually must file an agency charge before you can sue under these laws, so the agency deadline is the one that matters most.',
        ],
      },
      {
        h: () => 'At-will employment',
        body: ({ s }) => [
          `Like most states, ${s.name} generally follows at-will employment: an employer can end employment for any reason that isn’t illegal, and an employee can quit at any time. Firing someone for a discriminatory reason, in retaliation for a complaint or for taking protected leave is still illegal, as is breaking an employment contract.`,
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`What is the minimum wage in ${s.name}?`, `${v(f('employment.minimumWage'))}${cited(f('employment.minimumWage'))}. ${f('employment.minimumWage')!.detail ?? ''}`.trim()),
      ...faq(`What is the tipped minimum wage in ${s.name}?`, f('employment.tippedWage') && `${v(f('employment.tippedWage'))}${cited(f('employment.tippedWage'))}, as long as tips bring total pay to at least the full minimum wage.`),
      ...faq(`How long do I have to file a discrimination complaint in ${s.name}?`, f('employment.discriminationDeadline') && `${v(f('employment.discriminationDeadline'))} with the state agency${cited(f('employment.discriminationDeadline'))}. ${f('employment.discriminationDeadline')!.detail ?? ''}`.trim()),
      ...faq(`Where do I file a job discrimination complaint in ${s.name}?`, f('employment.fairEmploymentAgency') && `With the ${v(f('employment.fairEmploymentAgency'))}, or with the federal EEOC. Filing with one is usually treated as filing with both.`),
    ],
    practices: ['employment-law', 'sexual-harassment'],
    photo: 'library',
  },
  {
    slug: 'workers-compensation-laws',
    name: 'Workers’ Compensation Laws',
    heading: (s) => `${s.name} Workers’ Compensation Laws`,
    description: ({ s, f }) => `${s.name} workers’ comp: tell your employer within ${lc(v(f('employment.wcInjuryNotice')))}${f('employment.wcClaimDeadline') ? ` and file a claim within ${lc(v(f('employment.wcClaimDeadline')))}` : ''}. What it covers and how to file.`,
    fields: ['employment.wcInjuryNotice', 'employment.wcClaimDeadline', 'employment.wcAgency'],
    lead: 'employment.wcInjuryNotice',
    answer: ({ s, f }) => `In ${s.name}, an injured worker should report a work injury to the employer within ${lc(v(f('employment.wcInjuryNotice')))}${cited(f('employment.wcInjuryNotice'))}${f('employment.wcClaimDeadline') ? `, and the deadline to file a workers’ compensation claim is ${lc(v(f('employment.wcClaimDeadline')))}` : ''}.`,
    sections: [
      {
        h: () => 'What workers’ comp covers',
        body: () => [
          'Workers’ compensation is no-fault insurance for job injuries and work-related illnesses. It pays medical treatment and a portion of lost wages, usually about two-thirds of your average weekly pay up to a state maximum, plus benefits for permanent impairment and death benefits for dependents.',
          'In exchange, workers generally can’t sue their employer for the injury. You may still have a separate claim against someone else who caused it, such as a negligent driver or the maker of defective equipment.',
        ],
      },
      {
        h: ({ s }) => `Deadlines in ${s.name}`,
        body: ({ f }) => [
          f('employment.wcInjuryNotice') && `Notice to your employer: ${v(f('employment.wcInjuryNotice'))}${cited(f('employment.wcInjuryNotice'))}. ${f('employment.wcInjuryNotice')!.detail ?? ''}`,
          f('employment.wcClaimDeadline') && `Filing a claim: ${v(f('employment.wcClaimDeadline'))}${cited(f('employment.wcClaimDeadline'))}. ${f('employment.wcClaimDeadline')!.detail ?? ''}`,
          'Report the injury in writing and keep a copy. Late notice is one of the most common reasons claims are denied.',
        ],
      },
      {
        h: () => 'If your claim is denied',
        body: ({ f }) => [
          f('employment.wcAgency') && `Disputes are handled by the ${v(f('employment.wcAgency'))}${cited(f('employment.wcAgency'))}.`,
          'Workers’ comp lawyers are usually paid a percentage of the benefits they win, and many states cap or require approval of the fee. Most offer a free consultation.',
        ],
      },
    ],
    faqs: ({ s, f }) => [
      ...faq(`How long do I have to report a work injury in ${s.name}?`, `${v(f('employment.wcInjuryNotice'))}${cited(f('employment.wcInjuryNotice'))}. ${f('employment.wcInjuryNotice')!.detail ?? ''}`.trim()),
      ...faq(`What is the deadline to file a workers’ comp claim in ${s.name}?`, f('employment.wcClaimDeadline') && `${v(f('employment.wcClaimDeadline'))}${cited(f('employment.wcClaimDeadline'))}. ${f('employment.wcClaimDeadline')!.detail ?? ''}`.trim()),
      ...faq(`Who handles workers’ compensation in ${s.name}?`, f('employment.wcAgency') && `The ${v(f('employment.wcAgency'))}.`),
      { q: 'Can I be fired for filing a workers’ comp claim?', a: 'Most states prohibit firing or punishing an employee for filing a workers’ compensation claim. If that happens, talk to an employment or workers’ comp lawyer promptly.' },
    ],
    practices: ['workers-compensation', 'employment-law'],
    photo: 'gavel',
  },
]

export const topicBySlug = (slug: string) => TOPICS.find((t) => t.slug === slug)

/** Topics that have their lead fact verified for a state (so the page exists). */
export const topicsFor = (code: string) => TOPICS.filter((t) => fact(code, t.lead))

/** Topics relevant to a practice area, the one written for it first. */
export const topicsForPractice = (practice: string) =>
  TOPICS.filter((t) => t.practices.includes(practice)).sort((a, b) => a.practices.indexOf(practice) - b.practices.indexOf(practice))

/** One headline fact per topic for "at a glance" tables, without repeats. */
export function glanceRows(c: Ctx, base: string) {
  const seen = new Set<string>()
  return topicsFor(c.s.code).flatMap((t) => {
    const alt: FieldKey | null = t.slug === 'personal-injury-laws' ? 'car-accident.negligenceRule' : t.slug === 'car-accident-laws' ? 'car-accident.minimumLiability' : null
    const key = alt && c.f(alt) && !seen.has(alt) ? alt : t.lead
    if (seen.has(key)) return []
    seen.add(key)
    return [{ key, f: c.f(key)!, href: `${base}/${t.slug}`, label: `${t.name}: ${FIELDS[key].label.toLowerCase()}` }]
  })
}

/** Paragraphs with the empty ones (facts we don't have) removed. */
export const paras = (list: Para[]) => list.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
