import { cuandoEsteLibre } from '@/app/libre'

// Chunks de la carta, aparte del principal (el escenario). Cada import dinámico se pide una
// sola vez: llamarlos de nuevo devuelve la misma promesa.

/** Overlay `/carta` (cartelitos, flip, pie). Lo monta el escenario apenas puede. */
export const cargarCartaOverlay = () => import('./CartaOverlay')

/** Página `/carta/:slug` (con Lenis, la polaroid y Flip). */
export const cargarCategoria = () => import('./CategoryPage')

/** Precarga cuando el navegador está libre (para que el barrido nunca descubra una página vacía). */
export function precargar(cargar: () => Promise<unknown>) {
  cuandoEsteLibre(() => void cargar().catch(() => {}), 2000)
}
