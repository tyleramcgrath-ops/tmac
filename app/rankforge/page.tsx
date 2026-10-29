import { redirect } from 'next/navigation'

// The marketing site now lives at the real routes under (marketing) — '/',
// '/features', '/wordpress', '/agency', '/pricing'. Keep the old path working
// by sending it to the homepage (avoids duplicate content).
export default function RankForgePage() {
  redirect('/')
}
