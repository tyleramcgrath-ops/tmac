// The few words SaySites itself puts on a customer's site (form labels,
// footer headings, the phone call bar). Everything else is the owner's own
// content, written in the site's language by the owner or Sofie.

export interface SiteWords {
  locale: string
  yourName: string
  email: string
  phone: string
  optional: string
  howCanWeHelp: string
  thanks: string
  leaveEmpty: string
  contact: string
  hours: string
  pages: string
  home: string
  leaveReview: string
  call: string
  directions: string
  quickContact: string
  mainNav: string
  readMore: string
  noPosts: string
  soldOut: string
  buyNow: string
  askAboutThis: string
  allPosts: string
  getInTouch: string
  blogName: string
  blogHeading: string
  blogIntro: (name: string) => string
  blogTitle: (name: string) => string
  stars: (n: number) => string
  notFound: { title: string; heading: string; text: string; home: string; contact: string }
  days: Record<string, string>
  clock: (h: number, m: string) => string
}

export const WORDS: Record<'en' | 'es', SiteWords> = {
  en: {
    locale: 'en-US',
    yourName: 'Your name',
    email: 'Email',
    phone: 'Phone',
    optional: 'optional',
    howCanWeHelp: 'How can we help?',
    thanks: 'Thanks! Your message is on its way. We will get back to you soon.',
    leaveEmpty: 'Leave this empty',
    contact: 'Contact',
    hours: 'Hours',
    pages: 'Pages',
    home: 'Home',
    leaveReview: 'Leave us a review',
    call: 'Call',
    directions: 'Directions',
    quickContact: 'Quick contact',
    mainNav: 'Main',
    readMore: 'Read more',
    noPosts: 'New posts are on the way.',
    soldOut: 'Sold out',
    buyNow: 'Buy now',
    askAboutThis: 'Ask about this',
    allPosts: '← All posts',
    getInTouch: 'Get in touch',
    blogName: 'Blog',
    blogHeading: 'News & tips',
    blogIntro: (name) => `Advice, news and updates from ${name}.`,
    blogTitle: (name) => `News and tips from ${name}`,
    stars: (n) => `${n} out of 5 stars`,
    notFound: { title: 'Page not found', heading: 'We couldn’t find that page', text: 'It may have moved, or the link may have a typo. These will get you back on track.', home: 'Go to the home page', contact: 'Contact us' },
    days: { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun' },
    clock: (h, m) => `${h % 12 || 12}${m === '00' ? '' : `:${m}`}${h < 12 ? 'am' : 'pm'}`,
  },
  es: {
    locale: 'es-ES',
    yourName: 'Tu nombre',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    optional: 'opcional',
    howCanWeHelp: '¿En qué podemos ayudarte?',
    thanks: '¡Gracias! Recibimos tu mensaje y te responderemos pronto.',
    leaveEmpty: 'Deja esto vacío',
    contact: 'Contacto',
    hours: 'Horario',
    pages: 'Páginas',
    home: 'Inicio',
    leaveReview: 'Déjanos una reseña',
    call: 'Llamar',
    directions: 'Cómo llegar',
    quickContact: 'Contacto rápido',
    mainNav: 'Principal',
    readMore: 'Leer más',
    noPosts: 'Pronto habrá nuevas publicaciones.',
    soldOut: 'Agotado',
    buyNow: 'Comprar',
    askAboutThis: 'Consultar',
    allPosts: '← Todas las publicaciones',
    getInTouch: 'Contáctanos',
    blogName: 'Blog',
    blogHeading: 'Noticias y consejos',
    blogIntro: (name) => `Consejos, noticias y novedades de ${name}.`,
    blogTitle: (name) => `Noticias y consejos de ${name}`,
    stars: (n) => `${n} de 5 estrellas`,
    notFound: { title: 'Página no encontrada', heading: 'No encontramos esa página', text: 'Puede que se haya movido o que el enlace tenga un error. Estas opciones te llevarán de vuelta.', home: 'Ir a la página de inicio', contact: 'Contáctanos' },
    days: { Mo: 'Lun', Tu: 'Mar', We: 'Mié', Th: 'Jue', Fr: 'Vie', Sa: 'Sáb', Su: 'Dom' },
    // Spanish-speaking countries mostly read the 24-hour clock.
    clock: (h, m) => `${h}:${m}`,
  },
}

export function wordsFor(language: string | undefined): SiteWords {
  return language?.toLowerCase().startsWith('es') ? WORDS.es : WORDS.en
}
