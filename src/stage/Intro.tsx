import { useEffect, useRef } from 'react'
import { siteConfig } from '@/config/site.config'
import { copy, paneles } from '@/content/copy.es'
import { gsap } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { getReducedMotionSnapshot } from '@/motion/useReducedMotion'
import { precargarImagen, videoInfo } from '@/stage/assets'
import type { FrameController } from '@/stage/frameController'
import { useStage } from '@/stage/StageProvider'

/**
 * Intro (§5, refs 12–14):
 * 1. Fondo negro y loader: monograma con anillo de progreso dorado. Espera el póster
 *    (o la foto del panel de entrada), las fuentes y el primer frame del video (tope 3,5 s).
 * 2. El marco aparece a escala 0.25 en el centro y crece hasta la forma cerrada
 *    (media con zoom 1.15 → 1).
 * 3. Entran título, etiquetas, wordmark y MENU (`onTextsIn`).
 * Con hash (`/#eventos`) la intro se corta: loader → modo abierto en ese panel.
 */

type Props = {
  frame: FrameController
  frameWrapRef: React.RefObject<HTMLDivElement | null>
  layerRefs: React.RefObject<(HTMLDivElement | null)[]>
  videoRef: React.RefObject<HTMLVideoElement | null>
  chromeRef: React.RefObject<HTMLDivElement | null>
  initialIndex: number
  /** Entrada directa en modo abierto (la URL trae hash). */
  openOnEnter: boolean
  onTextsIn: () => void
  /** Entrada directa en modo abierto: mostrar los textos del panel. */
  onEnterOpen: () => void
}

const RADIO = 30
const CIRC = 2 * Math.PI * RADIO

function esperarFuentes(): Promise<void> {
  if (!document.fonts) return Promise.resolve()
  return Promise.all([
    document.fonts.load('800 100px "Archivo Variable"'),
    document.fonts.load('500 16px "Archivo Variable"'),
    document.fonts.load('400 24px "Libre Caslon Text"'),
  ]).then(
    () => undefined,
    () => undefined,
  )
}

/** Primer frame del video disponible (con `preload="metadata"` alcanza `loadeddata`). */
function esperarVideo(video: HTMLVideoElement | null): Promise<void> {
  return new Promise((resolve) => {
    if (!video || video.readyState >= 2) return resolve()
    const done = () => resolve()
    video.addEventListener('loadeddata', done, { once: true })
    video.addEventListener('canplay', done, { once: true })
    video.addEventListener('error', done, { once: true })
  })
}

function esperarImagenDeCapa(layer: HTMLDivElement | null | undefined): Promise<void> {
  const img = layer?.querySelector('img')
  if (!img) return Promise.resolve()
  if (img.complete) return Promise.resolve()
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true })
    img.addEventListener('error', () => resolve(), { once: true })
  })
}

export function Intro({
  frame,
  frameWrapRef,
  layerRefs,
  videoRef,
  chromeRef,
  initialIndex,
  openOnEnter,
  onTextsIn,
  onEnterOpen,
}: Props) {
  const { dispatch } = useStage()
  const loaderRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<SVGCircleElement | null>(null)
  const onTextsInRef = useRef(onTextsIn)
  const onEnterOpenRef = useRef(onEnterOpen)
  useEffect(() => {
    onTextsInRef.current = onTextsIn
    onEnterOpenRef.current = onEnterOpen
  }, [onTextsIn, onEnterOpen])

  useEffect(() => {
    const loader = loaderRef.current
    const ring = ringRef.current
    const wrap = frameWrapRef.current
    const chrome = chromeRef.current
    const layer = layerRefs.current[initialIndex]
    if (!loader || !ring || !wrap || !chrome) return

    let cancelado = false
    const reduced = getReducedMotionSnapshot()
    const t = motionDuration.stage.intro
    const progreso = { v: 0 }
    const pintarAnillo = () => ring.setAttribute('stroke-dashoffset', String(CIRC * (1 - progreso.v)))

    gsap.set(wrap, { autoAlpha: 0 })
    gsap.set(chrome, { autoAlpha: 0 })
    gsap.set(loader, { autoAlpha: 1 })
    pintarAnillo()

    const esHome = paneles[initialIndex]?.key === 'home'
    const tareas: Promise<void>[] = [
      esperarFuentes(),
      esHome ? precargarImagen(videoInfo?.poster) : esperarImagenDeCapa(layer),
      esHome ? esperarVideo(videoRef.current) : Promise.resolve(),
    ]
    let hechas = 0
    for (const tarea of tareas) {
      void tarea.then(() => {
        if (cancelado) return
        hechas++
        gsap.to(progreso, {
          v: hechas / tareas.length,
          duration: 0.4,
          ease: motionEase.ui,
          onUpdate: pintarAnillo,
        })
      })
    }

    let tl: gsap.core.Timeline | null = null
    const tope = new Promise<void>((resolve) => setTimeout(resolve, t.loaderMax * 1000))

    void Promise.race([Promise.all(tareas), tope]).then(() => {
      if (cancelado) return
      gsap.killTweensOf(progreso)
      tl = gsap.timeline()
      tl.to(progreso, { v: 1, duration: t.ringFinish, ease: motionEase.ui, onUpdate: pintarAnillo })
      tl.to(loader, { autoAlpha: 0, duration: reduced ? motionDuration.reduced : t.loaderOut, ease: motionEase.ui })

      if (openOnEnter) {
        // Hash: directo al panel abierto.
        tl.call(() => {
          frame.set({ kind: 'open' })
          dispatch({ type: 'READY_OPEN', index: initialIndex })
          onTextsInRef.current()
          onEnterOpenRef.current()
        })
        tl.to([wrap, chrome], { autoAlpha: 1, duration: reduced ? motionDuration.reduced : t.chromeFade, ease: motionEase.ui })
        return
      }

      tl.call(() => dispatch({ type: 'READY' }))
      if (reduced) {
        tl.call(() => frame.set({ kind: 'closed', index: initialIndex }))
        tl.to(wrap, { autoAlpha: 1, duration: motionDuration.reduced, ease: motionEase.ui })
        tl.call(() => onTextsInRef.current())
        tl.to(chrome, { autoAlpha: 1, duration: motionDuration.reduced, ease: motionEase.ui }, '<')
        tl.call(() => dispatch({ type: 'INTRO_DONE' }), [], `+=${motionDuration.reduced}`)
        return
      }

      // El marco aparece chico en el centro y crece hasta la forma cerrada.
      tl.call(() => frame.set({ kind: 'intro', index: initialIndex }))
      tl.to(wrap, { autoAlpha: 1, duration: 0.35, ease: motionEase.ui }, '-=0.15')
      const crece = tl.duration()
      tl.add(
        frame.tweenTo({ kind: 'closed', index: initialIndex }, { duration: t.frameGrow, ease: motionEase.scene }),
        crece,
      )
      if (layer) {
        tl.fromTo(layer, { scale: t.mediaZoom }, { scale: 1, duration: t.frameGrow, ease: motionEase.scene }, crece)
      }
      const textos = crece + t.frameGrow * t.textsAt
      tl.call(() => onTextsInRef.current(), [], textos)
      tl.to(chrome, { autoAlpha: 1, duration: t.chromeFade, ease: motionEase.ui }, textos)
      tl.call(() => dispatch({ type: 'INTRO_DONE' }), [], crece + t.frameGrow)
    })

    return () => {
      cancelado = true
      tl?.kill()
      gsap.killTweensOf(progreso)
    }
    // Una sola vez por montaje: la intro no se repite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const monograma = siteConfig.marca.wordmark[0].charAt(0)

  return (
    <div
      ref={loaderRef}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-noche"
    >
      <div className="relative grid size-20 place-items-center">
        <svg viewBox="0 0 72 72" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle cx="36" cy="36" r={RADIO} fill="none" className="stroke-champan/10" strokeWidth="1.5" />
          <circle
            ref={ringRef}
            cx="36"
            cy="36"
            r={RADIO}
            fill="none"
            className="stroke-oro"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC}
          />
        </svg>
        <span className="font-serif text-subtitulo leading-none text-champan" aria-hidden="true">
          {monograma}
        </span>
      </div>
      <p className="font-ui text-etiqueta uppercase text-ceniza">{copy.intro.cargando}</p>
    </div>
  )
}
