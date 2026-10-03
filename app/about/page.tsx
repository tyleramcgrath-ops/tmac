import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { TalkForm } from '@/components/TalkForm'
import '../home.css'

// Why SaySites, and why businesses switch to it from an agency. Written as
// the questions worth asking any website company, with our own answers. No
// competitor is named and nothing is claimed about anyone but us.

export const metadata: Metadata = {
  title: 'Why SaySites',
  description: 'Why law firms, dental practices and home service companies switch their website to SaySites: ownership, no long contract, real speed and a free redesign first.',
  alternates: { canonical: '/about' },
}

const QUESTIONS: [string, string, string][] = [
  ['Who owns your website?', 'Some websites belong to the company that built them, and leaving means starting again.', 'With SaySites your site, your words and your domain are yours. No long contract holds them hostage.'],
  ['Are you locked into a contract?', 'Long agreements are common in this business, and they keep you paying whether the site works or not.', 'We have no long-term contract. We keep your business by keeping your site worth having.'],
  ['How fast is your site, really?', 'Speed decides whether people wait for your page or go back to the next result. You can test any site yourself with Google’s PageSpeed Insights.', 'Every SaySites page has to score 95 or more on the speed check before it can go live, and our example sites score 100.'],
  ['Can you see what you’re paying for?', 'Monthly reports full of numbers can hide whether anything changed.', 'You get a weekly Visibility Score that shows where your site stands and what would move it, in plain English, and you see every change before it goes live.'],
  ['How long does a small change take?', 'A new photo or a new line of text shouldn’t take a support ticket and a week.', 'Ask us, or log in and change it yourself in plain words. Either way you see it before it goes live.'],
  ['Did you see the site before you paid for it?', 'Most businesses pick a website company from a pitch.', 'We start with a free redesign of your current site, so you can judge the work itself before you decide anything.'],
  ['Does your site follow Google’s rules?', 'Shortcuts that worked once can get a site pushed down later.', 'Every SaySites site follows Google’s published guidelines, and when Google changes them we update the platform once, so every site keeps up. We never buy links or invent reviews.'],
]

export default async function About({ searchParams }: { searchParams: Promise<{ sent?: string; talk?: string }> }) {
  const sp = await searchParams
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Why SaySites</p>
          <h1>Why businesses switch to SaySites.</h1>
          <p>Your website is where most new clients decide whether to call you. These are the questions worth asking whoever runs yours today, and our answers to every one of them.</p>
        </div>
      </section>

      <section className="ag-sec ag-why">
        <div className="wrap">
          <ol className="ag-qs">
            {QUESTIONS.map(([q, them, us]) => (
              <li key={q}>
                <h2>{q}</h2>
                <p>{them}</p>
                <p className="ag-us"><b>At SaySites</b>{us}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ag-sec ag-switch">
        <div className="wrap">
          <div className="head">
            <p className="kicker">Switching is simple</p>
            <h2>We do the moving.</h2>
          </div>
          <ol className="ag-steps">
            <li><b>See it first</b><span>Send us your current site and see it rebuilt, free, before you’ve committed to anything.</span></li>
            <li><b>Keep what ranks</b><span>Your pages stay at the same addresses wherever we can, with redirects for the rest, so search results keep working.</span></li>
            <li><b>Approve it</b><span>Look through every page from one private link and ask for changes. Nothing goes live until you say so.</span></li>
            <li><b>Point your domain</b><span>We walk you through it step by step. Your old site stays up until the moment you switch.</span></li>
          </ol>
        </div>
      </section>

      <section className="ag-talk ag-talk-light" id="talk">
        <div className="wrap ag-talk-in">
          <div>
            <h2>Let’s talk about switching.</h2>
            <p>Tell us about your business and your current site. We’ll get back to you to talk it through, with no pressure.</p>
            <p className="ag-talk-alt">Rather see it first? <a href="/redesign">Get a free redesign of your current site.</a></p>
          </div>
          <TalkForm from="/about" sent={sp.sent === '1'} missing={sp.talk === 'missing'} />
        </div>
      </section>
    </MarketingShell>
  )
}
