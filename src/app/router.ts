import { useSyncExternalStore } from 'react'

/**
 * Router mínimo (sin dependencias): la ruta sale de `location.pathname`.
 * - `/` → escenario (el hash `#clave` es del escenario, no del router).
 * - `/carta` → escenario + overlay de la carta (el escenario no se desmonta).
 * - `/carta/:slug` → página de categoría.
 * `navegar()` cambia la URL con la History API y avisa; el atrás/adelante del navegador
 * llega por `popstate`. Los componentes leen la ruta con `useRuta()`.
 */

export type Ruta =
  | { nombre: 'escenario' }
  | { nombre: 'carta' }
  | { nombre: 'categoria'; slug: string }
  | { nombre: 'otra'; path: string }

export const pathActual = () => window.location.pathname.replace(/\/+$/, '') || '/'

function leer(): Ruta {
  const path = pathActual()
  if (path === '/') return { nombre: 'escenario' }
  if (path === '/carta') return { nombre: 'carta' }
  const m = /^\/carta\/([^/]+)$/.exec(path)
  if (m?.[1]) return { nombre: 'categoria', slug: decodeURIComponent(m[1]) }
  return { nombre: 'otra', path }
}

const clave = (r: Ruta) => (r.nombre === 'categoria' ? `categoria:${r.slug}` : r.nombre === 'otra' ? `otra:${r.path}` : r.nombre)

let actual: Ruta = leer()
const oyentes = new Set<() => void>()
/** Esperas de `atras()`: se resuelven con el próximo `popstate`. */
let esperas: (() => void)[] = []
let volviendo = false

function emitir() {
  const nueva = leer()
  if (clave(nueva) === clave(actual)) return
  actual = nueva
  oyentes.forEach((l) => l())
}

window.addEventListener('popstate', () => {
  volviendo = false
  emitir()
  const pendientes = esperas
  esperas = []
  pendientes.forEach((r) => r())
})

export const rutaActual = () => actual

/** Hay un `history.back()` en curso (todavía no llegó su `popstate`). */
export const volviendoAtras = () => volviendo

export function navegar(path: string, { replace = false, state = null as unknown } = {}) {
  history[replace ? 'replaceState' : 'pushState'](state, '', path)
  emitir()
}

/**
 * Atrás del historial (`pasos` entradas). La promesa se resuelve cuando la ruta ya cambió
 * (o a los 800 ms si no había entrada a la que volver, para no colgar a quien espera).
 */
export function atras(pasos = 1): Promise<void> {
  return new Promise((resolve) => {
    volviendo = true
    let hecho = false
    const fin = () => {
      if (hecho) return
      hecho = true
      resolve()
    }
    esperas.push(fin)
    if (pasos === 1) history.back()
    else history.go(-pasos)
    setTimeout(() => {
      volviendo = false
      fin()
    }, 800)
  })
}

function subscribe(listener: () => void) {
  oyentes.add(listener)
  return () => oyentes.delete(listener)
}

/** Ruta actual (se re-renderiza al navegar o con atrás/adelante). */
export function useRuta(): Ruta {
  return useSyncExternalStore(subscribe, rutaActual, rutaActual)
}
