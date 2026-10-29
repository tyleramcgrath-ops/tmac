// Sends the owner to Stripe's own form to connect (or finish connecting)
// their Stripe account, then back to the Store settings. Stripe also sends
// people here when an onboarding link has expired.

import { accountStatus, connectReady, createAccount, onboardingLink } from '@/lib/checkout'
import { ownShop, saveShop } from '@/lib/shop-admin'

const APP = process.env.NODE_ENV === 'production' ? 'https://saysites.com' : ''

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const origin = APP || new URL(req.url).origin
  const settings = `${origin}/dashboard/sites/${id}/store/settings`
  if (!connectReady()) return Response.redirect(`${settings}?e=${encodeURIComponent('Payments aren’t switched on for SaySites yet. We’re on it.')}#payments`, 303)
  const { user, store, site } = await ownShop(id)
  const done = new URL(req.url).searchParams.get('done') === '1'
  try {
    let account = site.store?.checkout?.account
    if (done && account) {
      // Back from Stripe: can customers pay yet?
      const s = await accountStatus(account)
      await saveShop(store, site, (x) => ({ ...x, checkout: { account: account!, ready: s.ready } }))
      const note = s.ready ? 'm=connected' : `e=${encodeURIComponent('Stripe still needs a few details before customers can pay. Finish connecting to see what’s left.')}`
      return Response.redirect(`${settings}?${note}#payments`, 303)
    }
    if (!account) {
      account = await createAccount({ email: user.email, name: site.business.name, country: site.business.address?.country || 'US' })
      await saveShop(store, site, (x) => ({ ...x, checkout: { account: account!, ready: false } }))
    }
    const link = await onboardingLink(account, `${origin}/dashboard/sites/${id}/store/connect?done=1`, `${origin}/dashboard/sites/${id}/store/connect`)
    return Response.redirect(link, 303)
  } catch (err) {
    const msg = err instanceof Error ? err.message.replace(/^Stripe: /, '') : 'Stripe didn’t answer.'
    return Response.redirect(`${settings}?e=${encodeURIComponent(`Stripe couldn’t start the connection: ${msg}`)}#payments`, 303)
  }
}
