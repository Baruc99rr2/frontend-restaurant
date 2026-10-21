import { useRef, useState } from 'react'
import { siteConfig } from '@/config/site.config'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { WipeSwap } from '@/motion/primitives/WipeSwap'
import { useReducedMotion } from '@/motion/useReducedMotion'

export type MenuButtonProps = {
  /** Si el overlay de la carta está abierto (`true` = muestra CERRAR y líquido lleno). */
  open: boolean
  onToggle: () => void
  className?: string
}

// Período exacto = 100 unidades en un viewBox de 200x24 → xPercent -50 cicla sin costura.
const WAVE_PATH_FRONT =
  'M 0 12 Q 25 2, 50 12 T 100 12 T 150 12 T 200 12 L 200 26 L 0 26 Z'
const WAVE_PATH_BACK =
  'M 0 12 Q 25 22, 50 12 T 100 12 T 150 12 T 200 12 L 200 26 L 0 26 Z'

const LEVEL_EMPTY = 106
const LEVEL_HOVER = 82
const LEVEL_FULL = 0

/**
 * Botón MENU / CERRAR (§7):
 * - Píldora `bg-oro`, bordes redondeados (`rounded-full`), texto `text-noche`.
 * - Hover: el vino asoma ~15% con ola.
 * - Clic: el líquido sube hasta llenar (~0,9 s) con dos ondas SVG desfasadas en
 *   `vino` y `vino-luz` que se desplazan horizontalmente; el texto pasa a `champan`
 *   y cambia a "CERRAR" con `WipeSwap`.
 * - Al cerrar, el líquido baja sin saltos (soporta interrupción a mitad).
 */
export function MenuButton({ open, onToggle, className = '' }: MenuButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const liquidRef = useRef<HTMLDivElement | null>(null)
  const frontWaveRef = useRef<SVGSVGElement | null>(null)
  const backWaveRef = useRef<SVGSVGElement | null>(null)

  const levelTlRef = useRef<gsap.core.Timeline | null>(null)
  const waveTlRef = useRef<gsap.core.Timeline | null>(null)
  const initializedRef = useRef(false)
  const prevTargetRef = useRef(LEVEL_EMPTY)

  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()

  // Loop continuo de las dos ondas horizontales desfasadas.
  useGSAP(
    () => {
      const front = frontWaveRef.current
      const back = backWaveRef.current
      if (!front || !back) return

      waveTlRef.current?.kill()
      waveTlRef.current = null

      if (reduced) {
        gsap.set([front, back], { xPercent: 0 })
        return
      }

      const tl = gsap.timeline({ repeat: -1 })
      tl.fromTo(
        front,
        { xPercent: 0 },
        {
          xPercent: -50,
          duration: motionDuration.menuWaveLoop,
          ease: motionEase.linear,
          repeat: -1,
        },
        0,
      )
      tl.fromTo(
        back,
        { xPercent: -50 },
        {
          xPercent: 0,
          duration: motionDuration.menuWaveLoop * 1.35,
          ease: motionEase.linear,
          repeat: -1,
        },
        0,
      )
      waveTlRef.current = tl

      return () => {
        tl.kill()
      }
    },
    { dependencies: [reduced], scope: buttonRef },
  )

  // Nivel vertical del líquido (vacío ↔ hover ~15% ↔ lleno).
  useGSAP(
    () => {
      const liquid = liquidRef.current
      if (!liquid) return

      levelTlRef.current?.kill()
      levelTlRef.current = null

      const targetY = open ? LEVEL_FULL : hovered ? LEVEL_HOVER : LEVEL_EMPTY

      if (!initializedRef.current) {
        initializedRef.current = true
        prevTargetRef.current = targetY
        gsap.set(liquid, { yPercent: targetY })
        return
      }

      // Asomar/retirar el hover es corto; llenar o vaciar el botón dura ~0,9 s con una
      // curva pareja (con `expo.out` el líquido llegaba arriba en ~0,25 s y se sentía un salto).
      const isHoverMove = !open && prevTargetRef.current !== LEVEL_FULL
      prevTargetRef.current = targetY

      const dur = reduced
        ? motionDuration.reduced
        : isHoverMove
          ? motionDuration.menuHover
          : motionDuration.menuFill

      const ease = reduced ? motionEase.ui : isHoverMove ? motionEase.ui : motionEase.scene

      const tl = gsap.timeline()
      tl.to(liquid, {
        yPercent: targetY,
        duration: dur,
        ease,
      })
      levelTlRef.current = tl

      return () => {
        tl.kill()
      }
    },
    { dependencies: [open, hovered, reduced], scope: buttonRef },
  )

  const label = open ? siteConfig.botones.cerrar : siteConfig.botones.menu

  return (
    <button
      ref={buttonRef}
      type="button"
      // El overlay de la carta lo busca para dejarlo dentro del foco atrapado.
      data-menu-button
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={label}
      onClick={onToggle}
      // Hover solo con mouse: en táctil el tap dispara `mouseenter` sin `mouseleave`
      // y el vino quedaba asomado después de cerrar. Con teclado cuenta el foco visible.
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHovered(true)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHovered(false)
      }}
      onFocus={(e) => {
        if (e.currentTarget.matches(':focus-visible')) setHovered(true)
      }}
      onBlur={() => setHovered(false)}
      className={`relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center overflow-hidden rounded-full bg-oro px-5 py-3 font-ui text-ui font-bold uppercase tracking-[0.16em] sm:px-7 sm:tracking-[0.2em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champan ${
        open ? 'text-champan' : 'text-noche'
      } ${className}`}
    >
      {/* Contenedor del líquido con las dos ondas SVG desfasadas arriba */}
      <div
        ref={liquidRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-4 bottom-0 will-change-transform"
      >
        {/* Cielo de ondas en el borde superior del líquido */}
        <div className="relative h-5 w-full overflow-hidden">
          <svg
            ref={backWaveRef}
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
            className="absolute inset-y-0 left-0 h-full w-[200%] fill-vino-luz"
          >
            <path d={WAVE_PATH_BACK} />
          </svg>
          <svg
            ref={frontWaveRef}
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
            className="absolute inset-y-0 left-0 h-full w-[200%] fill-vino"
          >
            <path d={WAVE_PATH_FRONT} />
          </svg>
        </div>
        {/* Cuerpo sólido del líquido debajo de la cresta */}
        <div className="-mt-px h-full w-full bg-vino" />
      </div>

      {/* Texto con barrido WipeSwap */}
      <WipeSwap value={label} className="relative z-10 min-w-[4.75rem] text-center" />
    </button>
  )
}
