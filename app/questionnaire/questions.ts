/* =====================================================================
   Questionnaire content
   ---------------------------------------------------------------------
   ⚠️  PLACEHOLDER CONTENT — swap this out for the real questionnaire.
   Everything the flow renders comes from the objects below, so you can
   replace copy, questions, and options here without touching any of the
   component / styling code in ./components/questionnaire.tsx.

   Question `kind`:
     - 'single'  → pick one option (auto-advances)
     - 'multi'   → pick many options
     - 'scale'   → 1..N rating
     - 'short'   → single-line text
     - 'long'    → multi-line text
     - 'email'   → validated email input
   ===================================================================== */

export interface Option {
  value: string
  label: string
  description?: string
}

export type Question =
  | {
      id: string
      kind: 'single'
      section?: string
      title: string
      help?: string
      required?: boolean
      options: Option[]
    }
  | {
      id: string
      kind: 'multi'
      section?: string
      title: string
      help?: string
      required?: boolean
      options: Option[]
    }
  | {
      id: string
      kind: 'scale'
      section?: string
      title: string
      help?: string
      required?: boolean
      min: number
      max: number
      minLabel?: string
      maxLabel?: string
    }
  | {
      id: string
      kind: 'short' | 'long' | 'email'
      section?: string
      title: string
      help?: string
      required?: boolean
      placeholder?: string
    }

export const intro = {
  eyebrow: 'True Point · Systems Assessment',
  title: 'Find your true point.',
  subtitle:
    'A short, honest look at how your business actually runs today — and where the leverage is hiding. Takes about 3 minutes. No wrong answers.',
  cta: 'Start assessment',
  meta: '9 questions · ~3 min',
}

export const outro = {
  eyebrow: 'All done',
  title: 'That’s your true point.',
  subtitle:
    'Thanks for the honesty. We’ll map your answers against the True Point framework and send your personalized systems breakdown shortly.',
  cta: 'Submit answers',
  doneTitle: 'Answers received.',
  doneSubtitle:
    'Your responses are in. Keep an eye on your inbox — your tailored roadmap is on the way.',
}

export const questions: Question[] = [
  {
    id: 'stage',
    kind: 'single',
    section: 'Where you are',
    title: 'Which best describes your business right now?',
    help: 'Pick the one that fits today, not where you’re headed.',
    required: true,
    options: [
      { value: 'idea', label: 'Just getting started', description: 'Pre-revenue or first few customers' },
      { value: 'growing', label: 'Growing fast', description: 'Revenue climbing, systems straining' },
      { value: 'plateau', label: 'Hit a plateau', description: 'Steady, but stuck at the same level' },
      { value: 'scaling', label: 'Scaling deliberately', description: 'Building to multiply, not just grow' },
    ],
  },
  {
    id: 'bottleneck',
    kind: 'single',
    section: 'Where you are',
    title: 'What’s the single biggest thing holding you back?',
    required: true,
    options: [
      { value: 'time', label: 'Not enough time', description: 'Everything runs through me' },
      { value: 'people', label: 'The right people', description: 'Hiring, delegating, or trust' },
      { value: 'process', label: 'Repeatable process', description: 'Too much is improvised' },
      { value: 'clarity', label: 'Clarity & focus', description: 'Too many priorities at once' },
    ],
  },
  {
    id: 'owner_dependence',
    kind: 'scale',
    section: 'How it runs',
    title: 'If you disappeared for 30 days, how well would things run?',
    help: '1 = it would fall apart · 10 = it wouldn’t skip a beat',
    required: true,
    min: 1,
    max: 10,
    minLabel: 'Falls apart',
    maxLabel: 'Runs itself',
  },
  {
    id: 'systems',
    kind: 'multi',
    section: 'How it runs',
    title: 'Which of these do you already have documented?',
    help: 'Choose all that apply.',
    options: [
      { value: 'sales', label: 'Sales process' },
      { value: 'onboarding', label: 'Client onboarding' },
      { value: 'delivery', label: 'Service / product delivery' },
      { value: 'hiring', label: 'Hiring & training' },
      { value: 'finance', label: 'Financial dashboard' },
      { value: 'none', label: 'None of these yet' },
    ],
  },
  {
    id: 'confidence',
    kind: 'scale',
    section: 'How it runs',
    title: 'How confident are you in your numbers on any given day?',
    required: true,
    min: 1,
    max: 5,
    minLabel: 'Flying blind',
    maxLabel: 'Crystal clear',
  },
  {
    id: 'priority',
    kind: 'single',
    section: 'Where you’re headed',
    title: 'Over the next 12 months, what matters most?',
    required: true,
    options: [
      { value: 'profit', label: 'More profit', description: 'Same effort, better margins' },
      { value: 'freedom', label: 'More freedom', description: 'Get out of the day-to-day' },
      { value: 'growth', label: 'More growth', description: 'Bigger footprint, faster' },
      { value: 'stability', label: 'More stability', description: 'Predictable, calm operations' },
    ],
  },
  {
    id: 'goal',
    kind: 'long',
    section: 'Where you’re headed',
    title: 'In one sentence — what does “fixed” look like for you?',
    help: 'Say it plainly. This is the point we’ll aim at.',
    placeholder: 'e.g. The business runs a full week without me touching it…',
  },
  {
    id: 'name',
    kind: 'short',
    section: 'Stay in touch',
    title: 'First, what should we call you?',
    required: true,
    placeholder: 'Your name',
  },
  {
    id: 'email',
    kind: 'email',
    section: 'Stay in touch',
    title: 'Where should we send your results?',
    help: 'No spam. Just your personalized breakdown.',
    required: true,
    placeholder: 'you@company.com',
  },
]
