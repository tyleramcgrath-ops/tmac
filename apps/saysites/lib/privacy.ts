// Every site gets a plain privacy page at /privacy (unless the owner writes
// their own): what the contact form and the site collect, and how to ask for
// it to be deleted. Only what SaySites actually does, in plain words.

import type { Page, Site } from './schema'

export function privacyPage(site: Site): Page {
  const b = site.business
  const es = site.language === 'es'
  const reach = [b.email, b.phone].filter(Boolean).join(es ? ' o ' : ' or ')
  const shop = !!site.store?.checkout?.ready
  // Amazon picks (lib/amazon): links to Amazon with the owner's Associates tag.
  const amazon = !!site.store?.amazon && !!site.store.products.some((p) => p.amazon && p.status !== 'draft')
  const text = es
    ? [
        `Este sitio pertenece a ${b.name}. Esta página explica qué datos se recogen cuando lo visita y qué hacemos con ellos.`,
        `Si nos escribe con el formulario de contacto, recibimos lo que usted escribe: su nombre, sus datos de contacto y su mensaje. Lo usamos solo para responderle. No lo vendemos ni lo compartimos con nadie para publicidad.`,
        `El sitio cuenta las visitas a cada página para saber qué páginas son útiles. Una pequeña cookie recuerda qué enlace o anuncio le trajo aquí, para que ${b.name} sepa qué publicidad funciona; no se comparte con nadie y caduca a los 90 días. El sitio no muestra anuncios.`,
        ...(amazon ? [`Algunos productos enlazan a Amazon. En calidad de Afiliado de Amazon, ${b.name} obtiene ingresos por las compras adscritas que cumplen los requisitos aplicables. Este sitio no le pone cookies por esos enlaces; si sigue uno, Amazon puede usar sus propias cookies en su sitio, según su aviso de privacidad.`] : []),
        ...(shop ? [`Si compra en la tienda, otra cookie recuerda lo que hay en su carrito durante 30 días. El pago se hace en la página segura de Stripe; ${b.name} recibe su nombre, sus datos de contacto, la dirección de entrega y lo que pidió, solo para preparar y entregar el pedido.`] : []),
        reach ? `Para ver, corregir o borrar lo que nos haya enviado, escríbanos o llámenos: ${reach}.` : `Para ver, corregir o borrar lo que nos haya enviado, escríbanos desde la página de contacto.`,
      ]
    : [
        `This website belongs to ${b.name}. This page explains what is collected when you visit it and what we do with it.`,
        `If you send us a message through the contact form, we receive what you write: your name, how to reach you and your message. We use it only to reply to you. We don't sell it or share it with anyone for advertising.`,
        `The site counts visits to each page so we know which pages are useful. One small cookie remembers which link or ad brought you here, so ${b.name} knows which advertising works; it isn't shared with anyone and expires after 90 days. The site shows no ads.`,
        ...(amazon ? [`Some products link to Amazon. As an Amazon Associate, ${b.name} earns from qualifying purchases. This site sets no cookie for those links; if you follow one, Amazon may use its own cookies on its site, under Amazon's privacy notice.`] : []),
        ...(shop ? [`If you shop here, another cookie remembers what's in your cart for 30 days. You pay on Stripe's secure checkout page; ${b.name} receives your name, contact details, delivery address and what you ordered, only to prepare and deliver your order.`] : []),
        reach ? `To see, correct or delete anything you've sent us, get in touch: ${reach}.` : `To see, correct or delete anything you've sent us, write to us from the contact page.`,
      ]
  const title = es ? 'Privacidad' : 'Privacy'
  return {
    id: `${site.id}_privacy`,
    siteId: site.id,
    slug: 'privacy',
    name: title,
    status: 'published',
    seo: { title: `${title} | ${b.name}`.slice(0, 70), description: (es ? `Cómo ${b.name} trata los datos de quienes visitan su sitio.` : `How ${b.name} handles the information of people who visit its website.`).slice(0, 170) },
    body: [
      {
        id: 'privacy',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: { desktop: { top: 88, right: 24, bottom: 96, left: 24 }, mobile: { top: 56, right: 20, bottom: 64, left: 20 } }, gap: { desktop: 16 } },
        children: [
          { id: 'privacy-h', type: 'heading', level: 1, text: title, style: { fontSize: { desktop: 44, mobile: 34 } } },
          { id: 'privacy-t', type: 'text', text: text.join('\n\n'), style: { maxWidth: 720, fontSize: { desktop: 18 } } },
        ],
      },
    ],
    updatedAt: site.updatedAt,
  }
}
