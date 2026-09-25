// A looping, CSS-only demo for the birthday page: type a business, watch
// the site appear, then ask Sofie for two changes. Decorative only.
export function BirthdayDemo() {
  return (
    <div className="bdd" aria-hidden="true">
      <div className="bdd-chat">
        <p className="bdd-msg bdd-m1"><span>A dog groomer in Austin, TX</span></p>
        <p className="bdd-sofie bdd-s1">Done. Your site is ready.</p>
        <p className="bdd-msg bdd-m2"><span>Sofie, make it warmer</span></p>
        <p className="bdd-msg bdd-m3"><span>Add Saturday hours, 9 to 2</span></p>
      </div>
      <div className="bdd-site">
        <div className="bdd-bar"><i /><i /><i /><span>pawsandco.saysites.com</span></div>
        <div className="bdd-page">
          <div className="bdd-top"><b>Paws &amp; Co.</b><span>Services · Contact</span></div>
          <div className="bdd-hero">
            <strong>Happy dogs, groomed gently in Austin.</strong>
            <em>Book a groom</em>
          </div>
          <div className="bdd-cards"><i /><i /><i /></div>
          <div className="bdd-hours">Open Saturday 9:00–2:00</div>
        </div>
      </div>
    </div>
  )
}
