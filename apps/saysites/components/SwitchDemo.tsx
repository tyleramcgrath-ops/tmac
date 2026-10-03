import Image from 'next/image'
import { LogoMark, Wordmark } from './Logo'

// "How easy is it to switch?" A drawing of the SaySites editor (not a live
// app): a firm moves its old site over by talking to Sofie. The firm is the
// example law firm, and the screenshot is its real page.
export function SwitchDemo() {
  return (
    <div className="ag-demo-in">
      <div className="app" aria-hidden="true">
        <div className="app-bar">
          <span className="app-logo"><LogoMark size={24} /><Wordmark /></span>
          <span className="app-site">Hale &amp; Porter Law</span>
          <div className="app-tabs"><span className="on">Home</span><span>Practice Areas</span><span>Attorneys</span><span>Contact</span></div>
          <span className="app-live"><i />Draft</span>
          <span className="app-pub">Publish</span>
        </div>
        <div className="app-body">
          <div className="canvas">
            <div className="frame">
              <div className="frame-bar"><i /><i /><i /><span>hale-and-porter.saysites.com</span></div>
              <div className="frame-body"><Image src="/media/law/classic.jpg" alt="" width={1280} height={860} sizes="(max-width: 900px) 92vw, 760px" /></div>
            </div>
          </div>
          <aside className="side">
            <div className="side-h"><span><LogoMark size={14} />Sofie</span><span>Speed 100</span></div>
            <div className="msg me m1">We’re switching from our old website. Can you bring it over?</div>
            <div className="msg her m2">I’ve rebuilt it here: your pages, words and photos, each at the same address as before, with redirects for the old links.</div>
            <div className="diff m3">
              <div><span>Pages carried over</span><span>Same addresses</span></div>
              <div><span>Old links</span><span>Redirected</span></div>
              <div><span>Speed check</span><span>100</span></div>
            </div>
            <div className="msg me m4">Add Elena to the Attorneys page and publish it.</div>
            <div className="ask">Ask Sofie to change anything</div>
          </aside>
        </div>
      </div>
      <p className="product-note">A preview of the SaySites editor. You see every change before it goes live, and nothing changes on your old site until you point your domain here.</p>
    </div>
  )
}
