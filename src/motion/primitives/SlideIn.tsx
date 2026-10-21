import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

export type SlideDirection = 'left' | 'right'

export type SlideInProps = {
  children: ReactNode
  from?: SlideDirection
  active?: boolean
  /** Cambiá esta clave para re-ejecutar o interrumpir a mitad la entrada. */
  triggerKey?: string | number
  delay?: number
  duration?: number
  as?: ElementType
  className?: string
}

/**
 * `<SlideIn from="left|right">`:
 * Bloques que entran desde fuera de pantalla y se acomodan (`expo.out`).
 * Soporta interrupción a mitad (mata el timeline y lo recrea) y degrada
 * a fade de 200 ms con `prefers-reduced-motion`.
 */
export function SlideIn({
  children,
  from = 'left',
  active = true,
  triggerKey,
  delay = 0,
  duration = motionDuration.slideIn,
  as: Tag = 'div',
  className = '',
}: SlideInProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const el = rootRef.current
      if (!el) return

      tlRef.current?.kill()
      tlRef.current = null

      if (!active) {
        const hiddenX = reduced ? 0 : from === 'left' ? -108 : 108
        gsap.set(el, { opacity: 0, xPercent: hiddenX })
        return
      }

      const tl = gsap.timeline()
      tlRef.current = tl

      if (reduced) {
        gsap.set(el, { xPercent: 0 })
        tl.fromTo(
          el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: motionDuration.reduced,
            delay,
            ease: motionEase.ui,
          },
        )
      } else {
        const startX = from === 'left' ? -108 : 108
        tl.fromTo(
          el,
          { xPercent: startX, opacity: 0 },
          {
            xPercent: 0,
            opacity: 1,
            duration,
            delay,
            ease: motionEase.enter,
          },
        )
      }

      return () => {
        tl.kill()
      }
    },
    {
      dependencies: [from, active, triggerKey, delay, duration, reduced],
      scope: rootRef,
    },
  )

  return (
    <Tag ref={rootRef} className={className}>
      {children}
    </Tag>
  )
}
