import { useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import type { Viewport } from '@/stage/geometry'

/**
 * Tamaño de un elemento (el escenario mide `100svh`, no `innerHeight`: en mobile la
 * barra del navegador cambia `innerHeight` pero no el escenario). Misma medida que usa el marco.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): Viewport {
  const [size, setSize] = useState<Viewport>(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }))

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    }
    // El observer notifica una vez al empezar a observar: no hace falta medir a mano.
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return size
}

const COARSE = '(hover: none) and (pointer: coarse)'

function subscribeCoarse(cb: () => void) {
  const mql = window.matchMedia(COARSE)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

/** Puntero táctil (para "Tocá para entrar" y gestos). */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribeCoarse, () => window.matchMedia(COARSE).matches, () => false)
}
