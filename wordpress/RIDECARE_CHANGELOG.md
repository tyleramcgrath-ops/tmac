# Bosch RideCare page: audit change log (theme v6.19.0)

Page: envuetelematics.com/boschridecare/ (template `envuetheme/page-boschridecare.php`)

**Status: draft.** Nothing goes live until the v6.19.0 theme zip is installed on the site. The live page stays
exactly as it is until then.

## Sources checked

| Ref | Source |
|---|---|
| **KIT** | Bosch *RideCare Reseller Marketing Kit* (pptx, "Public C-SC0", dated 2025-10-09), from Bosch (Kit Ciarelli). Email copy, social captions and graphics. |
| **PR** | Bosch press release "Safe and sound from A to B…" (Nov 3, 2021), us.bosch-press.com/pressportal/us/en/press-release-16000.html |
| **GMP** | Geotab Marketplace RideCare listing, marketplace.geotab.com/solutions/ridecare/ |
| **SR** | Geotab case study "Swift Ride Eliminates Fleet Theft and Saves Over $400K Annually", geotab.com/case-study/swiftride/ |

## 1. Headline and messaging

| Original | Replacement | Reason | Source |
|---|---|---|---|
| H1: "Bosch RideCare: Smoking, Vaping & Damage Detection for Fleets." | H1: "Know What Happens in Your Vehicles. Even When You're Not There." Eyebrow above it: "Bosch RideCare · Deployed by EnVue Telematics" | Requested headline. The eyebrow, title tag and H2s keep "Bosch RideCare" prominent for SEO. | n/a |
| "A palm-sized Bosch sensor that installs in 15 minutes and alerts you in real time to smoking, vaping, damage impacts and harsh driving … deployed by EnVue Telematics." | "Bosch RideCare helps fleet operators detect smoking, vaping, and potential vehicle damage, providing actionable incident information to help protect vehicles, improve accountability, and reduce avoidable costs. EnVue Telematics installs it and connects it to MyGeotab for you." | Requested subheadline, plus EnVue's role. | KIT, GMP |

## 2. Driver identification

| Original | Replacement | Reason | Source |
|---|---|---|---|
| "Smoking & vaping: real-time detection, plus which driver smoked" | "Smoking and vaping: sensor-based detection of potential smoking and vaping events" | The sensor detects an event. It doesn't identify a person on its own. | GMP, PR |
| Benefit: "Data-backed policy enforcement: identify which driver smoked" | "Data-backed policy enforcement: incident records tied to the vehicle, time, and location" | Same reason. | PR (time and location of each event) |
| Step 3: "identify who was involved and enforce your no-smoking policy" | "match it to the vehicle and trip, and apply your no-smoking and damage policies with data" | Same reason. | PR |
| FAQ "Can RideCare identify which driver smoked?" answered "Yes. RideCare identifies which driver smoked…" | "RideCare detects the event in the vehicle. It associates detected smoking events with available vehicle and trip information, such as time and location, to support driver accountability. Matching an event to a specific person depends on your driver assignments or rental records." | Requested replacement wording. | PR says operators "can directly determine who caused the damage or smoked", based on time, location and the rental period. GMP lists "Assign responsibility for damage". |
| (new) Accountability list item | "Associates detected smoking events with available vehicle and trip information to support driver accountability" | Requested wording. | PR |

## 3. Statistics and ROI claims

All of these come from Bosch's own marketing kit. None has a published methodology. I kept each one, labeled it
as Bosch-reported or a Bosch estimate, and added a footnote under the Benefits list: *"Figures come from Bosch's
RideCare marketing materials (2025). They are Bosch-reported, 'up to' results and estimates, not guarantees. Actual
results depend on your fleet, policies, and how incidents are enforced."*

| Claim | Where it was | Origin | Type | Change |
|---|---|---|---|---|
| Up to 60% fewer smoking incidents | Stat band, accountability list, benefits, FAQ | KIT email 2 ("Cut smoking incidents by up to 60%") and Post 4 Instagram caption | Vendor-reported result, no methodology | Stat band label now reads "as reported by Bosch*". Benefit and FAQ now say "Bosch reports…". Removed the duplicate in the accountability list. |
| Up to 90% claim recovery | Accountability list, benefits | KIT Post 4 LinkedIn caption ("Up to 90% claim recovery from smoking fine charges") | Vendor-reported result | Now "Bosch reports fleets recovering up to 90% of smoking fine charges*". |
| $1,000 saved per prevented event | Benefits, FAQ | KIT email 2 | Vendor estimate | Now "Bosch estimates about $1,000 saved per prevented event*". |
| $300–$500 cleaning cost | Stat band, Why It Matters, FAQ | KIT emails 1 and 2. A KIT graphic says "~$500". PR says interior cleaning "can often run into several hundreds of dollars". | Industry estimate | Now "Estimated cleaning cost…*" and "Bosch estimates…". |
| $100–$500 downtime per event | Why It Matters, FAQ | KIT emails 1 and 2 | Vendor estimate | Now attributed to Bosch. |
| $1,200+ in potential earnings | Image in the accountability section ("Earn up to $1200+") | KIT Post 4 graphic | Illustrative. No basis is given. | **Removed.** Replaced the image with the KIT's "~$500 to remove smoke residue" graphic, which matches the cleaning-cost claim. |
| 2.2x higher accident risk | Image in Why It Matters | KIT Post 3 graphic | Bosch cites no study | Kept the image. Its alt text now reads "Bosch graphic: …". **Needs Bosch confirmation of the source.** |

## 4. Privacy and compliance

| Original | Replacement | Reason | Source |
|---|---|---|---|
| "Because it detects smoke at the molecular level, RideCare maintains privacy and helps you meet union and workplace standards." (About section and FAQ) | "RideCare uses sensor-based detection to identify potential smoking events without relying on in-cabin video footage." FAQ is now "Does RideCare use an in-cabin camera?" and adds: "Fleets should still review their own privacy, labor, and workplace policies before deployment." | The page shouldn't promise union, privacy or legal compliance. | Requested wording. PR and GMP describe a "sensor box". Neither mentions a camera. **Needs Bosch to confirm there is no camera.** |

## 5. Technical and integration claims

| Claim | What I found | Change |
|---|---|---|
| Real-time detection | PR says operators get information "in real time". GMP says events are "communicated via email". | Softened to "an alert when an event is detected". Dropped the "real time" and "instant" promises from the body copy. |
| Instant alerts | GMP: email alerts, plus MyGeotab dashboard or API. | Now "detected events are sent by email and appear in MyGeotab". |
| Automatic damage severity classification (cosmetic vs. severe) | PR: AI derives the intensity of each impact, so you know "whether damage is merely cosmetic or whether it needs to be assessed and repaired immediately". | Kept, reworded: "Bosch classifies the intensity of an impact…". |
| MyGeotab integration | GMP: events "can be accessed via the MyGeotab dashboard or backend-to-backend connection (API)". | Kept. FAQ now mentions email and API too. |
| Vaping detection | KIT, and SR ("smoke and vape detection system"). GMP mentions smoking only. | Kept. **Bosch to confirm vaping is standard on US units.** |
| Install time | GMP: "installed within just fifteen minutes", with over-the-air updates. | Now "typically installs in about 15 minutes" and adds over-the-air updates. |
| Feature availability | Not stated anywhere. | Added: "Available features and alert settings depend on your RideCare plan and configuration. EnVue confirms what your fleet will get during setup." |

## 6. Video

- **Recommendation:** Bosch's YouTube overview (f8qDrhPGCzE) is the strongest demo. It's Bosch's official video, it's the lead video on the Geotab Marketplace listing, and it plays on the page without sending visitors away.
- **Change:** the video section moved from the middle of the page to directly below the hero and stats, so visitors see the demo right after the opening value proposition. The hero's "See How RideCare Works" button jumps to it.
- **Unchanged:** all five Canva demos are still there, now labeled "Watch on Canva". Hosting is unchanged.
- **Page speed:** the embed keeps `loading="lazy"`, so it doesn't slow the first screen.

## 7. Limo, rental and shared-vehicle fleets

New section, "Protect the Vehicle. Protect the Experience.", using the requested copy, with a Bosch photo:
- It adds one line for commercial and logistics fleets so the page doesn't read as limo-only. That line draws on GMP's "Benefits for logistics and commercial fleets".
- It links internally to /leasing-rental/.
- A matching FAQ was added: "Is RideCare a good fit for limo, rental, and shared-vehicle fleets?"

## 8. Calls to action

| Location | Before | After |
|---|---|---|
| Hero primary | "Get a Demo" | "Request a RideCare Demo" (goes to /get-in-touch/) |
| Hero secondary | "All Partners" | "See How RideCare Works" (jumps to the video) |
| Mid-page strip | "Schedule a RideCare Demo" (after Benefits) | "Request a RideCare Demo" (moved to right after How It Works) |
| Final section | "Get a Demo" | "Request a RideCare Demo" (plus the call button) |

Forms, form destinations, tracking, GTM and GA4 are untouched. The page has no form of its own. Every demo
button goes to /get-in-touch/, the same as before.

## 9. Copy and credibility

| Original | Replacement | Reason |
|---|---|---|
| "licence plate" | "license plate" | US English. The MyGeotab screenshot is Bosch's UI, so its "Enter licence plate" label is left as is. |
| "No more negotiation over disputes. No more wondering what happened in your vehicles." | "RideCare helps strengthen incident documentation and support more informed dispute resolution, so you spend less time guessing what happened in your vehicles." | Removes the absolute claim. |
| "Leading fleets already use RideCare…" | "Fleets use RideCare to…" | "Leading" can't be backed up. KIT says "several fleets". |
| "Potential insurance savings: through proven safety measures" | "Potential insurance savings: fewer incidents and better documentation may help; results depend on your insurer" | "Proven" can't be backed up. |
| Swift Ride card: "eliminates fleet theft and saves over $400K annually (includes RideCare)" | "Swift Ride is piloting RideCare to detect smoke and vape violations and apply a $25 fine per incident. The case study's $400K savings figure comes from its wider Geotab program." | SR shows RideCare is a pilot there. The $400K is from theft prevention and other Geotab tools, not RideCare. |
| "Don't wait for an accident to address the problem." strip | "See RideCare on your own fleet." | Clearer, and less fear-based. |
| All em dashes | Removed (none left on the page) | As requested. |

## 10. SEO and accessibility

- **Title:** "Bosch RideCare Smoking, Vaping & Damage Detection | EnVue" is now "Bosch RideCare: Fleet Smoking & Vehicle Damage Detection | EnVue".
- **Meta description:** "in real time" removed; now says "about 15 minutes".
- **Headings:** one H1, then H2s in order. The H2s now naturally include "fleet smoking detection", "vehicle damage detection" and "Bosch RideCare". The "MyGeotab Integration" eyebrow and copy cover that term. There is no keyword stuffing.
- **Alt text:** every image has alt text. The Bosch graphics are now labeled "Bosch graphic: …". The video thumbnails stay decorative (empty alt), because each card's text names the video.
- **Internal links:** /get-in-touch/ (all demo buttons), /leasing-rental/ (new), /our-partners/ (breadcrumb).
- **Partners directory card:** "in real time" removed.

## Items needing Bosch or EnVue confirmation

1. **Bosch:** the source or methodology for "up to 60% fewer smoking incidents", "up to 90% recovery of smoking fine charges" and "$1,000 saved per prevented event". The kit's Post 4 caption also says "recovering up to 60% more in smoking and damage claims". That's a different 60% claim, so Bosch should confirm which one is right.
2. **Bosch:** the study behind "2.2x higher risk of accidents".
3. **Bosch:** that the device has no camera, and that vaping detection is standard on US units.
4. **Bosch:** what the smoking-event report includes (trip, driver assignment), so the driver-accountability wording can be firmed up.
5. **EnVue:** which alert channels you'll set up for customers (email only, or also MyGeotab notifications or SMS).
6. **EnVue:** whether you'd like an EnVue-hosted version of a Canva demo, so visitors stay on the site for those too.

## QA summary (local test site)

- **Layout:** checked at desktop (1440px) and mobile (390px). No horizontal scroll and no JavaScript errors. Design and branding are unchanged; the only addition is the new limo/rental split, which reuses the existing layout.
- **Links:** all internal links return 200. External links are the same Bosch and Geotab URLs as before, and those pages are live. The Canva links can't be checked automatically (Canva blocks bots), so open each one once by hand.
- **Forms:** none on this page. Demo buttons go to /get-in-touch/, and no test leads were submitted.
- **Tracking:** no scripts, tags or integrations were changed.
- **Claims:** every claim now matches a source in the table above or is labeled as Bosch-reported. Open questions are listed in the confirmation section above.
- **To publish:** after approval, install envuetheme-final-v6.19.0.zip, purge the SiteGround cache, and review /boschridecare/.
