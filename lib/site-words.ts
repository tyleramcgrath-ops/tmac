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
  photosBy: string
  onUnsplash: string
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
  // Joins a range of times: "7am to 6pm".
  to: string
  privacy: string
  breadcrumb: string
  chatText: string
  chatWhatsapp: string
  chatMessenger: string
  getInTouch: string
  blogName: string
  blogHeading: string
  blogIntro: (name: string) => string
  blogTitle: (name: string) => string
  stars: (n: number) => string
  upcomingEvents: string
  months: string[]
  notFound: { title: string; heading: string; text: string; home: string; contact: string }
  days: Record<string, string>
  clock: (h: number, m: string) => string
  shop: ShopWords
}

// The shop's words: product pages, the cart and the order pages.
export interface ShopWords {
  shop: string
  addToCart: string
  chooseOptions: string
  from: string
  was: string
  quantity: string
  onlyLeft: (n: number) => string
  cart: string
  yourCart: string
  emptyCart: string
  keepShopping: string
  item: string
  remove: string
  update: string
  subtotal: string
  discount: string
  shipping: string
  tax: string
  taxAtCheckout: string
  total: string
  code: string
  apply: string
  howToGet: string
  zip: string
  check: string
  free: string
  checkout: string
  checkoutNote: string
  paused: string
  thanksTitle: string
  thanksText: (email: string) => string
  orderNumber: (n: string) => string
  processing: string
  orderTitle: string
  status: string
  tracking: string
  returns: string
  returnsTitle: string
  returnsNone: string
  returnsDays: (days: number, free: boolean) => string
  shipsTo: string
  pickupAt: string
  methods: Record<'ship' | 'express' | 'pickup' | 'delivery' | 'none', string>
  steps: Record<'placed' | 'unfulfilled' | 'shipped' | 'ready' | 'out' | 'done' | 'refunded', string>
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
    photosBy: 'Photos by',
    onUnsplash: 'on',
    call: 'Call',
    directions: 'Directions',
    quickContact: 'Quick contact',
    mainNav: 'Main',
    readMore: 'Read more',
    noPosts: 'New posts are on the way.',
    soldOut: 'Sold out',
    buyNow: 'Buy now',
    askAboutThis: 'Ask about this',
    allPosts: 'All posts',
    to: 'to',
    privacy: 'Privacy',
    breadcrumb: 'You are here',
    chatText: 'Text us',
    chatWhatsapp: 'WhatsApp us',
    chatMessenger: 'Message us',
    getInTouch: 'Get in touch',
    blogName: 'Blog',
    blogHeading: 'News & tips',
    blogIntro: (name) => `Advice, news and updates from ${name}.`,
    blogTitle: (name) => `News and tips from ${name}`,
    stars: (n) => `${n} out of 5 stars`,
    upcomingEvents: 'Coming up',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    notFound: { title: 'Page not found', heading: 'We couldn’t find that page', text: 'It may have moved, or the link may have a typo. These will get you back on track.', home: 'Go to the home page', contact: 'Contact us' },
    days: { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun' },
    shop: {
      shop: 'Shop',
      addToCart: 'Add to cart',
      chooseOptions: 'Choose options',
      from: 'From',
      was: 'Was',
      quantity: 'Quantity',
      onlyLeft: (n) => `Only ${n} left`,
      cart: 'Cart',
      yourCart: 'Your cart',
      emptyCart: 'Your cart is empty.',
      keepShopping: 'Keep shopping',
      item: 'Item',
      remove: 'Remove',
      update: 'Update',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      tax: 'Tax',
      taxAtCheckout: 'Any tax is added at checkout.',
      total: 'Total',
      code: 'Discount code',
      apply: 'Apply',
      howToGet: 'How would you like to get it?',
      zip: 'ZIP or postal code',
      check: 'Check',
      free: 'Free',
      checkout: 'Check out',
      checkoutNote: 'You’ll pay securely on Stripe’s checkout page.',
      paused: 'Online orders are paused for now. Please get in touch to order.',
      thanksTitle: 'Thank you for your order',
      thanksText: (email) => (email ? `A confirmation is on its way to ${email}.` : 'Your order is confirmed.'),
      orderNumber: (n) => `Order ${n}`,
      processing: 'Your payment is being confirmed. This page will show your order as soon as it is.',
      orderTitle: 'Your order',
      status: 'Status',
      tracking: 'Track your package',
      returns: 'Returns',
      returnsTitle: 'Returns and refunds',
      returnsNone: 'All sales are final. Please get in touch if something is wrong with your order.',
      returnsDays: (days, free) => `You can return items within ${days} days of delivery${free ? ', free of charge' : ''}.`,
      shipsTo: 'Ships to',
      pickupAt: 'Pickup',
      methods: { ship: 'Shipping', express: 'Express shipping', pickup: 'Pickup', delivery: 'Local delivery', none: 'No delivery needed' },
      steps: { placed: 'Order placed', unfulfilled: 'Being prepared', shipped: 'Shipped', ready: 'Ready for pickup', out: 'Out for delivery', done: 'Completed', refunded: 'Refunded' },
    },
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
    photosBy: 'Fotos de',
    onUnsplash: 'en',
    call: 'Llamar',
    directions: 'Cómo llegar',
    quickContact: 'Contacto rápido',
    mainNav: 'Principal',
    readMore: 'Leer más',
    noPosts: 'Pronto habrá nuevas publicaciones.',
    soldOut: 'Agotado',
    buyNow: 'Comprar',
    askAboutThis: 'Consultar',
    allPosts: 'Todas las publicaciones',
    to: 'a',
    privacy: 'Privacidad',
    breadcrumb: 'Está aquí',
    chatText: 'Escríbanos',
    chatWhatsapp: 'WhatsApp',
    chatMessenger: 'Mensaje',
    getInTouch: 'Contáctanos',
    blogName: 'Blog',
    blogHeading: 'Noticias y consejos',
    blogIntro: (name) => `Consejos, noticias y novedades de ${name}.`,
    blogTitle: (name) => `Noticias y consejos de ${name}`,
    stars: (n) => `${n} de 5 estrellas`,
    upcomingEvents: 'Próximos eventos',
    months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    notFound: { title: 'Página no encontrada', heading: 'No encontramos esa página', text: 'Puede que se haya movido o que el enlace tenga un error. Estas opciones te llevarán de vuelta.', home: 'Ir a la página de inicio', contact: 'Contáctanos' },
    days: { Mo: 'Lun', Tu: 'Mar', We: 'Mié', Th: 'Jue', Fr: 'Vie', Sa: 'Sáb', Su: 'Dom' },
    // Spanish-speaking countries mostly read the 24-hour clock.
    shop: {
      shop: 'Tienda',
      addToCart: 'Añadir al carrito',
      chooseOptions: 'Elegir opciones',
      from: 'Desde',
      was: 'Antes',
      quantity: 'Cantidad',
      onlyLeft: (n) => `Solo quedan ${n}`,
      cart: 'Carrito',
      yourCart: 'Tu carrito',
      emptyCart: 'Tu carrito está vacío.',
      keepShopping: 'Seguir comprando',
      item: 'Artículo',
      remove: 'Quitar',
      update: 'Actualizar',
      subtotal: 'Subtotal',
      discount: 'Descuento',
      shipping: 'Entrega',
      tax: 'Impuestos',
      taxAtCheckout: 'Los impuestos se añaden al pagar.',
      total: 'Total',
      code: 'Código de descuento',
      apply: 'Aplicar',
      howToGet: '¿Cómo quieres recibirlo?',
      zip: 'Código postal',
      check: 'Comprobar',
      free: 'Gratis',
      checkout: 'Pagar',
      checkoutNote: 'Pagarás de forma segura en la página de pago de Stripe.',
      paused: 'Los pedidos en línea están en pausa. Contáctanos para hacer un pedido.',
      thanksTitle: 'Gracias por tu pedido',
      thanksText: (email) => (email ? `Te enviamos una confirmación a ${email}.` : 'Tu pedido está confirmado.'),
      orderNumber: (n) => `Pedido ${n}`,
      processing: 'Estamos confirmando tu pago. Esta página mostrará tu pedido en cuanto esté listo.',
      orderTitle: 'Tu pedido',
      status: 'Estado',
      tracking: 'Seguir tu paquete',
      returns: 'Devoluciones',
      returnsTitle: 'Devoluciones y reembolsos',
      returnsNone: 'Todas las ventas son finales. Contáctanos si hay algún problema con tu pedido.',
      returnsDays: (days, free) => `Puedes devolver artículos dentro de los ${days} días posteriores a la entrega${free ? ', sin costo' : ''}.`,
      shipsTo: 'Envíos a',
      pickupAt: 'Recogida',
      methods: { ship: 'Envío', express: 'Envío exprés', pickup: 'Recogida', delivery: 'Entrega local', none: 'Sin entrega' },
      steps: { placed: 'Pedido realizado', unfulfilled: 'En preparación', shipped: 'Enviado', ready: 'Listo para recoger', out: 'En camino', done: 'Completado', refunded: 'Reembolsado' },
    },
    clock: (h, m) => `${h}:${m}`,
  },
}

export function wordsFor(language: string | undefined): SiteWords {
  return language?.toLowerCase().startsWith('es') ? WORDS.es : WORDS.en
}
