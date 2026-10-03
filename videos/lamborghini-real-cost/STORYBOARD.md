---
format: 1080x1920
duration: 40s
message: "The sticker price is the cheap part — year one of a Lamborghini costs ~$58,700 on top of the car"
arc: listicle
audience: Apex Revival viewers — curious about the real economics of luxury and wealth
mode: autonomous
music: dark minimal luxury, low pulsing synth bass, slow and confident, no vocals
---

## Video direction

- **Palette (frame.md / Broadside):** dark register on every frame except Frame 6 (the total), which flips to the orange register as the one climax. Ground ink-black `#111111`; text cream `#F0ECE5`; the single accent fire-orange `#E85D26` reserved for dollar figures and the running total; cream-muted for labels; 1px border-dark hairlines.
- **Type:** Barlow 900 lowercase as the graphic primitive (display / stat-value ramps, scaled up for 9:16); IBM Plex Mono uppercase 0.14em for kickers, labels and the running-total chrome. Numbers use tabular-nums.
- **The spine — a persistent running total:** frames 2–5 carry the same mono "YEAR-ONE TOTAL" counter pinned in the upper area (same position every frame) that counts up from the previous frame's value to the new value the moment the VO lands each cost. Values: F2 $0→$17,500 · F3 →$34,600 · F4 →$46,200 · F5 →$58,700. This is the carrier element that binds the film.
- **Motion grammar:** power3/power4 long-tail eases, smooth over bouncy. VO-paced reveals: a figure appears only when the narrator says it. Count-ups use `counting-dynamic-scale`. Hard cuts / quick pushes between frames — tight Shorts rhythm.
- **Rhythm:** frames 1–5 reveal to the VO at speed; Frame 6 (the total) is the climax — it slams in then HOLDS still; Frame 7 is a calm held outro.
- **Caption band:** bottom ~17% kept clear (captions overlay). Centered heroes anchor near y ≈ 806.
- **Negative list:** no car photos or logos (faceless, invented visuals only), no purple/blue AI gradients, no bokeh, no generic shapes, no gold-glitter "luxury" clichés. No slideshow (front-load then freeze) and no screensaver (everything floating independently).

## Frame 1 — Hook: the sticker

- scene: "$250,490" slams in huge in cream; "lamborghini urus se" mono kicker above; then "that's the cheap part." lands in orange
- duration: 4.736s
- transition_in: cut
- type: hook
- persuasion: Counterintuitive claim + shocking statistic
- beat: intrigue
- status: animated
- src: compositions/frames/01-hook.html
- voiceover: "This Lamborghini costs two hundred fifty thousand dollars. That's the cheap part."
- blueprint: dataviz-countup (Adapt)
- focal: the sticker price "$250,490"
- roles: sticker number = foreground subject · faint oversized "$" glyph + 1px hairline grid = background (dim ~30%) · mono kicker "LAMBORGHINI URUS SE · MSRP" + "that's the cheap part." line = supporting
- sfx: impact-bass-1, whoosh-short

narrativeRole: Opens the curiosity gap — everybody knows the price, nobody knows the rest.
keyMessage: The price tag is not the cost.

Adapt: keep the hook-counter-burst signature (the headline number EXPLODES up in scale as it counts); no icons — the number alone is the hero.
Scene 1 (0.0–0.6s): FRAME 0 IS NOT EMPTY — "$250,490" is already on screen from the very first frame (scroll-stopper) while the hairline grid fades up; mono kicker "LAMBORGHINI URUS SE · MSRP" types on, upper third.
Scene 2 (0.6–2.8s): "$250,490" counts up from $0 while scaling up to near full width (counting-dynamic-scale), centered at y≈806, cream, Barlow 900; lands with a small shake on the VO's "two hundred fifty thousand dollars."
Scene 3 (2.8–4.2s): as VO says "and that's the cheap part", the number dims to ~35% and shrinks up; "that's the" (cream) then "cheap part." (fire-orange) slam in word-by-word below it (kinetic-beat-slam).
Scene 4 (4.2–6.0s): hold the read; a 36×2px orange rule draws under "cheap part.".

## Frame 2 — Sales tax

- scene: "SALES TAX" label, "+$17,500" slams in orange; small "~7% · varies by state"; running total ticks 0 → $17,500
- duration: 4.203s
- transition_in: cut
- type: feature_showcase
- persuasion: Concretization
- beat: surprise
- status: animated
- src: compositions/frames/02-sales-tax.html
- voiceover: "Sales tax alone? About seventeen and a half thousand. Gone on day one."
- blueprint: kinetic-type-beats (Adapt)
- focal: "+$17,500"
- roles: cost figure = foreground subject · running-total counter = supporting (pinned top) · item index "01" giant outline numeral = background (dim ~10%) · footnote = supporting
- sfx: impact-bass-2, ping

narrativeRole: First hidden cost — the one you pay before you even drive.
keyMessage: You lose ~$17.5k the day you buy it.

Adapt: keep the kinetic beat-slam signature; one item per beat with a stat-card treatment.
Scene 1 (0.0–0.4s): running-total chrome ("YEAR-ONE TOTAL  $0") present top; giant faint "01" numeral behind; mono "SALES TAX" kicker slides in.
Scene 2 (0.4–2.2s): on "seventeen and a half thousand", "+$17,500" slams in centered (orange, stat-value ramp scaled for 9:16); running total counts $0 → $17,500.
Scene 3 (2.2–4.5s): footnote "~7% · varies by state" fades up under it; on "gone on day one" a cream "gone on day one." line lands; hold.

## Frame 3 — Depreciation

- scene: a descending line draws across a value chart, "−$17,100 / year" in orange; running total → $34,600
- duration: 7.531s
- transition_in: cut
- type: feature_showcase
- persuasion: Data visualization + averaging
- beat: realization
- status: animated
- src: compositions/frames/03-depreciation.html
- voiceover: "Then depreciation. The Urus loses about a third of its value in five years. That's roughly seventeen thousand a year."
- blueprint: dataviz-countup (Adapt)
- focal: the falling value line + "−$17,100 / yr"
- roles: line chart (value $250k → $182k over 5 yrs) = foreground subject · chart hairlines = background · running total = supporting (pinned top) · "02" numeral = background · source tag "iSeeCars: −34.2% over 5 yrs" = supporting
- sfx: whoosh-short, click

narrativeRole: The biggest invisible cost — value bleeding out.
keyMessage: The car quietly loses ~$17k a year.

Adapt: keep the trend-line draw signature (svg-path-draw), the line falls instead of rising.
Scene 1 (0.0–0.6s): "DEPRECIATION" kicker in; chart frame + axis labels "YR 0" … "YR 5" appear, mid-frame (stacked: chart top-middle, figure below).
Scene 2 (0.6–3.4s): on "a third of its value in five years", a fire-orange line draws downward left→right from "$250k" to "$182k"; end label "−34.2%" pops.
Scene 3 (3.4–6.0s): on "seventeen thousand a year", "−$17,100 / yr" slams in below the chart (orange); running total counts $17,500 → $34,600; small source tag fades in; hold.

## Frame 4 — Insurance, service, tires

- scene: three stacked rows land one by one — insurance $6,600 · service $2,000 · tires $3,000; running total → $46,200
- duration: 6.891s
- transition_in: cut
- type: feature_showcase
- persuasion: Rule of three / enumeration
- beat: momentum
- status: animated
- src: compositions/frames/04-running-costs.html
- voiceover: "Insurance runs around sixty-six hundred. A dealer service, about two grand. A set of tires? Three thousand."
- blueprint: kinetic-type-beats (Adapt)
- focal: the three-row cost list
- roles: three rows (label left, figure right, 1px hairline between) = foreground subject · running total = supporting (pinned top) · "03" numeral = background
- sfx: click, click, click

narrativeRole: The recurring costs — death by a thousand invoices.
keyMessage: Just keeping it running costs ~$11.6k a year.

Adapt: keep beat-slam rhythm; each row lands on its spoken cue as a stat-card (top-border only).
Scene 1 (0.0–2.2s): row 1 "insurance" + "$6,600" slides in from the left on "insurance"; total +$6,600 ($34,600 → $41,200).
Scene 2 (2.2–4.4s): row 2 "dealer service" + "$2,000" lands on "dealer service"; total → $43,200.
Scene 3 (4.4–7.0s): row 3 "tires" + "$3,000" lands on "three thousand"; total → $46,200; hold.

## Frame 5 — The cost nobody counts

- scene: "$250,000 × 5%" equation assembles, resolving to "$12,500" — the money the cash could have earned; running total → $58,700
- duration: 6.912s
- transition_in: cut
- type: benefit_highlight
- persuasion: Opportunity cost reframe
- beat: revelation
- status: animated
- src: compositions/frames/05-opportunity-cost.html
- voiceover: "And the one nobody counts. That quarter million, invested at five percent, would have earned you twelve and a half thousand."
- blueprint: compose
- focal: the equation "$250,000 × 5% = $12,500"
- roles: equation terms = foreground subject · "OPPORTUNITY COST" kicker = supporting · running total = supporting (pinned top) · "04" numeral = background
- sfx: riser, impact-bass-1

narrativeRole: The channel's signature insight — the wealth angle, not just the expense list.
keyMessage: Money in a car isn't money working for you.

Compose: equation builds term by term, stacked vertically for 9:16.
Scene 1 (0.0–1.8s): "the one nobody counts." in cream, lowercase, centered; "OPPORTUNITY COST" kicker types on above.
Scene 2 (1.8–4.5s): line shrinks up; "$250,000" appears on "quarter million", then "× 5%" on "five percent" (stacked lines, centered).
Scene 3 (4.5–7.5s): a hairline draws under the terms, "= $12,500" slams in orange on "twelve and a half thousand"; running total → $58,700; hold.

## Frame 6 — The total

- scene: orange register flips on; "$58,700" huge in ink-black; "in year one. on top of the car." then "≈ $4,900 / month"
- duration: 6.336s
- transition_in: cut
- type: social_proof
- persuasion: Sum reveal / anchoring
- beat: climax
- status: animated
- src: compositions/frames/06-total.html
- voiceover: "Fifty-eight thousand seven hundred dollars in year one, on top of the car. About forty-nine hundred a month."
- blueprint: dataviz-countup (Adapt)
- focal: "$58,700"
- roles: total figure = foreground subject · fire-orange full-bleed ground = background · "in year one. on top of the car." + "≈ $4,900 / month" = supporting
- sfx: impact-bass-2

narrativeRole: The payoff — all the costs summed into one number.
keyMessage: Year one costs ~$58,700 beyond the sticker.

Adapt: keep the count-up scale signature; the ground flips to orange as the one register change in the film.
Scene 1 (0.0–2.6s): hard flip to the fire-orange ground; "$58,700" counts up from $46,200 while scaling to near full width (ink-black, display ramp), centered y≈806 — lands on "fifty-eight thousand seven hundred dollars".
Scene 2 (2.6–4.4s): "in year one." / "on top of the car." land below in ink at 75%.
Scene 3 (4.4–6.5s): on "forty-nine hundred a month", mono pill "≈ $4,900 / MONTH" pops in; HOLD still.

## Frame 7 — The lesson + follow

- scene: "looking rich ≠ being rich." in two lines; "APEX REVIVAL — follow for the real numbers"; tiny sources line
- duration: 3.755s
- transition_in: cut
- type: cta
- persuasion: Thesis line + call to follow
- beat: resolve
- status: animated
- src: compositions/frames/07-outro.html
- voiceover: "Looking rich and being rich are different math. Still want the Lambo?"
- blueprint: kinetic-type-beats (Adapt)
- focal: "looking rich ≠ being rich."
- roles: thesis lines = foreground subject · "APEX REVIVAL" mono wordmark + "follow for the real numbers" = supporting · sources footnote = supporting (small, above caption band)
- sfx: whoosh-cinematic

narrativeRole: Generalizes the lesson to the channel's thesis and asks for the follow.
keyMessage: Status and wealth are different math.

Adapt: keep the per-word slam; calm, then hold.
Scene 1 (0.0–2.4s): dark ground; "looking rich" (cream) then "≠ being rich." (orange) land word-by-word on the VO.
Scene 2 (2.4–5.0s): on "still want the lambo?" that question slams in orange (comment bait + loops back to the $250,490 hook); "APEX REVIVAL" mono wordmark + orange rule + "follow for the real numbers" fade up below; tiny footnote "Estimates. Sources: TrueCar, iSeeCars, Insuranceopedia. Tax varies by state." sits just above the caption band; hold.
