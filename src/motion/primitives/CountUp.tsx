import { useCallback, useRef, type ElementType } from 'react'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

export type CountUpProps = {
  value: number
  /** Formateador personalizado (ej.: `formatPrice` para centavos). */
  format?: (n: number) => string
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  as?: ElementType
  className?: string
}

/**
 * `<CountUp value>`:
 * Interpola números con tween (`expo.out`).
 * Si se interrumpe a mitad, mata el timeline activo y continúa desde el valor intermedio actual.
 * Con `prefers-reduced-motion` actualiza el valor de inmediato con un fade de 200 ms.
 */
export function CountUp({
  value,
  format,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = motionDuration.countUp,
  as: Tag = 'span',
  className = '',
}: CountUpProps) {
  const elRef = useRef<HTMLElement | null>(null)
  const stateRef = useRef<{ current: number; initialized: boolean }>({
    current: value,
    initialized: false,
  })
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const reduced = useReducedMotion()

  const formatNumber = useCallback(
    (n: number) => {
      if (format) {
        return `${prefix}${format(decimals === 0 ? Math.round(n) : Number(n.toFixed(decimals)))}${suffix}`
      }
      const rounded = decimals === 0 ? Math.round(n) : Number(n.toFixed(decimals))
      const formatted = rounded.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      return `${prefix}${formatted}${suffix}`
    },
    [format, decimals, prefix, suffix],
  )

  useGSAP(
    () => {
      const el = elRef.current
      if (!el) return

      tlRef.current?.kill()
      tlRef.current = null

      if (!stateRef.current.initialized) {
        stateRef.current.initialized = true
        stateRef.current.current = value
        el.textContent = formatNumber(value)
        return
      }

      if (stateRef.current.current === value) {
        el.textContent = formatNumber(value)
        return
      }

      const tl = gsap.timeline()
      tlRef.current = tl

      if (reduced) {
        stateRef.current.current = value
        el.textContent = formatNumber(value)
        tl.fromTo(
          el,
          { opacity: 0.3 },
          {
            opacity: 1,
            duration: motionDuration.reduced,
            ease: motionEase.ui,
          },
        )
      } else {
        // Mantener el valor intermedio antes del primer paint para evitar parpadeo.
        el.textContent = formatNumber(stateRef.current.current)
        gsap.set(el, { opacity: 1 })

        tl.to(stateRef.current, {
          current: value,
          duration,
          ease: motionEase.enter,
          onUpdate: () => {
            if (elRef.current) {
              elRef.current.textContent = formatNumber(stateRef.current.current)
            }
          },
          onComplete: () => {
            stateRef.current.current = value
            if (elRef.current) {
              elRef.current.textContent = formatNumber(value)
            }
          },
        })
      }

      return () => {
        tl.kill()
      }
    },
    {
      dependencies: [value, reduced, duration, formatNumber],
      scope: elRef,
    },
  )

  return (
    <Tag ref={elRef} className={`tabular-nums ${className}`}>
      {formatNumber(value)}
    </Tag>
  )
}
