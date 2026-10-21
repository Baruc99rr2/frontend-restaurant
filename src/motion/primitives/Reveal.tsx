import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, SplitText, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

export type RevealMode = 'chars' | 'words' | 'lines'

export type RevealProps = {
  children: ReactNode
  mode?: RevealMode
  /**
   * `true` → entra (desde abajo, con máscara). Si pasa a `false` después de haberse
   * mostrado, sale hacia abajo con la misma máscara (nada desaparece de golpe).
   * Montado con `false`, queda oculto sin animar.
   */
  active?: boolean
  /** Cambiá esta clave para reiniciar la entrada (interrumpe el timeline activo y lo recrea). */
  triggerKey?: string | number
  /** Demora de la entrada (la salida arranca en el momento). */
  delay?: number
  duration?: number
  stagger?: number
  as?: ElementType
  className?: string
}

/**
 * `<Reveal mode="chars|words|lines">`:
 * SplitText con máscara; entrada desde abajo (`expo.out`) y salida hacia abajo.
 * Interrumpible en cualquier momento: si cambia `active` a mitad, las piezas siguen
 * desde donde están (no se re-parte el texto ni salta). Con `prefers-reduced-motion`
 * degrada a un fade de 200 ms.
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
  /** Si el texto está visible o entrando (para saber si `active=false` es una salida). */
  const shownRef = useRef(false)
  const reduced = useReducedMotion()
  const contentKey =
    typeof children === 'string' || typeof children === 'number' ? String(children) : undefined

  useGSAP(
    () => {
      const el = rootRef.current
      if (!el) return

      tlRef.current?.kill()
      tlRef.current = null

      const wasShown = shownRef.current
      shownRef.current = active

      const revertSplit = () => {
        splitRef.current?.revert()
        splitRef.current = null
      }
      const targetsOf = (split: SplitText) =>
        mode === 'chars' ? split.chars : mode === 'words' ? split.words : split.lines
      const ensureSplit = () => {
        if (splitRef.current) return splitRef.current
        const split = SplitText.create(el, {
          type: mode === 'chars' ? 'words,chars' : mode,
          mask: mode,
        })
        splitRef.current = split
        return split
      }
      // Al terminar se revierte el split: el texto vuelve a ser texto plano y re-fluye
      // si cambia el ancho (las líneas enmascaradas quedaban fijas y se recortaban).
      const finish = (split: SplitText, hide: boolean) => () => {
        if (hide) gsap.set(el, { opacity: 0 })
        if (splitRef.current === split) revertSplit()
      }

      const stag = stagger ?? motionDuration.reveal.stagger[mode]

      // ---- Salida u oculto ----------------------------------------------------
      if (!active) {
        if (!wasShown) {
          revertSplit()
          gsap.set(el, { opacity: 0 })
          return
        }
        if (reduced) {
          revertSplit()
          tlRef.current = gsap.timeline().to(el, {
            opacity: 0,
            duration: motionDuration.reduced,
            ease: motionEase.ui,
          })
          return
        }
        const split = ensureSplit()
        gsap.set(el, { opacity: 1 })
        const tl = gsap.timeline({ onComplete: finish(split, true) })
        tl.to(targetsOf(split), {
          yPercent: 115,
          duration: motionDuration.reveal.exit,
          stagger: stag,
          ease: motionEase.exit,
        })
        tlRef.current = tl
        return
      }

      // ---- Entrada ------------------------------------------------------------
      if (reduced) {
        revertSplit()
        gsap.set(el, { clearProps: 'transform' })
        tlRef.current = gsap.timeline().fromTo(
          el,
          { opacity: wasShown ? 0 : Number(gsap.getProperty(el, 'opacity')) || 0 },
          { opacity: 1, duration: motionDuration.reduced, delay, ease: motionEase.ui },
        )
        return
      }

      // Ya visible (replay por triggerKey/duración/modo) → se re-parte y arranca de cero.
      // Volviendo de una salida a mitad → las piezas suben desde donde quedaron.
      const resume = !wasShown && splitRef.current !== null
      if (!resume) revertSplit()
      const split = ensureSplit()
      gsap.set(el, { opacity: 1 })
      const targets = targetsOf(split)
      const dur = duration ?? motionDuration.reveal[mode]
      const tl = gsap.timeline({ onComplete: finish(split, false) })
      const to = { yPercent: 0, opacity: 1, duration: dur, stagger: stag, delay, ease: motionEase.enter }
      if (resume) tl.to(targets, to)
      else tl.fromTo(targets, { yPercent: 115, opacity: 0 }, to)
      tlRef.current = tl
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
