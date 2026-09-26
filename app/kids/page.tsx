import type { Metadata } from 'next'
import Image from 'next/image'
import { MarketingShell } from '@/components/MarketingShell'
import '../home.css'
import './kids.css'

// SaySites for kids: a preview of the idea, not a product yet. It stays out
// of search and isn't linked anywhere until kids mode (parent-owned, parent
// approves before anything goes live) is built.
export const metadata: Metadata = {
  title: 'SaySites for kids',
  description: 'Kids dream up the business. Parents stay in charge. A safe place for young entrepreneurs to build a real website.',
  robots: { index: false, follow: false },
}

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=900`

function NailSite() {
  return (
    <div className="kd-site">
      <div className="kd-nav"><b>Polished <span>by P</span></b><span>Designs</span><span>Prices</span><em>Ask a grown-up to book</em></div>
      <div className="kd-hero">
        <div>
          <small>Nail art · Saturdays</small>
          <h3>Tiny nails, big ideas.</h3>
          <p>Pastel sets, glitter tips and matching nails for best friends. I paint them myself, carefully.</p>
          <div className="kd-btns"><em>See my designs</em><span>Prices →</span></div>
        </div>
        <div className="kd-ph"><Image src={U('1688583417770-ff6cc18071dc')} alt="Pastel painted nails" fill sizes="(max-width: 900px) 45vw, 360px" style={{ objectFit: 'cover' }} /></div>
      </div>
      <div className="kd-row">
        {[
          ['1688583417757-9060cba25399', 'Pastel set', '$5'],
          ['1697771662409-e670b8aa2bdb', 'Party nails', '$8'],
          ['1772322586702-73125782bd99', 'Ocean ombre', '$8'],
        ].map(([id, t, p]) => (
          <div key={t}>
            <div className="kd-th"><Image src={U(id)} alt={t} fill sizes="(max-width: 900px) 30vw, 200px" style={{ objectFit: 'cover' }} /></div>
            <b>{t}</b><span>{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function KidsPage() {
  return (
    <MarketingShell>
      <section className="page-hero kd-top">
        <div className="wrap kd-hero-grid">
          <div>
            <p className="kicker">SaySites for kids · coming soon</p>
            <h1>Big ideas deserve a real website.</h1>
            <p>Kids dream up the business: nails, lemonade, dog walking, comics, bracelets. They build the website themselves, in their own words. Parents stay in charge of everything, and nothing goes live until a grown-up says yes.</p>
            <p className="kd-soon">Kids mode is on its way. It isn’t open yet.</p>
          </div>
          <div className="frame kd-frame">
            <div className="frame-bar"><i /><i /><i /><span>polished-by-p.saysites.com</span></div>
            <div className="frame-body"><NailSite /></div>
          </div>
        </div>
      </section>

      <section className="kd-sec">
        <div className="wrap">
          <h2>Three steps. No grown-up words.</h2>
          <ol className="kd-steps">
            <li><b>Say your idea</b><span>“I want to do nails for my friends.” That’s enough to start.</span></li>
            <li><b>Make it yours</b><span>Pick the colors, name your designs, set your own prices. Ask Sofie to change anything.</span></li>
            <li><b>Show your family</b><span>A grown-up takes a look and says yes. Then it’s a real website with its own address.</span></li>
          </ol>
        </div>
      </section>

      <section className="kd-sec kd-alt">
        <div className="wrap kd-split">
          <div>
            <p className="kicker">For parents</p>
            <h2>Your account. Your rules.</h2>
            <p>Your child builds inside your account, never their own. You see everything they make and nothing is public until you approve it.</p>
          </div>
          <ul className="kd-safe">
            <li><b>You approve before anything goes live.</b> Every change waits for you.</li>
            <li><b>First names only.</b> No surname, photo, address, school or phone number on the page.</li>
            <li><b>Messages come to you.</b> Anything sent through the site goes to your email, not your child’s.</li>
            <li><b>Hidden from search.</b> Kids’ sites stay out of Google unless you choose otherwise.</li>
            <li><b>Sofie keeps it kind.</b> In kids mode she uses simple words, won’t ask for personal details and won’t build anything that isn’t right for kids.</li>
          </ul>
        </div>
      </section>

      <section className="kd-sec">
        <div className="wrap kd-why">
          <h2>What they learn along the way</h2>
          <div className="kd-grid">
            <div><b>Describing an idea</b><span>Putting what they want into words someone else understands.</span></div>
            <div><b>Setting a price</b><span>What things cost to make, and what feels fair to charge.</span></div>
            <div><b>Thinking about customers</b><span>Who it’s for, and what they’d want to know first.</span></div>
            <div><b>Finishing something</b><span>From an idea on Saturday morning to a real page they can show people.</span></div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
