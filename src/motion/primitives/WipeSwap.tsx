import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

export type WipeSwapProps = {
  /** Valor actual (o clave de versión si se pasa `children`). */
  value: string | number
  /** Contenido opcional; si no se pasa, se renderiza `value`. */
  children?: ReactNode
  as?: ElementType
  className?: string
  outDuration?: number
  inDuration?: number
}

/**
 * `<WipeSwap value>`:
 * Cuando cambia `value`, el texto actual sale con barrido (`clip-path: inset` de izq. a der.)
 * y el nuevo entra con barrido de izq. a der.
 * Si se interrumpe a mitad, mata el timeline activo y continúa desde el estado actual sin apilar.
 * Con `prefers-reduced-motion` degrada a un fade corto de 200 ms.
 */
export function WipeSwap({
  value,
  children,
  as: Tag = 'span',
  className = '',
  outDuration = motionDuration.wipeSwap.out,
  inDuration = motionDuration.wipeSwap.in,
}: WipeSwapProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const outgoingRef = useRef<HTMLSpanElement | null>(null)
  const incomingRef = useRef<HTMLSpanElement | null>(null)

  const prevValueRef = useRef<string | number>(value)
  const prevHtmlRef = useRef<string>('')
  const phaseRef = useRef<'idle' | 'out' | 'in'>('idle')
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const outgoing = outgoingRef.current
      const incoming = incomingRef.current
      if (!outgoing || !incoming) return

      // Primer montaje: registrar snapshot inicial sin animar reemplazo.
      if (prevValueRef.current === value) {
        prevHtmlRef.current = incoming.innerHTML
        return
      }

      prevValueRef.current = value
      tlRef.current?.kill()
      tlRef.current = null

      const interruptedDuringOut = phaseRef.current === 'out'
      if (!interruptedDuringOut) {
        outgoing.innerHTML = prevHtmlRef.current
        gsap.set(outgoing, {
          display: 'block',
          opacity: 1,
          clipPath: 'inset(0 0% 0 0%)',
        })
      }

      prevHtmlRef.current = incoming.innerHTML

      const tl = gsap.timeline()
      tlRef.current = tl

      if (reduced) {
        phaseRef.current = 'out'
        gsap.set(outgoing, { clipPath: 'none', display: 'block' })
        gsap.set(incoming, { clipPath: 'none', opacity: 0 })

        tl.to(outgoing, {
          opacity: 0,
          duration: motionDuration.reduced * 0.5,
          ease: motionEase.ui,
        })
        tl.set(outgoing, { display: 'none' })
        tl.call(() => {
          phaseRef.current = 'in'
        })
        tl.to(
          incoming,
          {
            opacity: 1,
            duration: motionDuration.reduced,
            ease: motionEase.ui,
          },
          '<0.04',
        )
        tl.call(() => {
          phaseRef.current = 'idle'
        })
      } else {
        phaseRef.current = 'out'
        gsap.set(incoming, {
          opacity: 1,
          clipPath: 'inset(0 100% 0 0%)',
        })

        // 1. Sale el contenido anterior con barrido de izquierda a derecha.
        tl.to(outgoing, {
          clipPath: 'inset(0 0% 0 100%)',
          duration: outDuration,
          ease: motionEase.exit,
        })

        tl.set(outgoing, {
          display: 'none',
          clipPath: 'inset(0 0% 0 0%)',
        })

        tl.call(() => {
          phaseRef.current = 'in'
        })

        // 2. Entra el contenido nuevo con barrido de izquierda a derecha.
        tl.fromTo(
          incoming,
          { clipPath: 'inset(0 100% 0 0%)' },
          {
            clipPath: 'inset(0 0% 0 0%)',
            duration: inDuration,
            ease: motionEase.enter,
          },
        )

        tl.set(incoming, { clearProps: 'clipPath' })
        tl.call(() => {
          phaseRef.current = 'idle'
        })
      }

      return () => {
        tl.kill()
      }
    },
    {
      dependencies: [value, reduced, outDuration, inDuration],
      scope: rootRef,
    },
  )

  return (
    <Tag ref={rootRef} className={`relative inline-grid ${className}`}>
      <span
        ref={outgoingRef}
        aria-hidden="true"
        className="pointer-events-none col-start-1 row-start-1 select-none"
        style={{ display: 'none' }}
      />
      <span ref={incomingRef} className="col-start-1 row-start-1">
        {children ?? value}
      </span>
    </Tag>
  )
}
