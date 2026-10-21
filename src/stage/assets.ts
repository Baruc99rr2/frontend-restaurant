import { paneles } from '@/content/copy.es'
import { editorial, imagen } from '@/content/editorial'
import { media } from '@/content/media.generated'

/** Pantallas < 1024 px usan la versión chica del video y su póster (§5 Video). */
const videoGrande = () =>
  typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches

export const videoInfo = (() => {
  const v = media.video
  if (!v) return null
  const lg = videoGrande()
  return {
    src: lg ? v.sources.lg.src : v.sources.sm.src,
    poster: lg ? v.poster.lg.webp : v.poster.sm.webp,
    placeholder: v.poster.placeholder,
  }
})()

/** Foto del modo cerrado de un panel (HOME usa el video → null). */
export function fotoEscenario(index: number) {
  const panel = paneles[index]
  if (!panel || panel.key === 'home') return null
  return imagen(editorial.medios.escenario[panel.key])
}

/** Resuelve cuando la imagen está decodificada (o falló: nunca bloquea). */
export function precargarImagen(src: string | undefined): Promise<void> {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') return resolve()
    const img = new Image()
    img.onload = () => {
      img.decode().then(resolve, resolve)
    }
    img.onerror = () => resolve()
    img.src = src
  })
}

