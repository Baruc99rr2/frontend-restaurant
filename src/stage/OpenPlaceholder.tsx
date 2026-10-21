import { useRef } from 'react'
import { Frame as FrameIcon } from 'lucide-react'
import { siteConfig } from '@/config/site.config'
import { copy, paneles } from '@/content/copy.es'
import { gsap, useGSAP } from '@/motion/gsap'
import { Reveal } from '@/motion/primitives'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

/**
 * Modo abierto provisorio (F3): el marco ya se expandió; muestra el panel y la salida
 * ("Vista general" / Esc). En F4 se reemplaza por `OpenView` con los paneles reales.
 */
export function OpenPlaceholder({
  panelIndex,
  visible,
  onClose,
}: {
  panelIndex: number
  visible: boolean
  onClose: () => void
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotion()
  const panel = paneles[panelIndex] ?? paneles[0]!

  useGSAP(
    () => {
      const el = rootRef.current
      if (!el) return
      gsap.to(el, {
        autoAlpha: visible ? 1 : 0,
        duration: reduced ? motionDuration.reduced : motionDuration.stage.openCloseTexts,
        ease: motionEase.ui,
      })
    },
    { dependencies: [visible, reduced] },
  )

  return (
    <div
      ref={rootRef}
      className="velo invisible absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-6 text-center opacity-0"
    >
      <Reveal
        as="h1"
        mode="chars"
        active={visible}
        delay={0.1}
        className="font-gigante text-display uppercase text-champan"
      >
        {panel.titulo}
      </Reveal>
      <Reveal as="p" mode="words" active={visible} delay={0.3} className="max-w-md font-serif text-subtitulo text-champan/85">
        {`${panel.izquierda.join(' ')} ${panel.derecha.join(' ')}`}
      </Reveal>
      <p className="font-ui text-etiqueta uppercase text-ceniza">
        {copy.escenario.enPreparacion} · {copy.escenario.salir}
      </p>

      <button
        type="button"
        onClick={onClose}
        tabIndex={visible ? 0 : -1}
        className="absolute right-[max(1.5rem,env(safe-area-inset-right))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-champan/25 bg-noche/60 px-5 py-3 font-ui text-etiqueta font-semibold uppercase text-champan backdrop-blur-md transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
      >
        <FrameIcon className="size-4" aria-hidden="true" />
        {siteConfig.botones.vistaGeneral}
      </button>
    </div>
  )
}
