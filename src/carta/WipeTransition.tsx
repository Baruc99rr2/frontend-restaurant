import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react'
import { barridoActivo, marcarBarrido } from '@/carta/barrido'
import { gsap } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { getReducedMotionSnapshot } from '@/motion/useReducedMotion'

/**
 * Barrido negro entre páginas (§9): una lámina `noche` sube desde abajo y cubre la pantalla,
 * se cambia de ruta debajo y la lámina sigue subiendo hasta descubrir la página nueva.
 * Reutilizable: `transicion(cambiar)` recibe lo que hay que hacer con la pantalla tapada
 * (navegar, volver atrás, cerrar algo). F9 lo usa para entrar a una categoría; F10 para
 * entrar, salir y volver al inicio.
 *
 * Una sola transición a la vez: si ya hay una en curso, el pedido se ignora.
 * Con reduced motion: fundido de 200 ms a negro y de vuelta.
 * Estado en `data-barrido` (`quieto | cubriendo | cubierto | descubriendo`) para QA.
 */

type Cambio = () => void | Promise<void>

type WipeTransitionValue = {
  /** Cubre, ejecuta `cambiar` con la pantalla tapada y descubre. Devuelve cuando terminó todo. */
  transicion: (cambiar: Cambio) => Promise<void>
}

const WipeContext = createContext<WipeTransitionValue | null>(null)


const frames = (n: number) =>
  new Promise<void>((resolve) => {
    const paso = (k: number) => (k <= 0 ? resolve() : requestAnimationFrame(() => paso(k - 1)))
    paso(n)
  })

const tween = (vars: gsap.TweenVars, el: HTMLElement) =>
  new Promise<void>((resolve) => {
    gsap.to(el, { ...vars, overwrite: true, onComplete: () => resolve() })
  })

export function WipeTransitionProvider({ children }: { children: ReactNode }) {
  const laminaRef = useRef<HTMLDivElement | null>(null)

  const transicion = useCallback(async (cambiar: Cambio) => {
    const el = laminaRef.current
    if (!el || barridoActivo()) return
    marcarBarrido(true)
    const reduced = getReducedMotionSnapshot()
    const d = motionDuration.carta.barrido
    try {
      el.dataset.barrido = 'cubriendo'
      if (reduced) {
        gsap.set(el, { yPercent: 0, autoAlpha: 0 })
        await tween({ autoAlpha: 1, duration: motionDuration.reduced, ease: motionEase.ui }, el)
      } else {
        gsap.set(el, { yPercent: 100, autoAlpha: 1 })
        await tween({ yPercent: 0, duration: d, ease: motionEase.scene }, el)
      }
      el.dataset.barrido = 'cubierto'
      await cambiar()
      // La página nueva monta y pinta debajo de la lámina antes de descubrirla.
      await frames(2)
      el.dataset.barrido = 'descubriendo'
      if (reduced) {
        await tween({ autoAlpha: 0, duration: motionDuration.reduced, ease: motionEase.ui }, el)
      } else {
        await tween({ yPercent: -100, duration: d, ease: motionEase.scene }, el)
        gsap.set(el, { autoAlpha: 0, yPercent: 100 })
      }
    } finally {
      el.dataset.barrido = 'quieto'
      marcarBarrido(false)
    }
  }, [])

  const value = useMemo(() => ({ transicion }), [transicion])

  return (
    <WipeContext.Provider value={value}>
      {children}
      <div
        ref={laminaRef}
        data-barrido="quieto"
        aria-hidden="true"
        // Mientras cubre, toma los clics: nada de abajo responde a mitad de la transición.
        className="invisible fixed inset-0 z-[60] bg-noche opacity-0 will-change-transform"
      />
    </WipeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWipeTransition(): WipeTransitionValue {
  const ctx = useContext(WipeContext)
  if (!ctx) throw new Error('useWipeTransition() fuera de <WipeTransitionProvider>')
  return ctx
}
