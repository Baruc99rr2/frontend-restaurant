// Datos para buscadores y redes. Funciones puras: las usa el build (vite.config.ts escribe
// los meta tags en index.html) y el navegador (JSON-LD con los datos del repositorio).
// Imports relativos y con extensión a propósito: vite.config.ts no conoce el alias `@/` y el
// cargador nativo de Vite pide extensiones y atributos de import en el JSON.

import editorialJson from '../content/editorial.json' with { type: 'json' }
import { media } from '../content/media.generated.ts'
import type { MediaImage } from '../content/media.types.ts'
import type { PublicLocal } from '../data/types.ts'
import { siteConfig } from './site.config.ts'

const absoluta = (path: string) => `${siteConfig.seo.url}${path}`

const escapar = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Foto de Open Graph (`medios.openGraph` de editorial.json), 16:9 grande. */
function imagenOg() {
  const id = (editorialJson as { medios?: { openGraph?: string } }).medios?.openGraph
  const img = id ? (media.images as Record<string, MediaImage>)[id] : undefined
  return img ? { url: absoluta(img.paisaje.lg.webp), width: img.paisaje.lg.width, height: img.paisaje.lg.height } : null
}

/** `<title>`, description, Open Graph y Twitter: lo escribe el build en el `<head>`. */
export function etiquetasHead(): string {
  const { seo, marca, locale, tema } = siteConfig
  const og = imagenOg()
  const meta = (atributo: 'name' | 'property', clave: string, valor: string | number) =>
    `<meta ${atributo}="${clave}" content="${escapar(String(valor))}" />`
  return [
    `<title>${escapar(seo.titulo)}</title>`,
    meta('name', 'description', seo.descripcion),
    meta('name', 'theme-color', tema.themeColor),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', marca.wordmark[0]),
    meta('property', 'og:title', seo.titulo),
    meta('property', 'og:description', seo.descripcion),
    meta('property', 'og:url', absoluta('/')),
    meta('property', 'og:locale', locale.replace('-', '_')),
    ...(og
      ? [
          meta('property', 'og:image', og.url),
          meta('property', 'og:image:width', og.width),
          meta('property', 'og:image:height', og.height),
        ]
      : []),
    meta('name', 'twitter:card', og ? 'summary_large_image' : 'summary'),
  ].join('\n    ')
}

const DIAS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

/**
 * JSON-LD `Restaurant` (schema.org): nombre, dirección y horario salen del repositorio;
 * contacto, coordenadas, redes y cocina de `site.config.ts`.
 */
export function jsonLdRestaurante(local: PublicLocal) {
  const { seo, contacto, mapa, redes, locale } = siteConfig
  const og = imagenOg()
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: local.name,
    url: absoluta('/'),
    menu: absoluta('/carta'),
    ...(og ? { image: og.url } : {}),
    telephone: contacto.telefono.tel,
    email: contacto.email,
    servesCuisine: seo.cocina,
    priceRange: seo.rangoPrecios,
    ...(local.address
      ? { address: { '@type': 'PostalAddress', streetAddress: local.address, addressCountry: locale.split('-')[1] } }
      : {}),
    geo: { '@type': 'GeoCoordinates', latitude: mapa.lat, longitude: mapa.lng },
    openingHoursSpecification: local.weekly.map((f) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DIAS[f.weekday] ?? 'Sunday'}`,
      opens: f.opens_at,
      closes: f.closes_at,
    })),
    sameAs: redes.filter((r) => r.red !== 'whatsapp').map((r) => r.url),
  }
}

/**
 * Precargas del `<head>`: las fuentes que espera la intro (las usa también la carta).
 * `fuentes`: nombres de archivo del build (con hash). Las que dependen de la ruta (póster de
 * HOME, portada de la categoría) las agrega el script de `loaderEstatico.ts`.
 */
export function precargasHead(fuentes: string[]): string {
  return fuentes.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/${f}" crossorigin />`).join('\n    ')
}
