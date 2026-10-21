import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import type { FrameController, Internals } from '@/stage/frameController'

type FrameProps = {
  controller: FrameController
  children: ReactNode
  /** Clic/tap o Enter sobre el marco (modo cerrado → abrir el panel). */
  onActivate?: () => void
  /** Texto accesible del marco cuando es activable. */
  label?: string
  interactive?: boolean
}

/**
 * Contenedor del media a pantalla completa, recortado con `clip-path: polygon()`.
 * El recorte también limita el área clickeable: fuera del polígono el clic no cuenta.
 */
export function Frame({ controller, children, onActivate, label, interactive = false }: FrameProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const ctrl = controller as Internals

  useLayoutEffect(() => {
    ctrl.attach(ref.current)
    return () => ctrl.attach(null)
  }, [ctrl])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => ctrl.relayout())
    ro.observe(el)
    return () => ro.disconnect()
  }, [ctrl])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onActivate) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate()
    }
  }

  return (
    <div
      ref={ref}
      data-frame=""
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? label : undefined}
      onClick={interactive ? onActivate : undefined}
      onKeyDown={onKeyDown}
      className={`absolute inset-0 overflow-hidden bg-tizon will-change-[clip-path] focus-visible:outline-none ${
        interactive ? 'cursor-pointer' : ''
      }`}
      style={{ clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' }}
    >
      {children}
    </div>
  )
}
