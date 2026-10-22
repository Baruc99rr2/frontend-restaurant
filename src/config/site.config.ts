// Configuración de marca del cliente (white-label). Para re-marcar el template
// se toca este archivo + src/content/* + las fotos en content/. Ver README.
//
// Regla: lo que existe en el backend (nombre, dirección, horarios, precios,
// carta, stock, zonas) NO va acá: sale del repositorio. Acá va lo editorial y
// lo que el endpoint público todavía no trae (marcado con `// backend: no lo trae`).

export type BrandColor = 'noche' | 'tizon' | 'oro' | 'champan' | 'monte' | 'hoja' | 'vino' | 'vino-luz' | 'ceniza' | 'velo'

export type RedSocial = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'whatsapp'

export const siteConfig = {
  /** Slug público del local en el backend: GET /v1/public/{slug}. */
  slug: 'quebracho-demo',
  locale: 'es-AR',
  moneda: 'ARS',

  marca: {
    /** Wordmark de dos líneas en Caslon (ref. 06). El nombre "oficial" sale del backend. */
    wordmark: ['Quebracho', 'cocina de fuego'] as const,
    bajada: 'cocina de fuego y bodega',
    /** Nombre gigante del pie de la carta (Archivo ancho 125 / 800). */
    nombreGigante: 'QUEBRACHO',
    desde: 2011,
    /** Para "Restaurante y bodega" del pie de la carta. */
    rubro: 'Restaurante y bodega',
  },

  /**
   * Colores de marca → variables `--brand-*` en :root (ver tokens.css).
   * `applyBrandTheme()` las escribe al arrancar: cambiar un valor acá re-colorea
   * todo el sitio, incluidas las utilidades de Tailwind (bg-oro, text-champan, …).
   */
  tema: {
    colores: {
      noche: '#000000',
      tizon: '#14120F',
      oro: '#B8914A',
      champan: '#E6D7A8',
      monte: '#13261C',
      hoja: '#2B4A38',
      vino: '#5E1222',
      'vino-luz': '#7A1C2C',
      ceniza: '#9A9384',
      velo: 'rgb(0 0 0 / 0.55)',
    } satisfies Record<BrandColor, string>,
    /** <meta name="theme-color"> */
    themeColor: '#000000',
  },

  /**
   * Buscadores y redes (meta tags y Open Graph se escriben en index.html al compilar;
   * el JSON-LD Restaurant se arma en el navegador con los datos del repositorio).
   * La foto de Open Graph es `medios.openGraph` de editorial.json.
   */
  seo: {
    // PLACEHOLDER: dominio del cliente, sin barra final (Open Graph y JSON-LD usan URLs absolutas).
    url: 'https://quebracho.example',
    titulo: 'Quebracho — cocina de fuego y bodega',
    descripcion:
      'Parrilla a leña de quebracho y bodega. Carta de temporada con menú del día, eventos y catering para tus celebraciones.',
    /** schema.org servesCuisine */
    cocina: ['Argentina', 'Parrilla'],
    /** schema.org priceRange */
    rangoPrecios: '$$',
  },

  // backend: no lo trae. El endpoint público no expone teléfono ni email del local.
  // PLACEHOLDER: números y email de ejemplo, no reales.
  contacto: {
    telefono: { mostrar: '388 000-0000', tel: '+543880000000' },
    /** wa.me sin "+" ni espacios. */
    whatsapp: '5493880000000',
    email: 'hola@quebracho.example',
  },

  // backend: no lo trae. Coordenadas del mapa (la dirección escrita sí sale del backend).
  // PLACEHOLDER: centro de San Salvador de Jujuy.
  mapa: {
    lat: -24.1858,
    lng: -65.2995,
    zoom: 16,
  },

  // PLACEHOLDER: perfiles genéricos.
  redes: [
    { red: 'instagram', url: 'https://www.instagram.com/' },
    { red: 'facebook', url: 'https://www.facebook.com/' },
    { red: 'tiktok', url: 'https://www.tiktok.com/' },
    { red: 'youtube', url: 'https://www.youtube.com/' },
    { red: 'whatsapp', url: 'https://wa.me/5493880000000' },
  ] satisfies { red: RedSocial; url: string }[],

  /** Textos de los botones que se repiten en varias pantallas. */
  botones: {
    verCarta: 'Ver la carta',
    verCartaCompleta: 'Ver la carta completa',
    reservar: 'Reservar mesa',
    pedirPresupuesto: 'Pedir presupuesto',
    comoLlegar: 'Cómo llegar',
    conocerLaCasa: 'Conocer la casa',
    volverAlInicio: 'Volver al inicio',
    vistaGeneral: 'Vista general',
    menu: 'Menu',
    cerrar: 'Cerrar',
  },

  /**
   * Columna derecha del HOME (lugar de los logos de la ref. 01).
   * PLACEHOLDER: cifras de ejemplo; reemplazar por las reales del cliente.
   */
  home: {
    placeholder: true,
    sello: 'Desde 2011',
    datos: [
      { valor: '140', etiqueta: 'etiquetas en bodega' },
      { valor: '12 h', etiqueta: 'de brasa en el asado' },
      { valor: '38', etiqueta: 'cubiertos' },
      { valor: '4,8', etiqueta: 'en reseñas' },
    ],
  },
} as const

/** Mensaje prearmado para "Reservar mesa" (la IA del backend toma pedidos, no reservas). */
export const whatsappUrl = (texto: string) => `https://wa.me/${siteConfig.contacto.whatsapp}?text=${encodeURIComponent(texto)}`

export const googleMapsUrl = () =>
  `https://www.google.com/maps/dir/?api=1&destination=${siteConfig.mapa.lat},${siteConfig.mapa.lng}`

/**
 * Escribe los colores de marca como variables `--brand-*` en :root.
 * Se llama una vez en main.tsx, antes del primer render. tokens.css tiene los
 * mismos valores por defecto, así que no hay parpadeo si este paso tarda.
 */
export function applyBrandTheme(root: HTMLElement = document.documentElement) {
  for (const [nombre, valor] of Object.entries(siteConfig.tema.colores)) {
    root.style.setProperty(`--brand-${nombre}`, valor)
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', siteConfig.tema.themeColor)
}
