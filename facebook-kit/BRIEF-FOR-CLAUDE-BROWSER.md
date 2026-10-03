# Brief for Claude in Chrome — posting the McGrath Marketing Group Facebook kit

Paste this whole file into a Claude in Chrome conversation and point it at this
folder. Written to be read by the browser agent; a person can follow it equally
well.

---

## What you are doing

Publishing a set of prepared posts to the **McGrath Marketing Group** Facebook
**Page** (Jupiter, Florida).

Captions, links, images and alt text are all written and built. **Your job is to
publish them exactly as supplied — not to write, improve, shorten or re-tone
anything.**

The files that matter:

- `CAPTIONS.md` — every caption, link, alt text and Page field, in posting order
- `media/<post-id>/01.jpg` — feed images for the photo posts
- `media/page/` — cover photo and profile picture
- `media/share/` — link-preview cards; **not uploaded with posts** (see below)

---

## The one mistake that matters most

**Post as the Page, never as the personal profile.**

Before publishing anything, confirm which identity the composer is set to. On
Facebook this is usually shown at the top of the composer, with a switcher next
to the avatar. If it shows a person's name rather than *McGrath Marketing
Group*, change it before you type a word.

A post that goes out from the owner's personal profile cannot be moved to the
Page afterwards. It has to be deleted and redone, and anyone who saw it saw the
wrong thing.

---

## Rules, in priority order

1. **Do not change the copy.** Captions are pasted verbatim, line breaks
   included. If a caption looks wrong, stop and say so rather than fixing it.
2. **Never invent a claim.** No statistic, price, timeframe, client name,
   guarantee, result or award, in any post, comment or reply. If something looks
   missing, it is missing on purpose.
3. **Post as the Page.** See above.
4. **One post at a time**, then stop and report — unless told in the
   conversation to run a batch straight through.
5. **Show the human the composer before you publish.** Caption in the box, the
   right image or the right link preview, alt text set. Get a yes.
6. **Stop and ask** on any login, two-factor prompt, security checkpoint or
   account warning. Never attempt a workaround.
7. **Touch nothing else.** No liking, following, commenting on other Pages,
   messaging, joining groups, boosting, or spending money. **Never click
   Boost Post** — that spends the owner's money.
8. **If a step does not match the screen, say so and stop.** Facebook's
   interface moves constantly, and a Page may be in the newer Pages experience
   or an older one. Trust the screen over this file and describe what you see.

---

## Two kinds of post

`CAPTIONS.md` labels each one.

### Link post

Four of the twelve. These are the point of Facebook — unlike Instagram, a link
in the post body is clickable.

1. Open the Page composer, confirming the identity is the Page.
2. Paste the caption. The URL is already on its own line at the end.
3. **Wait for the preview card to build.** Facebook fetches the page and shows a
   card with the image, headline and description. This takes a few seconds.
4. Once the card appears, you may delete the raw URL text from the caption — the
   card stays and remains clickable. Cleaner, and optional.
5. **Do not attach an image.** Uploading one replaces the link card with a plain
   photo, and the whole post stops being a link. This is the single most common
   way a link post gets ruined.
6. Publish.

**If the preview card comes up with no image, or the wrong text:** that is the
website's Open Graph tags, not Facebook. Report it rather than working around
it. The fix is Facebook's Sharing Debugger at
`developers.facebook.com/tools/debug/` — paste the URL and use its *Scrape
Again* control to force a refresh of what Facebook has cached. Only do this if
the human asks; it is a developer tool, and it changes nothing about the site.

As a last resort, `media/share/<key>.jpg` holds a correctly sized card per page
that can be attached by hand — but doing so turns the post into a photo post and
loses the clickable card, so ask first.

### Photo post

Eight of the twelve.

1. Open the Page composer, identity confirmed.
2. Upload the single image named in `CAPTIONS.md`. Every file is already
   1080 × 1350 — do not crop it.
3. Paste the caption.
4. Set the alt text. Facebook puts this behind an edit control on the uploaded
   image, often an *Edit* or pencil icon, then *Alternative text*. Replace any
   automatically generated text with the alt text from `CAPTIONS.md`.
5. Publish.

---

## Scheduling

**Facebook does support scheduling natively** — unlike Instagram's web composer.

Either:

- the Page composer's own scheduling control, usually behind the arrow next to
  the publish button, or
- **Meta Business Suite** (`business.facebook.com`), whose planner shows the
  queue on a calendar and is the easier place to set up several at once.

Scheduling is fine to use here, and `CALENDAR.md` has the order. Two cautions:

- Set alt text **before** scheduling. Some composers make it harder to reach
  afterwards.
- Check a scheduled link post's preview card has built before you schedule it.
  A card that failed to build at schedule time stays broken when it publishes.

Do not install a third-party scheduler, connect any service, or enter
credentials anywhere.

---

## Before the first post

Ask the human to confirm, once:

- Which Page, and that you are posting as it rather than as a person
- Whether to publish now, schedule, or build each post and stop before publishing
- Whether the Page itself has been set up yet — name, username, cover, about,
  services, action button. That is the last section of `CAPTIONS.md`, and it is
  worth doing first: posts landing on an unfinished Page waste their best day.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| The composer is set to a personal profile | Switch to the Page before anything else. If you cannot, stop. |
| Login, 2FA or a security checkpoint | Stop. Hand it over. Never work around it. |
| Link preview has no image or wrong text | Stop and report — it is the site's tags. Do not substitute an image without asking. |
| The preview will not build at all | Wait, retry once. If it still fails, report; publishing a link post with no card is worth a decision, not a guess. |
| Upload fails or hangs | Retry once, then stop and report. |
| Any prompt about boosting, promoting or payment | Stop. Never proceed. |
| A rate limit or "try again later" warning | Stop entirely. Do not keep posting. |
| A step here does not match the screen | Describe what you actually see and stop. |

---

## Page setup

The last section of `CAPTIONS.md` has every field: name, username, categories,
profile picture, cover photo, short bio, long About, website, action button,
services, and notes on address and hours.

Two of those notes are judgement calls flagged for the human rather than for
you — whether to show a street address, and whether to set opening hours. Ask;
do not pick.

The cover photo is 1640 × 856 with its text inside the central safe area, so it
survives both the desktop and the mobile crop. Upload it as-is and do not
reposition it unless the human asks.

---

## The one thing to remember

Everything here was written to be defensible: nothing claims a result the
business cannot stand behind. The quickest way to break that is to improve the
copy on the way past. Paste it as written, from the Page.
