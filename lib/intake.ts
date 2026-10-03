// Intake questions: a few extra questions on a request form, chosen per page
// to fit the practice area (a personal injury page asks what happened and
// when; an estate planning page asks what they need). Answers arrive with
// the lead, so the first call starts informed. Every question is optional,
// so they never stop someone from sending the form.
//
// Law sets include the other party's name, so the firm can check for a
// conflict of interest before calling back. Medical sets ask nothing
// clinical and say not to send medical details through the form.

export type IntakeKind = 'text' | 'choice' | 'date' | 'yesno'
export interface IntakeQuestion {
  id: string
  label: string
  kind: IntakeKind
  options?: string[]
}
export interface IntakeSet {
  label: string
  group: 'Law' | 'Medical' | 'Med spa' | 'Home services'
  note?: string
  questions: IntakeQuestion[]
}

const OTHER_PARTY: IntakeQuestion = { id: 'other_party', label: 'Name of the other person or company involved, if any', kind: 'text' }

export const INTAKE_SETS: Record<string, IntakeSet> = {
  'personal-injury': {
    label: 'Personal injury',
    group: 'Law',
    questions: [
      { id: 'what', label: 'What happened?', kind: 'choice', options: ['Car accident', 'Truck accident', 'Motorcycle accident', 'Slip and fall', 'Injury at work', 'Something else'] },
      { id: 'when', label: 'When did it happen?', kind: 'date' },
      { id: 'hurt', label: 'Were you hurt?', kind: 'choice', options: ['Yes, and I’ve seen a doctor', 'Yes, I haven’t seen a doctor yet', 'No'] },
      { id: 'insurer', label: 'Have you spoken with an insurance company?', kind: 'yesno' },
      OTHER_PARTY,
    ],
  },
  'estate-planning': {
    label: 'Estate planning and probate',
    group: 'Law',
    questions: [
      { id: 'need', label: 'What do you need help with?', kind: 'choice', options: ['A will', 'A trust', 'Power of attorney', 'Probate after a death', 'Not sure yet'] },
      { id: 'for', label: 'Is this for you or a family member?', kind: 'choice', options: ['For me', 'For a family member'] },
      { id: 'property', label: 'Do you own a home or other property?', kind: 'yesno' },
    ],
  },
  'family-law': {
    label: 'Family law',
    group: 'Law',
    questions: [
      { id: 'matter', label: 'What is it about?', kind: 'choice', options: ['Divorce', 'Custody', 'Child support', 'Adoption', 'Something else'] },
      { id: 'children', label: 'Are children involved?', kind: 'yesno' },
      { id: 'court', label: 'Upcoming court date, if any', kind: 'date' },
      OTHER_PARTY,
    ],
  },
  'criminal-defense': {
    label: 'Criminal defense',
    group: 'Law',
    questions: [
      { id: 'charge', label: 'What is the charge?', kind: 'choice', options: ['DUI or DWI', 'Drug charge', 'Assault', 'Theft', 'Traffic offense', 'Something else'] },
      { id: 'court', label: 'Court date, if you have one', kind: 'date' },
      { id: 'custody', label: 'Is the person in custody now?', kind: 'yesno' },
    ],
  },
  employment: {
    label: 'Employment law',
    group: 'Law',
    questions: [
      { id: 'issue', label: 'What happened?', kind: 'choice', options: ['Fired or let go', 'Unpaid wages or overtime', 'Discrimination or harassment', 'Contract or severance', 'Something else'] },
      { id: 'still', label: 'Do you still work there?', kind: 'yesno' },
      { ...OTHER_PARTY, label: 'Employer’s name' },
    ],
  },
  business: {
    label: 'Business law',
    group: 'Law',
    questions: [
      { id: 'need', label: 'What do you need help with?', kind: 'choice', options: ['Starting a business', 'A contract', 'A dispute', 'Buying or selling a business', 'Something else'] },
      OTHER_PARTY,
    ],
  },
  'new-patient': {
    label: 'New patient appointment',
    group: 'Medical',
    note: 'Please don’t include detailed medical information here; we’ll talk it through when we call.',
    questions: [
      { id: 'patient', label: 'Are you a new or returning patient?', kind: 'choice', options: ['New patient', 'Returning patient'] },
      { id: 'insurance', label: 'Insurance provider, if any', kind: 'text' },
      { id: 'time', label: 'Best time for an appointment', kind: 'choice', options: ['Mornings', 'Afternoons', 'Any time'] },
    ],
  },
  'medspa-consult': {
    label: 'Consultation request',
    group: 'Med spa',
    questions: [
      { id: 'treatment', label: 'Which treatment are you interested in?', kind: 'text' },
      { id: 'before', label: 'Have you had this treatment before?', kind: 'yesno' },
      { id: 'time', label: 'Best time for a consultation', kind: 'choice', options: ['Weekday', 'Evening', 'Weekend', 'Any time'] },
    ],
  },
  'home-job': {
    label: 'Job request',
    group: 'Home services',
    questions: [
      { id: 'urgency', label: 'How soon do you need us?', kind: 'choice', options: ['It’s an emergency', 'This week', 'Planning ahead'] },
      { id: 'zip', label: 'ZIP code of the job', kind: 'text' },
      { id: 'own', label: 'Do you own or rent the property?', kind: 'choice', options: ['Own', 'Rent'] },
    ],
  },
}

export const intakeSet = (key: string | undefined): IntakeSet | undefined => (key ? INTAKE_SETS[key] : undefined)

// A sensible set for a page, from its address and name, for the owner to
// confirm. Never applied without them choosing it.
export function suggestIntake(slug: string, name: string): string | undefined {
  const s = `${slug} ${name}`.toLowerCase()
  if (/injur|accident|crash|wreck|slip|malpractice/.test(s)) return 'personal-injury'
  if (/estate|probate|will|trust/.test(s)) return 'estate-planning'
  if (/family|divorce|custody|child/.test(s)) return 'family-law'
  if (/criminal|dui|dwi|defen[cs]e/.test(s)) return 'criminal-defense'
  if (/employ|wage|discriminat/.test(s)) return 'employment'
  if (/business|contract|corporate/.test(s)) return 'business'
  if (/patient|appointment|clinic|medic|doctor|ortho|dental|dentist/.test(s)) return 'new-patient'
  if (/aesthetic|botox|filler|facial|laser|spa/.test(s)) return 'medspa-consult'
  if (/plumb|hvac|heating|roof|electric|repair|install/.test(s)) return 'home-job'
  return undefined
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

// The answers a form post carries for a set, checked against it: choices
// must be one of the options, dates real dates, text short. Anything else
// is dropped. Returns [label, answer] pairs in question order.
export function readAnswers(set: IntakeSet | undefined, get: (name: string) => string, yes = 'Yes', no = 'No'): [string, string][] {
  if (!set) return []
  const out: [string, string][] = []
  for (const q of set.questions) {
    const v = get(`q_${q.id}`).trim()
    if (!v) continue
    if (q.kind === 'choice' && !q.options?.includes(v)) continue
    if (q.kind === 'yesno' && v !== 'yes' && v !== 'no') continue
    if (q.kind === 'date' && !DATE.test(v)) continue
    out.push([q.label, q.kind === 'yesno' ? (v === 'yes' ? yes : no) : v.slice(0, 300)])
  }
  return out
}

export const answersText = (answers: [string, string][]) => answers.map(([q, a]) => `${q}${/[?:]$/.test(q) ? '' : ':'} ${a}`).join('\n')
