import { useLayoutEffect, type RefObject } from 'react'

/**
 * Texto gigante ajustado al ancho exacto de su contenedor (medido, no a ojo):
 * se mide a 100px y se escala. El elemento tiene que ser `inline-block whitespace-nowrap`
 * (su `scrollWidth` es el ancho del texto). Se recalcula al cambiar el ancho del
 * contenedor y cuando terminan de cargar las fuentes.
 */
export function useAjusteAncho(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    const contenedor = el?.parentElement
    if (!el || !contenedor) return
    let ultimoAncho = -1
    const ajustar = () => {
      const disponible = contenedor.clientWidth
      if (!disponible || disponible === ultimoAncho) return
      ultimoAncho = disponible
      el.style.fontSize = '100px'
      const ancho = el.scrollWidth
      if (ancho > 0) el.style.fontSize = `${(disponible * 100) / ancho}px`
    }
    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(contenedor)
    let cancelado = false
    void document.fonts?.ready.then(() => {
      if (cancelado) return
      ultimoAncho = -1
      ajustar()
    })
    return () => {
      cancelado = true
      ro.disconnect()
    }
  }, [ref])
}
