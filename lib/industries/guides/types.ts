// A long-form guide on an industry page: how a website for that kind of
// business wins clients from search. Real, useful advice; nothing invented.
export interface Guide {
  // The guide's H2, e.g. "How a law firm website brings in consultations".
  title: string
  intro: string
  // Each body is plain text; blank lines separate paragraphs.
  sections: { heading: string; body: string }[]
}
