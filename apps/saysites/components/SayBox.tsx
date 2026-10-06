import Image from 'next/image'
import { LogoMark } from './Logo'

// The "say what your business does" box: a plain GET form to /signup?idea=,
// so it works with no JavaScript. Used on the homepage and at the foot of
// every marketing page.
export function SayBox({ id, label = 'Build my site' }: { id: string; label?: string }) {
  return (
    <form className="say" action="/signup" method="get" role="search" aria-label="Describe your business">
      <label htmlFor={id} className="visually-hidden">What does your business do?</label>
      <input id={id} name="idea" placeholder="A family bakery in Portland, Oregon…" autoComplete="off" maxLength={200} />
      <button className="b b-light" type="submit">{label}</button>
    </form>
  )
}

// The closing band: a dark photo, the logo mark and the say box.
export function ClosingSay({ id = 'idea-bottom' }: { id?: string }) {
  return (
    <section className="last">
      <div className="hero-bg">
        <Image src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=2000&q=75" alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
      </div>
      <div className="wrap">
        <LogoMark size={44} />
        <h2>Your website is one sentence away.</h2>
        <SayBox id={id} />
      </div>
    </section>
  )
}
