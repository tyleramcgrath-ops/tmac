// Articles written ahead, one per day. Each stays hidden until its
// `published` day (publishedArticles filters by date), so a week goes out
// one a day with a single deploy. Same rules as lib/articles: every outside
// fact links to its source, no invented numbers, no promises of rankings,
// no competitors named. Byline "SaySites".

import type { Article } from './articles'

const LOCAL_RANKING = 'https://support.google.com/business/answer/7091'
const REVIEW_TIPS = 'https://support.google.com/business/answer/3474122'
const MAPS_POLICY = 'https://support.google.com/contributionpolicy/answer/7400114'
const SERVICE_AREAS = 'https://support.google.com/business/answer/9157481'
const GBP_GUIDELINES = 'https://support.google.com/business/answer/3038177'
const TITLE_LINKS = 'https://developers.google.com/search/docs/appearance/title-link'
const SNIPPETS = 'https://developers.google.com/search/docs/appearance/snippet'
const WEB_VITALS = 'https://web.dev/articles/vitals'
const HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
const PAGESPEED = 'https://pagespeed.web.dev/'

export const SCHEDULED_ARTICLES: Article[] = [
  {
    slug: 'how-google-picks-local-businesses',
    title: 'How Google decides which local businesses to show',
    description: 'Relevance, distance and prominence: what Google says it looks at for local results, and what a small business can actually do about each one.',
    kind: 'guide',
    summary: [
      'Google says local results mainly come down to relevance, distance and prominence.',
      'You can’t pay for a better local ranking, and distance is out of your hands.',
      'Complete, accurate business details, real reviews and a website that explains what you do are the parts you control.',
    ],
    body: `When someone near you searches for “plumber” or “nail salon” on their phone, Google shows a short list of nearby businesses on the map and in the results. A lot of advice about getting into that list is guesswork. Google’s own help page is short and specific, so it’s the best place to start ([Tips to improve your local ranking on Google](${LOCAL_RANKING})).

## The three things Google names

Google says local results are “mainly based on relevance, distance, and popularity”, and describes them as:

- **Relevance:** how well your Business Profile matches what someone searched for. Google’s advice is to give complete and detailed business information so it can match you to the right searches.
- **Distance:** how far you are from the person searching. If they don’t share their location, Google uses what it knows about where they are.
- **Prominence:** how well known your business is. Google says this is partly based on information like how many websites link to you and how many reviews you have, and that more reviews and positive ratings can help.

It also says plainly that there’s no way to request or pay for a better local ranking. Anyone who promises you the top spot is promising something Google says can’t be bought.

## What you can’t change: distance

You can’t move closer to every customer. What you can do is be accurate about where you are and where you work, so you show up for the people you can actually serve. If you go to customers rather than having them come to you, that means setting a service area instead of a street address.

## What you can change: relevance

Relevance is mostly about being clear. Google lists the details that help: your full address if customers visit you, your hours (including special hours), the category that describes your business, and other details such as parking or Wi-Fi.

Two habits make a real difference:

1. **Pick the category that describes your core business.** Google’s guidelines ask you to choose the fewest categories it takes to describe your overall business ([Guidelines for representing your business on Google](${GBP_GUIDELINES})). More isn’t better.
2. **Say what you do in plain words, everywhere.** Your Business Profile description and your website should both name the services you offer the way customers say them: “water heater repair”, not “thermal solutions”.

## What you can change slowly: prominence

Prominence is earned. Google names reviews and links from other websites. The honest ways to build it are the boring ones: do good work, ask happy customers for a review, and be part of your town (a local association, a sponsorship, a supplier who lists you). Never buy reviews or links; Google’s policies forbid paid reviews outright ([Maps content policy](${MAPS_POLICY})).

## Where your website fits

Your website is where the detail lives. Your profile can only say so much; a page for each service, in your own words, tells Google and customers exactly what you do and where. That supports relevance directly.

## A short checklist

- Verify your Business Profile and keep it up to date.
- Use one accurate category, plus others only if they describe your core business.
- Keep your hours current, including holidays.
- Ask every happy customer for a review, and reply to the reviews you get.
- Give each main service its own page on your website, in your own words.

Every SaySites site lists your services in plain words and tells Google your business details in the format it reads. Your reviews, your profile and your work are still yours to look after.`,
    published: '2026-10-09',
    status: 'published',
  },
  {
    slug: 'ask-for-google-reviews-the-right-way',
    title: 'How to ask for Google reviews without breaking the rules',
    description: 'Google wants more reviews to come from real customers, and it bans incentives. Here’s how to ask often, ask well and stay within the rules.',
    kind: 'guide',
    summary: [
      'Asking customers for a review is encouraged; Google even gives you a link and a QR code for it.',
      'Offering anything in return for a review, including a discount, is against Google’s rules.',
      'Reply to reviews, good and bad, briefly and personally.',
    ],
    body: `Reviews show next to your business on Google Maps and Search, and Google names them as one of the things that help a business stand out ([Tips to get more reviews](${REVIEW_TIPS})). Most small businesses have far fewer reviews than happy customers, simply because they never ask. Here’s how to ask without getting into trouble.

## What Google allows

Google’s own advice is to remind customers to leave reviews. It gives every business a link and a QR code for exactly this, inside your Business Profile. Asking is fine. Asking everyone is fine.

## What Google forbids

Google’s policy is direct: offering incentives, “like free or discounted goods or services”, in exchange for posting a review, changing one or removing a negative one is considered fake and misleading content and is strictly prohibited ([Tips to get more reviews](${REVIEW_TIPS})).

The Maps content policy adds more you shouldn’t do ([Prohibited & restricted content](${MAPS_POLICY})):

- Pay for reviews, directly or in kind.
- Post reviews from several accounts, or ask one person to.
- Ask employees, family or anyone with a conflict of interest to review you.
- Post on a competitor’s listing to hurt them.

That rules out “10% off your next visit for a review” and “enter our prize draw when you review us”. It also rules out asking only the customers you know loved you and quietly skipping the rest, because the policy forbids soliciting content that doesn’t reflect a genuine experience.

## How to ask well

- **Ask at the right moment.** Right after a job is finished and the customer is pleased, not weeks later.
- **Make it one tap.** Send your review link by text or email, or show the QR code at the counter. Google notes customers need to be signed in to a Google Account to leave a review.
- **Ask in your own words.** “If you were happy with the work, a short review on Google helps other people in town find us” is plenty.
- **Ask everyone.** A mix of reviews reads as more believable; Google itself says a mix of positive and negative feedback often feels more trustworthy.

## Reply to what you get

Google suggests replying to reviews, keeping replies short, polite and specific, and not using them to advertise. For a negative review, reply calmly with what you’ll do about it. Future customers read your reply as much as the review.

If a review breaks Google’s policies (for example, it’s clearly not from a customer), you can flag it for Google to look at. You can’t remove a review yourself just because you disagree with it.

## A simple routine

1. Get your review link or QR code from your Business Profile.
2. Send it to every customer when the work is done.
3. Reply to each new review within a few days.

On SaySites, once you add your Google review link, your site gets a short /review address that forwards to it, and you can turn on one review request email after you mark a lead as won. Every customer gets the same request, with nothing offered in return.`,
    published: '2026-10-10',
    status: 'published',
  },
  {
    slug: 'service-area-business-google',
    title: 'No storefront? How to show Google where you work',
    description: 'Plumbers, cleaners and other businesses that go to their customers should set a service area, not a street address. Here’s what Google’s rules say.',
    kind: 'guide',
    summary: [
      'If customers don’t come to your address, Google asks you to remove it from your Business Profile and set a service area instead.',
      'You can list up to 20 service areas by city or postal code; Google says the whole area shouldn’t be more than about two hours’ drive from your base.',
      'Your website should name the places you serve, honestly.',
    ],
    body: `Many small businesses don’t have a shop. A plumber, a mobile dog groomer or a cleaning company goes to the customer. Google treats these as service-area businesses, and it has specific rules for them ([Manage your service areas](${SERVICE_AREAS})).

## Are you a service-area business?

Google describes three kinds:

- **Storefront:** customers come to you, at an address with permanent signage.
- **Service-area business:** you visit or deliver to customers and don’t serve them at your address. Google gives cleaning services and plumbers as examples.
- **Hybrid:** you do both, like a restaurant that also delivers.

Google also says that if your business doesn’t have permanent on-site signage, it isn’t eligible as a storefront and should be listed as a service-area business.

## Hide your address if customers don’t visit

This is the rule people miss. Google says that if you don’t serve customers at your business address, you should remove the address from your Business Profile. Working from home doesn’t mean you’re invisible on Google; it means you show a service area instead of a pin.

## Setting your service area

In your Business Profile, under Edit profile and Location, you can add service areas. Google’s rules:

- Up to 20 service areas, set by city, postal code or a similar area.
- No radius around your base (older radius settings can’t be edited).
- The whole area shouldn’t be more than about two hours of driving time from where you’re based.
- A service-area business can have only one profile for the whole area it serves.

Pick the places you genuinely want work from. Listing far-off towns you’d never drive to doesn’t help anyone.

## What to put on your website

Your website should agree with your profile:

- Say where you’re based and which towns or neighborhoods you serve, in a sentence a person would write.
- Don’t create a near-identical page for every town with only the name swapped. Google’s guidance on helpful content warns against pages made mainly to attract search visits rather than to help people ([Creating helpful, reliable, people-first content](${HELPFUL})).
- If you do write about a particular town, write something true and specific to it: the jobs you do there, how quickly you can get there, local details customers care about.

## Stay consistent

Google’s guidelines ask you to represent your business the way it’s known in the real world, with an accurate and precise address or service area ([Guidelines for representing your business on Google](${GBP_GUIDELINES})). Use the same name and phone number on your profile, your website and anywhere else you’re listed.

SaySites sites tell Google the area you serve in their business details, and your site never shows a street address unless you give us one.`,
    published: '2026-10-11',
    status: 'published',
  },
  {
    slug: 'page-titles-and-descriptions-that-get-clicks',
    title: 'Page titles and descriptions that people actually click',
    description: 'The title and short description under it are often all a searcher sees. What Google’s guidance says about writing them, with examples for local businesses.',
    kind: 'guide',
    summary: [
      'Every page needs its own clear title; avoid vague ones like “Home” and repeated boilerplate.',
      'Google writes the description under your result mostly from the page itself, and sometimes uses your meta description.',
      'Write for the person searching: what you do, where, and why they should pick you.',
    ],
    body: `In a list of search results, your page gets a title and a line or two of description. That’s often all someone reads before deciding whether to tap. Google has clear guidance on both, and following it is one of the cheapest improvements a small business can make.

## Titles: what Google asks for

Google calls the clickable headline a “title link” and builds it mainly from your page’s title ([Influencing your title links](${TITLE_LINKS})). Its advice:

- **Every page should have a title.**
- **Be descriptive and concise.** Avoid vague titles like “Home”.
- **Don’t stuff keywords.** Repeating “plumber, plumbing, plumbers” can look spammy to Google and to people.
- **Avoid repeated boilerplate.** Each page should have distinct text that describes that page.
- **Brand concisely.** Your business name can go in the title, but it shouldn’t crowd out what the page is about.

Google also notes there’s no fixed length limit, but long titles get cut off to fit the screen.

## Good and bad examples

- Weak: “Home”
- Weak: “Plumber Plumbing Plumbers Best Plumber Tampa”
- Better: “Rivera Plumbing | Plumber in Tampa, FL”
- For a service page: “Water Heater Repair in Tampa | Rivera Plumbing”

The better versions say what the page is, where, and who you are, once each.

## Descriptions: what Google actually shows

The text under your title is called a snippet. Google says snippets are created primarily from the page content itself, and that it sometimes uses your meta description if that describes the page more accurately ([Control your snippets](${SNIPPETS})). It may also show different snippets for different searches.

So two things matter:

1. **Your page should explain itself early.** The first paragraph of a service page should say what you do, for whom, and where.
2. **Your meta description should be a real summary.** Google describes a good one as a short, relevant pitch that tells people the page is exactly what they’re looking for. Like titles, there’s no length limit, but long ones are cut to fit.

## Write it for a person

A useful test: read your title and description as if you were the customer, on a phone, comparing three businesses. Would you know what this page offers? Would you know the business is near you? Is there a reason to choose it, stated plainly and truthfully, such as “Free estimates” if you really give them, or “Open Saturdays” if you are?

Don’t promise what you can’t back up. “Best in Florida” is a claim; “Family-run since 2009” is a fact, if it’s true.

## Check yours today

Search for your business name and your main service plus your town. Look at what Google shows for your pages. If a title says “Home” or every page has the same one, fix those first.

SaySites gives every page its own title and description when your site is built, flags duplicates or short ones in the SEO tab, and lets you fix them in one click.`,
    published: '2026-10-12',
    status: 'published',
  },
  {
    slug: 'is-your-website-fast-enough',
    title: 'Is your website fast enough? Core Web Vitals in plain English',
    description: 'Google measures how fast your pages load, react and settle. What the three Core Web Vitals mean, the targets Google sets, and how to check your own site free.',
    kind: 'guide',
    summary: [
      'Core Web Vitals measure loading (LCP), responsiveness (INP) and visual stability (CLS).',
      'Google’s targets: main content within 2.5 seconds, a response within 200 milliseconds, and a layout shift score of 0.1 or less.',
      'You can check any page free with PageSpeed Insights.',
    ],
    body: `Most of your customers will see your website on a phone, often on a patchy connection. If it’s slow, some of them leave before it loads. Google measures this with three numbers it calls Core Web Vitals, and explains them in detail on web.dev ([Web Vitals](${WEB_VITALS})).

## The three numbers

**Largest Contentful Paint (LCP): how fast it loads.** The time until the biggest thing on the screen, usually your main photo or headline, appears. Google’s target is within 2.5 seconds of the page starting to load.

**Interaction to Next Paint (INP): how fast it reacts.** When someone taps a button or opens a menu, how long until the page responds. The target is 200 milliseconds or less.

**Cumulative Layout Shift (CLS): how steady it is.** Whether things jump around while the page loads, like a button moving just as you tap it. The target is a score of 0.1 or less.

Google suggests judging a site by the 75th percentile of visits, on both phones and computers: in other words, most of your visitors should get a good experience, not just the ones on fast Wi-Fi.

## Why it matters for a small business

A slow page costs you the impatient visitor, and on a phone that’s a lot of visitors. Google also says its core ranking systems look to reward content that gives a good page experience ([Creating helpful, reliable, people-first content](${HELPFUL})). Speed won’t make up for a page that doesn’t answer the question, but it removes a reason for people to give up.

## Check your own site in two minutes

1. Open [PageSpeed Insights](${PAGESPEED}).
2. Paste your home page address and run it.
3. Look at the phone results first.

If your site has enough visitors, you’ll see real-world numbers from Chrome users at the top. Below that is a lab test, a simulated load on a mid-range phone, with a score out of 100 and a list of what’s slowing the page down.

## Don’t chase the score alone

The lab score changes a little every time you run it, and a perfect 100 isn’t the goal. What matters is that real visitors on real phones see your page quickly and can use it straight away. If the real-world numbers at the top are good, small swings in the lab score aren’t worth worrying about. If there aren’t enough visitors for real-world numbers yet, use the lab test as your guide and re-check after every big change, like a new photo gallery or a booking widget.

## The usual culprits

- **Huge photos.** A photo straight from a camera can be many times larger than the screen needs.
- **Too many add-ons.** Chat widgets, pop-ups, trackers and tag managers each load their own code.
- **Fonts and sliders.** Several custom fonts and auto-playing carousels add weight and cause jumps.
- **Cheap or overloaded hosting.** Slow servers delay everything.

Fixing these usually means removing things rather than adding them. Ask of every add-on: does this bring in customers, or just weight?

SaySites sites send no JavaScript to visitors, size every photo for the screen, and every page has to pass our speed check (a mobile score of 95 or more) before it can go live.`,
    published: '2026-10-13',
    status: 'published',
  },
  {
    slug: 'what-to-put-on-your-home-page',
    title: 'What to put on your home page so visitors get in touch',
    description: 'A small business home page has one job: help the right visitor decide to call or send a message. A practical, section-by-section guide.',
    kind: 'guide',
    summary: [
      'Say what you do and where in the first screen, in plain words.',
      'Make calling and sending a message easy from anywhere on the page.',
      'Show proof that’s real: your own photos, real reviews, real details. Never invent any.',
    ],
    body: `A visitor lands on your home page with a question: can this business help me, and can I trust them? Everything on the page should help them answer it quickly. Here’s a simple order that works for most local businesses. It isn’t a formula from Google; it’s plain good sense, and it lines up with Google’s advice to make pages for people first ([Creating helpful, reliable, people-first content](${HELPFUL})).

## 1. The first screen: what, where, how to reach you

Before anyone scrolls, they should know:

- **What you do,** in the words customers use. “Emergency plumbing and water heaters”, not “Solutions for your home”.
- **Where.** Your town or the area you serve.
- **How to get in touch.** A phone number they can tap and a button to send a message.

One clear headline, one sentence under it, and two buttons is enough. A strong photo of your real work, team or premises helps more than a stock image.

## 2. Your main services

List your main services with a line each about what’s included, and link each to its own page with the detail. Visitors scan for their problem; let them find it in seconds.

## 3. Why you

This is where most sites say “quality service at affordable prices”, which says nothing. Say something specific and true instead:

- How you work (“We give you a written price before we start”).
- How long you’ve been doing it, if it’s worth saying.
- Licences, certifications or memberships you really hold.
- The area you cover and when you’re available.

## 4. Proof

Real reviews from real customers, quoted word for word. Photos of jobs you’ve actually done. Never invent a testimonial, a number of happy customers or an award; it’s dishonest, and fake reviews break Google’s policies ([Maps content policy](${MAPS_POLICY})).

## 5. Answers to the questions people ask

Three to five short questions and answers: which areas you cover, how pricing works, how soon you can help, what happens first. These save you phone calls and help visitors decide.

## 6. One more way to get in touch

End the page with a short form and your phone number again. Someone who has read this far is ready; don’t make them scroll back up.

## What to leave out

- Pop-ups that cover the page on a phone.
- Auto-playing sliders that rotate before people can read them.
- Long paragraphs about your mission before you’ve said what you do.

## Check it on a phone

Open your home page on your phone and give yourself five seconds. Do you know what the business does, where, and how to call? If not, fix the first screen first.

SaySites builds every new site in this order, with a call button that stays on screen on phones and a request form on the home page. You change any of it by saying what you want.`,
    published: '2026-10-14',
    status: 'published',
  },
  {
    slug: 'google-business-profile-or-website',
    title: 'Google Business Profile or a website: do you need both?',
    description: 'A free Business Profile puts you on Google Maps. A website is the part you own and control. What each does well, and why most small businesses need both.',
    kind: 'guide',
    summary: [
      'Your Business Profile is how you appear on Google Maps and in local results; it’s free and worth setting up today.',
      'Your website holds the detail a profile can’t: a page per service, your story, your answers.',
      'Google lists links from other sites among the things that help local ranking, and your website is what they link to.',
    ],
    body: `If you have a Google Business Profile with good reviews, it’s fair to ask whether you need a website at all. The short answer for most small businesses is yes. They do different jobs, and each makes the other work better.

## What your Business Profile does

Your Business Profile is the panel and map pin people see when they search for you or for businesses like yours nearby. You can add your hours, category, photos, services and a description, and you can collect reviews. It’s free. If you haven’t claimed yours, do it first ([Add or claim your Business Profile](https://support.google.com/business/answer/2911778)).

Google lists keeping that information complete and accurate as one of the main ways to improve your local ranking ([Tips to improve your local ranking](${LOCAL_RANKING})).

## What a profile can’t do

- **Room for detail.** A profile gives you a description field and a services list. It can’t hold a full page about each service, your prices, your process or answers to the questions customers ask.
- **Ownership.** The profile lives on Google’s platform under Google’s rules ([Guidelines for representing your business](${GBP_GUIDELINES})). Your website is yours: your words, your design, your address on the web.
- **Searches beyond the map.** Many searches show ordinary web results as well as the map. Pages on your website can appear there for the specific questions people ask.

## How they help each other

Google says prominence, one of the three main local ranking factors, is partly based on information like how many websites link to your business ([Tips to improve your local ranking](${LOCAL_RANKING})). Links point to websites. A local association, a supplier or a newspaper can link to your site; it’s much harder for them to link meaningfully to a map pin.

And your profile has a website field. Someone who finds you on Maps and wants to know more taps through to your site. If there’s nothing there, or an outdated page, you lose them at the point they were most interested.

## What your website needs, at minimum

- A clear home page: what you do, where, and how to get in touch.
- A page for each main service.
- The same name, phone number and address (or service area) as your profile.
- A way to send a message, so customers can reach you outside opening hours.

## Keep them in step

Whenever something changes, like new hours, a new service or a new phone number, update both on the same day. Customers notice when the two disagree, and a wrong phone number on either one is a lost call.

## The bottom line

Set up your Business Profile today; it’s free and it’s how you show up on the map. Then make sure the website it points to is fast, clear and yours.

SaySites puts your business name, phone number and area into your site’s details for Google, so your website and your profile tell the same story.`,
    published: '2026-10-15',
    status: 'published',
  },
]
