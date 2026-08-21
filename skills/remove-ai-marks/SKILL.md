---
name: remove-ai-marks
description: Strip the tells that make writing read as machine-generated — em-dash overuse, negation-flip parallelism ("not just X, it's Y"), filler transitions, LLM vocabulary (delve, landscape, robust, seamless), symmetric bullet lists, and typographic artifacts — without changing what the text says. Use when asked to de-slop, humanize, or clean up AI-sounding copy, when polishing generated blog posts, marketing pages, docs, changelogs, or PR descriptions before they ship, or when someone says text "sounds like ChatGPT wrote it."
---

# Remove AI Marks

Rewrite text so it reads like a person wrote it, while saying exactly what it already said.

The job is subtraction, not restyling. Every edit removes a tell. If an edit changes the
claims, the facts, the numbers, or the ordering of the argument, it is out of scope.

## Workflow

1. **Read the whole text first.** Tells are distributional — one em-dash is fine, nine in
   400 words is a tell. You cannot judge a sentence without the document around it.
2. **Scan.** Run `node skills/remove-ai-marks/scripts/scan.mjs <file>` for a line-numbered
   inventory of mechanical tells. It catches lexical and typographic marks; it does not
   catch structural ones. Use it as a checklist, not as the review.
   `--fix` rewrites the file with the invisible characters stripped — that class is
   mechanical and safe to automate. Wording tells stay manual, because deciding whether
   *robust* is the right word takes a reader.
3. **Edit in three passes**, in this order — structure first, because fixing structure
   deletes sentences you would otherwise have spent time polishing:
   - **Structural**: paragraph shape, list shape, section rhythm
   - **Sentence**: openers, transitions, cadence, hedging
   - **Lexical**: word choice, punctuation, typographic artifacts
4. **Diff-review your own edit.** Read the before and after side by side and confirm every
   change is a removed tell, not a preference. Revert the ones that are preference.
5. **Report** what you changed, grouped by tell, with counts. Do not report a
   percentage-human score; there is no such measurement.

## The tells

### Structural

**Rule-of-three everything.** Three bullets, three examples, three adjectives, every time.
Real writing has lists of two, five, and one. Cut the third item when it was padding —
usually it is the vaguest one — or add the fourth that was actually true.

**Symmetric bullets.** Every bullet the same length, every bullet opening `**Bold lead**:
explanation`. Break the template: let some bullets be four words and some be two
sentences. Drop the bold leads unless the list is genuinely a glossary.

**Restating the heading.** A section that opens by paraphrasing its own `##` title, and
closes with a sentence summarizing what the reader just read. Delete both. The heading
already did that work.

**Preamble paragraphs.** An opening paragraph that describes what the piece will cover
before covering it. Delete it and start at the first real sentence.

**Uniform paragraph length.** Four sentences, four sentences, four sentences. Merge and
split until the rhythm varies.

### Sentence-level

**Negation-flip parallelism.** "It's not just X — it's Y." "This isn't about X. It's about
Y." The single loudest tell. Say Y.

**Empty transitions.** *Moreover, Furthermore, Additionally, That said, It's worth noting
that, Importantly, Notably.* Delete outright; the logical connection is either already
clear or the paragraph order is wrong. Keep *but*, *so*, *and*, *because* — those carry
meaning.

**Hedged assertions.** "It's important to note that latency can sometimes be an issue."
→ "Latency is the bottleneck." Commit to the claim or cut it.

**Set-piece openers.** "In today's fast-paced world," "In the ever-evolving landscape of,"
"Let's dive in," "Here's the thing:" — delete the clause and keep the sentence.

**Set-piece closers.** "In conclusion," "Ultimately," "At the end of the day," and the
"By doing X, you can Y" wrap-up. End on the last real point.

**"Not only… but also."** Rewrite as two clauses or one.

**Second-person coaching.** "You'll want to make sure you…" → "Set the flag to…"

**Cadence uniformity.** LLM prose runs 15–25 words a sentence, forever. Vary it. Short
sentences carry weight. Let one run long enough to develop an actual thought before it
lands on the point that matters.

### Lexical

Overrepresented words. These are not banned — they are *suspicious in bulk*. Replace when
a plainer word fits; keep when the word is the precise one.

*delve, tapestry, testament, realm, landscape, navigate, leverage, robust, seamless,
harness, unlock, elevate, embark, crucial, pivotal, vibrant, myriad, foster, underscore,
meticulous, comprehensive, streamline, empower, cutting-edge, game-changer, transformative,
holistic, nuanced, intricate, bustling, ensure, facilitate, utilize*

Common swaps: *utilize* → use. *leverage* → use. *facilitate* → let, help. *ensure* → make
sure, or cut. *comprehensive* → cut. *seamless* → cut, or say what does not break.
*robust* → say what it survives. *delve into* → cover, dig into. *navigate* → handle.
*a myriad of* → many, or a number.

### Typographic

- **Em-dashes.** Two or three in a long piece is normal writing. Ten is a fingerprint.
  Replace with a period, a comma, a colon, or parentheses — vary the replacement so the
  fix is not its own pattern.
- **Emoji section headers** (🚀 ✨ 🔑 in headings or bullet leads). Delete unless the
  surrounding product voice already uses them.
- **Curly-quote and dash inconsistency.** A document that mixes `"` with `"…"`, or `-`
  with `–` and `—`, was assembled from generated fragments. Normalize to one convention.
- **Invisible characters.** Zero-width and format controls (U+200B–U+200F, U+2060–U+2064,
  U+2066–U+206F), soft hyphens, bidi embedding controls, variation selectors, and the
  **Unicode Tags block (U+E0000–U+E007F)**, which can carry an arbitrary hidden payload
  through text that looks completely ordinary. Strip all of them; `--fix` does it.
  Two exceptions the tooling already knows: a zero-width joiner *between two emoji* and a
  variation selector *after* one are holding a glyph together, not marking the text.
  No-break spaces (U+00A0, U+202F) become ordinary spaces rather than vanishing.
- **Bold scattered mid-sentence** for emphasis on ordinary words. Remove; keep bold for
  genuine labels and UI strings.

## What this cannot do

Statistical watermarking — the kind embedded in a model's token choices rather than in the
bytes — is not detectable or removable by any of this, and no text transform can promise
otherwise. Heavy rewriting weakens it; nothing here guarantees its absence. Say that
plainly rather than implying a clean scan means unwatermarked.

Non-text formats are also out of scope: image C2PA / content credentials, EXIF, PDF
producer fields, and Office document metadata all need their own tooling.

## Do not

- **Change meaning, facts, numbers, names, or claim strength.** If a tell can only be
  removed by altering what the text asserts, leave it and note it in the report.
- **Fake humanity.** No introduced typos, no forced slang, no "as a human writer." A clean
  sentence is the goal, not a scruffy one.
- **Touch quoted material, code blocks, inline code, CLI output, log lines, file paths,
  URLs, or citations.** Verbatim means verbatim, even when the quote itself sounds
  generated.
- **Strip domain vocabulary.** *Robust* in a statistics paper and *navigate* in a
  routing doc are the correct words. Judge by whether the word is doing work.
- **Flatten a real voice.** If the source has an established style — a house tone, a
  personal newsletter — remove the tells and preserve the style. Ask which one governs
  when they conflict.
- **Rewrite wholesale.** A rewrite that touches every sentence is a new document, and the
  user cannot review it. Aim for the smallest diff that removes the tells.

## Scope and ambiguity

When the input is long, the pattern is usually consistent: clean the first section, show
it, get agreement on the intensity, then apply the same bar to the rest.

Two dials worth settling before a large edit, if the user has not said:

- **Intensity** — remove the loud tells only, or take it down to plain prose.
- **Length** — de-slopping typically cuts 10–20%. Confirm if the piece has a word-count
  floor.

Pick the obvious default (loud tells, length free to shrink) and say which you picked
rather than blocking on the question.
