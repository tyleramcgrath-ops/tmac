# Instagram kit — McGrath Marketing Group

Twelve posts, ready to publish: 34 images built at Instagram's size, every
caption and alt text written, and a brief that tells Claude in Chrome how to put
them up.

## Give it to Claude in Chrome

Open a Claude in Chrome conversation with Instagram already signed in, and say:

> Follow `BRIEF-FOR-CLAUDE-BROWSER.md` in this folder and publish post 1.

That file carries the whole procedure and the guardrails. Everything else here
is what it reads from.

## What is in the folder

| | |
|---|---|
| `BRIEF-FOR-CLAUDE-BROWSER.md` | The operator brief. This is the file you hand over. |
| `CAPTIONS.md` | Every caption, alt text and first comment, in posting order. Generated. |
| `CALENDAR.md` | What to post when, and why that order. |
| `media/` | 34 images, 1080 × 1350, grouped by post and numbered in upload order. |
| `media/profile/` | Profile picture and the five highlight covers. |
| `posts.json` | The source. Edit here, not in `CAPTIONS.md`. |
| `build.py` | Rebuilds `media/` and `CAPTIONS.md` from `posts.json`. |

## The twelve posts

| # | Post | | |
|---|---|---|---|
| 1 | Intro — who this is | Photo | **Pin to profile** |
| 2 | SEO company in Jupiter | Photo | |
| 3 | Web design in Jupiter, FL | Photo | |
| 4 | AI search optimization | Photo | |
| 5 | One person, not an agency | Photo | |
| 6 | Free SEO audit | Photo | |
| 7 | Palm Beach County | Photo | |
| 8 | How to choose an SEO company | Carousel, 6 | |
| 9 | What is AI search optimization | Carousel, 5 | |
| 10 | Three places buyers find you | Carousel, 5 | |
| 11 | "Can you guarantee ChatGPT…" | Carousel, 4 | |
| 12 | What handover should mean | Photo | |

Seven photo posts put a headline on a cream or navy panel under one of the
site's photographs. Four carousels are typeset cards. All of it uses the
website's own palette and faces — Newsreader, Inter, DM Mono — so the feed and
the site read as one thing.

## What the copy will and will not say

The same rule the website is held to applies here: **nothing in this kit states
a price, a timeframe, a statistic, a client name, a certification, an award, or
a guarantee.** Every claim traces to a line already published on
mcgrathmarketinggroup.com. Where a buyer would want a number, the copy says what
decides it instead.

Post 11 exists to say out loud that nobody can guarantee what an AI model
recommends. That is a position, and it is the one the site already takes.

Captions are first person, because the business is one person. If that is wrong
anywhere, fix it in `posts.json`.

## Before you post, two things need you

**The handle.** `posts.json` has `@YOUR_INSTAGRAM_HANDLE` as a placeholder. It
appears only in the header of `CAPTIONS.md`, not in any caption, so nothing is
broken if you leave it — but set it and rebuild if you want the file to read
properly.

**The AI search photograph.** The image on post 4 (`page-aeo.webp`, from the
site) shows what look like Google, OpenAI, Gemini and Bing marks inside the
scene. That is fine on your own site; on a promotional social post, using other
companies' logos is worth a look before you publish. If you would rather not,
swap `"photo": "page-aeo.webp"` in `posts.json` for `page-analytics.webp` or
`page-writing.webp` and re-run the build.

## Changing anything

Edit `posts.json`, then:

```bash
cd instagram-kit
python3 build.py
```

It rewrites `media/` and `CAPTIONS.md` together, so the pictures and the words
cannot drift apart — the same discipline the theme uses for its page content and
its structured data.

Needs Python 3 and Pillow (`pip install pillow`). The three fonts are fetched
once into `.fonts/` on first run and are not committed.

Adding a post means adding an object to the `posts` array: an `id`, an `order`,
a `type`, one `slides` entry per image, one `alt_text` string per image, a
`caption`, and which `hashtag_sets` to use. The build refuses to run if the alt
text count does not match the slide count.

## Where more posts come from

Each service page on the site carries a four-question FAQ, and there are five of
them. Those twenty questions are already written, already honest, and already
shaped like the carousels in posts 8, 9 and 11 — question on the cover card,
answer across two or three. They are in
`themes/mcgrath-chrome/inc/page-seo.php`, in `mcg_page_faqs()`.
