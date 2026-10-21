import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, SplitText, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

export type RevealMode = 'chars' | 'words' | 'lines'

export type RevealProps = {
  children: ReactNode
  mode?: RevealMode
  /** Cuando es `false`, el texto permanece oculto; al pasar a `true` ejecuta el reveal. */
  active?: boolean
  /** Cambiá esta clave para reiniciar la animación (interrumpe el timeline activo y lo recrea). */
  triggerKey?: string | number
  delay?: number
  duration?: number
  stagger?: number
  as?: ElementType
  className?: string
}

/**
 * `<Reveal mode="chars|words|lines">`:
 * SplitText con máscara y entrada desde abajo (`expo.out`).
 * Soporta interrupción a mitad (mata el timeline y revierte el split antes de recrearlo)
 * y degrada a un fade de 200 ms con `prefers-reduced-motion`.
 */
export function Reveal({
  children,
  mode = 'words',
  active = true,
  triggerKey,
  delay = 0,
  duration,
  stagger,
  as: Tag = 'div',
  className = '',
}: RevealProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const splitRef = useRef<SplitText | null>(null)
  const reduced = useReducedMotion()
  const contentKey =
    typeof children === 'string' || typeof children === 'number' ? String(children) : undefined

  useGSAP(
    () => {
      const el = rootRef.current
      if (!el) return

      tlRef.current?.kill()
      tlRef.current = null
      splitRef.current?.revert()
      splitRef.current = null

      if (!active) {
        gsap.set(el, { opacity: 0 })
        return
      }

      if (reduced) {
        gsap.set(el, { clearProps: 'transform' })
        const tl = gsap.timeline()
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
        tlRef.current = tl
        return () => {
          tl.kill()
        }
      }

      gsap.set(el, { opacity: 1 })
      const splitType = mode === 'chars' ? 'words,chars' : mode
      const split = SplitText.create(el, {
        type: splitType,
        mask: mode,
      })
      splitRef.current = split

      const targets =
        mode === 'chars' ? split.chars : mode === 'words' ? split.words : split.lines

      const dur = duration ?? motionDuration.reveal[mode]
      const stag = stagger ?? motionDuration.reveal.stagger[mode]

      // Al terminar se revierte el split: el texto vuelve a ser texto plano y,
      // si la ventana cambia de ancho, re-fluye normal (las líneas enmascaradas
      // quedaban fijas y se recortaban).
      const tl = gsap.timeline({
        onComplete: () => {
          if (splitRef.current === split) {
            split.revert()
            splitRef.current = null
          }
        },
      })
      tl.fromTo(
        targets,
        { yPercent: 115, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: dur,
          stagger: stag,
          delay,
          ease: motionEase.enter,
        },
      )
      tlRef.current = tl

      return () => {
        tl.kill()
        split.revert()
      }
    },
    {
      // `children` no va como dependencia: un JSX nuevo en cada render del padre
      // re-disparaba el reveal. Solo cuenta el texto (`contentKey`) o `triggerKey`.
      dependencies: [mode, active, triggerKey, delay, duration, stagger, reduced, contentKey],
      scope: rootRef,
    },
  )

  // Si cambia el texto, se remonta el elemento: SplitText.revert() restaura el
  // HTML que guardó al partir, así que sobre el mismo nodo volvía el texto viejo.
  return (
    <Tag key={contentKey} ref={rootRef} className={className}>
      {children}
    </Tag>
  )
}
