import { useCallback, useEffect, useRef, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { copy, paneles } from '@/content/copy.es'
import type { PanelKey } from '@/content/editorial'
import { gsap } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'
import { ClosedView } from '@/stage/ClosedView'
import { Frame } from '@/stage/Frame'
import { createFrameController } from '@/stage/frameController'
import { Intro } from '@/stage/Intro'
import { OpenPlaceholder } from '@/stage/OpenPlaceholder'
import { StageMedia } from '@/stage/StageMedia'
import { StageProvider, useStage } from '@/stage/StageProvider'
import { panelIndexFromHash } from '@/stage/stageMachine'
import { useStepInput } from '@/stage/useStepInput'

/**
 * Escenario a pantalla completa (§5): 100svh, sin scroll nativo, 6 paneles y dos modos.
 * Este componente orquesta: lee la máquina de estados y dispara los timelines
 * (paso cerrado, abrir, cerrar), que al terminar despachan el evento siguiente.
 */

const entrada = (() => {
  const index = typeof window === 'undefined' ? null : panelIndexFromHash(window.location.hash)
  return { index: index ?? 0, abierto: index !== null }
})()

export default function Stage() {
  return (
    <StageProvider initialIndex={entrada.index}>
      <StageInner />
    </StageProvider>
  )
}

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')

function StageInner() {
  const { state, dispatch, displayIndex } = useStage()
  const reduced = useReducedMotion()
  const [frame] = useState(() =>
    createFrameController(entrada.abierto ? { kind: 'open' } : { kind: 'intro', index: entrada.index }),
  )
  const frameWrapRef = useRef<HTMLDivElement | null>(null)
  const chromeRef = useRef<HTMLDivElement | null>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [textsIn, setTextsIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const { mode, transition, activeIndex } = state
  const panel = paneles[displayIndex] ?? paneles[0]!

  // Sin scroll nativo mientras el escenario está montado.
  useEffect(() => {
    const html = document.documentElement
    const prev = { overflow: html.style.overflow, overscroll: html.style.overscrollBehavior }
    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    return () => {
      html.style.overflow = prev.overflow
      html.style.overscrollBehavior = prev.overscroll
    }
  }, [])

  // Input: un paso por gesto; la máquina decide si avanza o lo encola.
  const onStep = useCallback((dir: 1 | -1) => dispatch({ type: 'STEP', dir }), [dispatch])
  useStepInput({ enabled: mode === 'closed', onStep })

  // Enter abre el panel; Esc cierra lo último abierto (carta → panel abierto).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false)
        else if (mode === 'open') dispatch({ type: 'CLOSE' })
        return
      }
      if (e.key === 'Enter' && mode === 'closed') {
        const t = e.target
        if (t instanceof HTMLElement && t.closest('button, a, input, textarea, select')) return
        e.preventDefault()
        dispatch({ type: 'OPEN' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, menuOpen, dispatch])

  // Paso entre paneles en modo cerrado (ref. 07): corte horizontal dentro del mismo marco.
  useEffect(() => {
    if (!transition) return
    const { from, to, dir } = transition
    const a = layerRefs.current[from]
    const b = layerRefs.current[to]
    if (!a || !b) {
      dispatch({ type: 'TRANSITION_DONE' })
      return
    }
    const dur = reduced ? motionDuration.reduced : motionDuration.stage.closedStep
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(a, { visibility: 'hidden', yPercent: 0, opacity: 1, zIndex: 0 })
        gsap.set(b, { zIndex: 0 })
        dispatch({ type: 'TRANSITION_DONE' })
      },
    })
    if (reduced) {
      gsap.set(b, { visibility: 'visible', yPercent: 0, scale: 1, opacity: 0, zIndex: 1 })
      tl.to(b, { opacity: 1, duration: dur, ease: motionEase.ui }, 0)
    } else {
      gsap.set(b, { visibility: 'visible', yPercent: 100 * dir, scale: 1, opacity: 1, zIndex: 1 })
      tl.to(a, { yPercent: -100 * dir, duration: dur, ease: motionEase.slide }, 0)
      tl.to(b, { yPercent: 0, duration: dur, ease: motionEase.slide }, 0)
    }
    tl.add(frame.tweenTo({ kind: 'closed', index: to }, { duration: dur, ease: motionEase.scene }), 0)
    return () => {
      tl.kill()
    }
  }, [transition, reduced, frame, dispatch])

  // Abrir / cerrar (provisorio en F3: el marco se expande al rectángulo y vuelve).
  useEffect(() => {
    if (mode !== 'opening' && mode !== 'closing') return
    const dur = reduced ? motionDuration.reduced : motionDuration.stage.openClose
    const abriendo = mode === 'opening'
    const tween = frame.tweenTo(abriendo ? { kind: 'open' } : { kind: 'closed', index: activeIndex }, {
      duration: dur,
      ease: motionEase.scene,
      onComplete: () => dispatch({ type: abriendo ? 'OPENED' : 'CLOSED' }),
    })
    // El hash refleja el panel abierto; en modo cerrado la URL queda limpia.
    const key = paneles[activeIndex]?.key
    const url = abriendo && key ? `#${key}` : window.location.pathname + window.location.search
    history.replaceState(null, '', url)
    return () => {
      tween.kill()
    }
  }, [mode, activeIndex, reduced, frame, dispatch])

  const goTo = useCallback((index: number) => dispatch({ type: 'GOTO', index }), [dispatch])
  const onNavSelect = useCallback(
    (key: PanelKey) => {
      const index = paneles.findIndex((p) => p.key === key)
      if (index >= 0 && mode === 'closed') goTo(index)
    },
    [goTo, mode],
  )

  const abierto = mode === 'opening' || mode === 'open'
  const videoPlaying = abierto && paneles[activeIndex]?.key === 'home'

  return (
    <div
      className="group/stage fixed inset-0 h-svh w-full touch-pinch-zoom overflow-hidden bg-noche text-champan select-none"
      data-mode={mode}
      data-active={activeIndex}
      data-lock={state.lock ? '' : undefined}
    >
      <div ref={frameWrapRef} className="invisible absolute inset-0 opacity-0">
        <Frame
          controller={frame}
          interactive={mode === 'closed'}
          onActivate={() => dispatch({ type: 'OPEN' })}
          label={fill(copy.escenario.abrir, { panel: panel.titulo })}
        >
          <StageMedia
            layerRefs={layerRefs}
            videoRef={videoRef}
            videoPlaying={videoPlaying}
            initialIndex={entrada.index}
          />
        </Frame>
      </div>

      <ClosedView displayIndex={displayIndex} textsIn={textsIn} faded={abierto || mode === 'loading'} onGoTo={goTo} />

      <OpenPlaceholder panelIndex={activeIndex} visible={mode === 'open'} onClose={() => dispatch({ type: 'CLOSE' })} />

      <div
        ref={chromeRef}
        // El header es transparente: solo sus botones capturan clics (el resto llega al marco).
        className="pointer-events-none invisible absolute inset-x-0 top-0 z-30 pt-[env(safe-area-inset-top)] opacity-0 [&_button]:pointer-events-auto"
      >
        <Navbar
          activeKey={panel.key}
          onSelect={onNavSelect}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((v) => !v)}
          showLinks={false}
        />
      </div>

      <Intro
        frame={frame}
        frameWrapRef={frameWrapRef}
        layerRefs={layerRefs}
        videoRef={videoRef}
        chromeRef={chromeRef}
        initialIndex={entrada.index}
        openOnEnter={entrada.abierto}
        onTextsIn={() => setTextsIn(true)}
      />
    </div>
  )
}
