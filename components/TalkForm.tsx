import { sendLead } from '@/app/talk-actions'

export const TALK_INDUSTRIES = ['Law firm', 'Medical practice', 'Med spa', 'Dental practice', 'Home services', 'Other']

// The "Let's talk" form. A plain form post (no client JavaScript); the page
// shows the thank-you when it comes back with ?sent=1.
export function TalkForm({ from, sent, missing, industry }: { from: string; sent?: boolean; missing?: boolean; industry?: string }) {
  if (sent)
    return (
      <div className="talk-done" role="status">
        <h3>Thank you. We have your message.</h3>
        <p>We’ll be in touch shortly to talk about your business and what your new site should do.</p>
      </div>
    )
  return (
    <form className="talk-form" action={sendLead}>
      <input type="hidden" name="from" value={from} />
      <label className="talk-hp" aria-hidden="true">Leave this empty<input name="website_hp" tabIndex={-1} autoComplete="off" /></label>
      {missing && <p className="talk-err" role="alert">Please add your name and an email or phone number so we can reach you.</p>}
      <div className="talk-row">
        <label>Your name<input name="name" required maxLength={80} autoComplete="name" /></label>
        <label>Business name<input name="business" maxLength={120} autoComplete="organization" /></label>
      </div>
      <div className="talk-row">
        <label>Email<input name="email" type="email" maxLength={200} autoComplete="email" /></label>
        <label>Phone<input name="phone" type="tel" maxLength={40} autoComplete="tel" /></label>
      </div>
      <div className="talk-row">
        <label>Industry
          <select name="industry" defaultValue={industry ?? ''}>
            <option value="" disabled>Choose one</option>
            {TALK_INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </label>
        <label>Current website<input name="site" maxLength={200} inputMode="url" placeholder="yourfirm.com, if you have one" /></label>
      </div>
      <label>What would you like your website to do?<textarea name="message" rows={4} maxLength={2000} /></label>
      <button className="b b-light" type="submit">Let’s talk</button>
    </form>
  )
}
