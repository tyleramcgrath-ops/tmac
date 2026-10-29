# One Night

A dating app prototype built only for one-night meetups. Everything resets at 6:00 AM.

## How it works

- **18+ gate.** People confirm they're adults and that they're here for one night only.
- **Tonight.** Browse people who are out right now: first name, distance, where they are, and when they're heading home. Tap *I'm in* or *Not tonight*.
- **One match a night.** A mutual yes opens a chat and pauses browsing until dawn or until someone unmatches.
- **Terms.** Before meeting, each person marks Yes / Ask me / No on things like kissing, whose place, or staying over. You only see the shared result: both yes, talk about it, or off the table. A no never shows whose it was. Meeting somewhere public first and protection are required for everyone.
- **Safety.** A big *I'm out* button ends the match right away. You can save a trusted contact and start a check-in timer.
- **Sunrise.** At 6:00 AM all matches, chats and terms are deleted.

## Prototype limits

- The profiles are samples, and their replies are scripted.
- State is saved only in the browser's localStorage.
- Check-in alerts, location sharing and screenshot notices appear in the UI but nothing is actually sent.

A real launch would need accounts, ID and age verification, a backend for matching and chat, moderation and reporting, and real alert delivery.

## Files

- `index.html`: the standalone page. Open it in any browser.
- `app.html`: the same app without the document wrapper, used for the hosted Artifact preview.
