// Loader de la intro ya escrito en index.html (lo inserta el plugin de vite.config.ts).
// Imports relativos y con extensión: vite.config.ts no conoce el alias `@/`.

import { copy } from '../content/copy.es.ts'
import editorialJson from '../content/editorial.json' with { type: 'json' }
import { media } from '../content/media.generated.ts'
import type { MediaImage } from '../content/media.types.ts'
import { siteConfig } from './site.config.ts'

const escapar = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** `srcset` AVIF de la portada (forma `banda`) de cada categoría, por slug (como `Picture`). */
function portadasPorSlug(): Record<string, string> {
  const categorias = (editorialJson as { categorias?: Record<string, { slug?: string; portada?: string }> }).categorias ?? {}
  const imagenes = media.images as Record<string, MediaImage>
  const out: Record<string, string> = {}
  for (const { slug, portada } of Object.values(categorias)) {
    const banda = portada ? imagenes[portada]?.banda : undefined
    if (!slug || !banda) continue
    const variantes = banda.sm.width === banda.lg.width ? [banda.lg] : [banda.sm, banda.lg]
    out[slug] = variantes.map((v) => `${v.avif} ${v.width}w`).join(', ')
  }
  return out
}

/**
 * Monograma + anillo vacío + "Prendiendo el fuego", con las mismas clases y el mismo lugar que
 * el loader de `Intro.tsx`: se pinta antes de que llegue el JS (primer pintado) y React lo
 * reemplaza por el suyo sin que se note.
 * En `/` (HOME) el script precarga el póster del video (lo primero grande después del loader).
 * En `/carta/:slug` no hay intro: el script lo saca antes del primer pintado y precarga la
 * portada de esa categoría y el chunk de la página (`jsCategoria`, nombres del build).
 */
export function loaderEstatico(jsCategoria: string[] = []): string {
  const monograma = escapar(siteConfig.marca.wordmark[0].charAt(0))
  const radio = 30
  const circ = 2 * Math.PI * radio
  const anillo = (clase: string, extra = '') =>
    `<circle cx="36" cy="36" r="${radio}" fill="none" class="${clase}" stroke-width="1.5"${extra} />`
  const poster = media.video ? { sm: media.video.poster.sm.webp, lg: media.video.poster.lg.webp } : null
  const script = `(function () {
  var poster = ${JSON.stringify(poster)};
  if (poster && location.pathname === '/' && (!location.hash || location.hash === '#home')) {
    var p = document.createElement('link');
    p.rel = 'preload'; p.as = 'image'; p.setAttribute('fetchpriority', 'high');
    p.href = matchMedia('(min-width: 1024px)').matches ? poster.lg : poster.sm;
    document.head.appendChild(p);
  }
  var m = location.pathname.match(/^\\/carta\\/([^/]+)\\/?$/);
  if (!m) return;
  document.getElementById('cargador').remove();
  var h = document.head, portada = ${JSON.stringify(portadasPorSlug())}[decodeURIComponent(m[1])];
  if (portada) {
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'image'; l.type = 'image/avif';
    l.setAttribute('imagesrcset', portada); l.setAttribute('imagesizes', '100vw'); l.setAttribute('fetchpriority', 'high');
    h.appendChild(l);
  }
  ${JSON.stringify(jsCategoria.map((f) => `/${f}`))}.forEach(function (f) {
    var s = document.createElement('link');
    s.rel = 'modulepreload'; s.href = f; s.crossOrigin = '';
    h.appendChild(s);
  });
})()`
  return [
    '<div id="cargador" class="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-noche">',
    '<div class="relative grid size-20 place-items-center">',
    '<svg viewBox="0 0 72 72" class="absolute inset-0 size-full -rotate-90" aria-hidden="true">',
    anillo('stroke-champan/10'),
    anillo('stroke-oro', ` stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"`),
    '</svg>',
    `<span class="font-serif text-subtitulo leading-none text-champan" aria-hidden="true">${monograma}</span>`,
    '</div>',
    `<p class="font-ui text-etiqueta uppercase text-ceniza">${escapar(copy.intro.cargando)}</p>`,
    '</div>',
    `<script>${script}</script>`,
  ].join('')
}
