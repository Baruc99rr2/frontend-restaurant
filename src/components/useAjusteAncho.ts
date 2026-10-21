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

/**
 * Título gigante que puede partirse en líneas pero nunca desborda: el tamaño de su clase es el
 * tope, y se achica si la palabra más larga no entra en el ancho o si el texto ocuparía más de
 * `maxLineas`. Mide con un clon oculto, así sirve aunque `Reveal` tenga el texto partido.
 * El tamaño se pone en el elemento del ref (un envoltorio); el título de adentro lo hereda.
 * `texto`: el contenido del título (recalcula cuando cambia o cuando el elemento aparece).
 */
export function useTopeTitulo(ref: RefObject<HTMLElement | null>, texto: string | undefined, maxLineas = 2) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let ultimoAncho = -1
    const ajustar = () => {
      const disponible = el.clientWidth
      if (!disponible || disponible === ultimoAncho) return
      ultimoAncho = disponible
      el.style.fontSize = ''
      const tope = parseFloat(getComputedStyle(el).fontSize)
      const contenido = (texto ?? '').trim()
      if (!contenido) return
      const medidor = document.createElement('span')
      medidor.className = el.className
      medidor.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font-size:100px'
      el.appendChild(medidor)
      const medir = (t: string) => {
        medidor.textContent = t
        return medidor.getBoundingClientRect().width
      }
      const masLarga = Math.max(...contenido.split(/\s+/).map(medir))
      const total = medir(contenido)
      medidor.remove()
      // Margen de 8 % por cómo caen los cortes de línea.
      let tamano = Math.min(tope, (disponible * 100) / masLarga, (disponible * maxLineas * 100) / (total * 1.08))
      el.style.fontSize = `${tamano}px`
      // Si igual cayó en más líneas, achicar de a poco.
      for (let i = 0; i < 6; i++) {
        const lh = parseFloat(getComputedStyle(el).lineHeight) || tamano
        if (el.scrollHeight <= lh * maxLineas + 2) break
        tamano *= 0.94
        el.style.fontSize = `${tamano}px`
      }
      if (tamano >= tope) el.style.fontSize = ''
    }
    ajustar()
    const ro = new ResizeObserver(() => ajustar())
    ro.observe(el)
    const onResize = () => {
      ultimoAncho = -1
      ajustar()
    }
    window.addEventListener('resize', onResize)
    let cancelado = false
    void document.fonts?.ready.then(() => {
      if (cancelado) return
      ultimoAncho = -1
      ajustar()
    })
    return () => {
      cancelado = true
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [ref, texto, maxLineas])
}
