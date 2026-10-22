import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { cuandoEsteLibre } from '@/app/libre'
import { rutaActual } from '@/app/router'
import { cargarCartaOverlay } from '@/carta/cargas'
import { abrirCarta, cerrarCarta, escenarioDebajoDeLaCarta } from '@/carta/navegacion'
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
import { OpenView } from '@/stage/OpenView'
import { StageMedia } from '@/stage/StageMedia'
import { StageProvider, useStage } from '@/stage/StageProvider'
import { panelIndexFromHash, TOTAL_PANELES } from '@/stage/stageMachine'
import { useStepInput } from '@/stage/useStepInput'

// La carta viaja en su propio chunk: se monta apenas llega (está cerrada hasta que la ruta es `/carta`).
const CartaOverlay = lazy(() => cargarCartaOverlay().then((m) => ({ default: m.CartaOverlay })))

/**
 * Escenario a pantalla completa (§5): 100svh, sin scroll nativo, 6 paneles y dos modos.
 * Este componente orquesta: lee la máquina de estados y dispara los timelines
 * (paso cerrado, paso abierto, abrir, cerrar), que al terminar despachan el evento siguiente.
 *
 * Con `carta` (ruta `/carta`) muestra el overlay de la carta encima: el escenario sigue
 * montado y quieto (input suspendido, video en pausa, el resto `inert`) y al cerrar queda
 * exactamente donde estaba.
 */

type Entrada = {
  index: number
  abierto: boolean
  /** Montado debajo de la carta: entra directo a su modo, sin la intro larga (no se vería). */
  directa: boolean
}

/**
 * Panel y modo de entrada al montar. En `/` sale del hash (`/#eventos` → abierto en EVENTOS).
 * En `/carta` (recarga o vuelta desde una categoría) es el escenario que había debajo al abrir
 * la carta (guardado en el historial); sin dato, HOME abierto.
 */
function calcularEntrada(): Entrada {
  if (rutaActual().nombre === 'carta') return { ...escenarioDebajoDeLaCarta(), directa: true }
  const index = panelIndexFromHash(window.location.hash)
  // Hash que no es un panel: se ignora y se limpia (en modo cerrado la URL queda limpia).
  if (index === null && window.location.hash) {
    history.replaceState(history.state, '', window.location.pathname + window.location.search)
  }
  return { index: index ?? 0, abierto: index !== null, directa: false }
}

export default function Stage({ carta = false }: { carta?: boolean }) {
  // Se calcula al montar (no al cargar el módulo): el escenario se vuelve a montar al volver
  // de una categoría.
  const [entrada] = useState(calcularEntrada)
  return (
    <StageProvider initialIndex={entrada.index}>
      <StageInner entrada={entrada} carta={carta} />
    </StageProvider>
  )
}

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')

/**
 * El hash refleja el panel abierto; en modo cerrado la URL queda limpia.
 * Con la carta abierta la URL es `/carta` y no se toca: al cerrarla se re-sincroniza.
 * Conserva `history.state` (ahí la carta guarda de dónde vino).
 */
function escribirHash(index: number | null) {
  if (rutaActual().nombre === 'carta') return
  const key = index === null ? null : paneles[index]?.key
  history.replaceState(history.state, '', key ? `#${key}` : window.location.pathname + window.location.search)
}

function StageInner({ entrada, carta }: { entrada: Entrada; carta: boolean }) {
  const { state, dispatch, displayIndex } = useStage()
  const reduced = useReducedMotion()
  const [frame] = useState(() =>
    createFrameController(entrada.abierto ? { kind: 'open' } : { kind: 'intro', index: entrada.index }),
  )
  const frameWrapRef = useRef<HTMLDivElement | null>(null)
  const chromeRef = useRef<HTMLDivElement | null>(null)
  const openRef = useRef<HTMLDivElement | null>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  /** Textos del modo cerrado (título, etiquetas) adentro. */
  const [textsIn, setTextsIn] = useState(false)
  /** Panel del modo abierto cuyos textos se muestran (lo deciden los timelines). */
  const [textsPanel, setTextsPanel] = useState<number | null>(null)

  const { mode, transition, activeIndex } = state
  const panel = paneles[displayIndex] ?? paneles[0]!

  /** Bloques de texto de un panel abierto (los que se desvanecen al salir). */
  const textosDe = useCallback((index: number) => {
    const key = paneles[index]?.key
    return Array.from(openRef.current?.querySelectorAll(`[data-open-panel="${key}"] [data-open-text]`) ?? [])
  }, [])

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
  // Con la carta abierta el escenario no recibe input.
  useStepInput({ enabled: (mode === 'closed' || mode === 'open') && !carta, onStep })

  // Enter abre el panel; Esc cierra lo último abierto (carta → panel abierto).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.key === 'Escape') {
        if (carta) cerrarCarta()
        else if (mode === 'open') dispatch({ type: 'CLOSE' })
        return
      }
      if (carta) return
      if (e.key === 'Enter' && mode === 'closed') {
        const t = e.target
        if (t instanceof HTMLElement && t.closest('button, a, input, textarea, select')) return
        e.preventDefault()
        dispatch({ type: 'OPEN' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, carta, dispatch])

  // Al cerrar la carta la URL vuelve a `/`: el hash se re-sincroniza con el escenario
  // (si se cerró con atrás ya está bien; si la carta se abrió por URL directa, no).
  const cartaPrevRef = useRef(carta)
  useEffect(() => {
    if (cartaPrevRef.current && !carta) {
      escribirHash(mode === 'open' || mode === 'opening' ? activeIndex : null)
    }
    cartaPrevRef.current = carta
  }, [carta, mode, activeIndex])

  // Paso entre paneles. Cerrado (ref. 07): corte horizontal dentro del mismo marco.
  // Abierto (§5): textos fuera → marco a inset 0 → panel nuevo desde abajo mientras el
  // actual sube un 30% oscureciéndose → marco vuelve al inset → textos nuevos.
  useEffect(() => {
    if (!transition) return
    const { from, to, dir } = transition
    const a = layerRefs.current[from]
    const b = layerRefs.current[to]
    if (!a || !b) {
      dispatch({ type: 'TRANSITION_DONE' })
      return
    }
    const limpiar = () => {
      gsap.set(a, { visibility: 'hidden', yPercent: 0, opacity: 1, filter: 'none', zIndex: 0 })
      gsap.set(b, { zIndex: 0 })
    }

    if (mode === 'open') {
      escribirHash(to)
      const T = motionDuration.stage.openStep
      const O = motionDuration.stage.open
      const tl = gsap.timeline()
      const textos = textosDe(from)
      if (reduced) {
        const d = motionDuration.reduced
        if (textos.length) tl.to(textos, { opacity: 0, duration: d, ease: motionEase.ui }, 0)
        gsap.set(b, { visibility: 'visible', yPercent: 0, scale: 1, opacity: 0, filter: 'none', zIndex: 1 })
        tl.to(b, { opacity: 1, duration: d, ease: motionEase.ui }, 0)
        tl.call(() => setTextsPanel(to), [], d)
        tl.call(() => {
          limpiar()
          dispatch({ type: 'TRANSITION_DONE' })
        }, [], d + 0.05)
      } else {
        if (textos.length) {
          tl.to(
            textos,
            { opacity: 0, y: O.textOutY, duration: T.textOut, stagger: O.textOutStagger, ease: motionEase.exit },
            0,
          )
        }
        tl.add(frame.tweenTo({ kind: 'full' }, { duration: T.frameExpand, ease: motionEase.scene }), T.frameExpandDelay)
        gsap.set(b, { visibility: 'visible', yPercent: 100 * dir, scale: 1, opacity: 1, filter: 'none', zIndex: 1 })
        tl.to(b, { yPercent: 0, duration: T.panelSwap, ease: motionEase.scene }, T.panelSwapDelay)
        tl.to(
          a,
          {
            yPercent: -O.outgoingYPercent * dir,
            filter: `brightness(${O.outgoingBrightness})`,
            duration: T.panelSwap,
            ease: motionEase.scene,
          },
          T.panelSwapDelay,
        )
        tl.add(frame.tweenTo({ kind: 'open' }, { duration: T.frameInset, ease: motionEase.scene }), T.frameInsetDelay)
        tl.call(() => setTextsPanel(to), [], T.textInDelay)
        // El input se libera a ~2 s; los reveals del panel nuevo siguen hasta ~2,6 s.
        tl.call(() => {
          limpiar()
          dispatch({ type: 'TRANSITION_DONE' })
        }, [], motionDuration.stage.openStepLock)
      }
      return () => {
        tl.kill()
      }
    }

    const dur = reduced ? motionDuration.reduced : motionDuration.stage.closedStep
    const tl = gsap.timeline({
      onComplete: () => {
        limpiar()
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
    // `mode` no cambia durante una transición (abrir/cerrar exigen lock libre).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition, reduced, frame, dispatch, textosDe])

  // Abrir: el polígono se expande al rectángulo con inset; título y etiquetas del modo
  // cerrado salen con fade (ClosedView); entran navbar y textos del panel.
  // Cerrar: textos del panel fuera → el marco vuelve a la forma cerrada.
  useEffect(() => {
    if (mode !== 'opening' && mode !== 'closing') return
    const dur = reduced ? motionDuration.reduced : motionDuration.stage.openClose
    const O = motionDuration.stage.open
    const tl = gsap.timeline({ onComplete: () => dispatch({ type: mode === 'opening' ? 'OPENED' : 'CLOSED' }) })

    if (mode === 'opening') {
      escribirHash(activeIndex)
      tl.add(frame.tweenTo({ kind: 'open' }, { duration: dur, ease: motionEase.scene }), 0)
      tl.call(() => setTextsPanel(activeIndex), [], reduced ? 0 : O.textsAt)
    } else {
      escribirHash(null)
      const textos = textosDe(activeIndex)
      const salida = reduced ? motionDuration.reduced : motionDuration.stage.openStep.textOut
      if (textos.length) {
        tl.to(
          textos,
          { opacity: 0, y: reduced ? 0 : O.textOutY, duration: salida, stagger: reduced ? 0 : O.textOutStagger, ease: motionEase.exit },
          0,
        )
      }
      tl.call(() => setTextsPanel(null), [], salida)
      tl.add(
        frame.tweenTo({ kind: 'closed', index: activeIndex }, { duration: dur, ease: motionEase.scene }),
        reduced ? 0 : O.frameCloseDelay,
      )
    }
    return () => {
      tl.kill()
    }
  }, [mode, activeIndex, reduced, frame, dispatch, textosDe])

  const goTo = useCallback((index: number) => dispatch({ type: 'GOTO', index }), [dispatch])
  // La carta guarda cómo queda el escenario (el destino si hay un paso en curso), por si hay
  // que volver a montarlo (recarga en `/carta` o vuelta desde una categoría).
  const verCarta = useCallback(
    () => abrirCarta({ index: displayIndex, abierto: mode === 'open' || mode === 'opening' }),
    [displayIndex, mode],
  )
  const onNavSelect = useCallback(
    (key: PanelKey) => {
      const index = paneles.findIndex((p) => p.key === key)
      if (index >= 0) goTo(index)
    },
    [goTo],
  )

  const abierto = mode === 'opening' || mode === 'open'
  // El video corre solo con HOME abierto (y se pausa apenas se sale de HOME o se abre la carta).
  const videoPlaying = abierto && paneles[displayIndex]?.key === 'home' && !carta

  // Primera carga liviana: hasta que termina la intro (y el navegador queda libre) no se monta
  // la carta ni se piden las fotos lejanas del escenario (ver StageMedia).
  const introTerminada = mode !== 'loading' && mode !== 'intro'
  const [enReposo, setEnReposo] = useState(false)
  useEffect(() => {
    if (!introTerminada || enReposo) return
    return cuandoEsteLibre(() => setEnReposo(true))
  }, [introTerminada, enReposo])

  return (
    <div
      className="group/stage fixed inset-0 h-svh w-full touch-pinch-zoom overflow-hidden bg-noche text-champan select-none"
      data-mode={mode}
      data-active={activeIndex}
      data-texts={textsPanel ?? undefined}
      data-lock={state.lock ? '' : undefined}
    >
      {/* Lectores de pantalla: cada cambio de panel (modo cerrado y abierto) se anuncia. */}
      <p className="sr-only" aria-live="polite" data-anuncio-panel>
        {introTerminada && !carta
          ? fill(copy.escenario.posicion, {
              n: String(displayIndex + 1),
              total: String(TOTAL_PANELES),
              panel: paneles[displayIndex]?.titulo ?? '',
            })
          : ''}
      </p>
      <div ref={frameWrapRef} inert={carta} className="invisible absolute inset-0 opacity-0">
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
            activeIndex={displayIndex}
            cargarTodo={enReposo}
            abierto={abierto}
          />
        </Frame>
      </div>

      {/* Con la carta abierta, el escenario de abajo no se puede enfocar ni tocar. */}
      <div inert={carta} className="contents">
        <ClosedView displayIndex={displayIndex} textsIn={textsIn} faded={abierto || mode === 'loading'} onGoTo={goTo} />

        <OpenView
          rootRef={openRef}
          textsPanel={textsPanel}
          visible={abierto}
          onClose={() => dispatch({ type: 'CLOSE' })}
          onVerCarta={verCarta}
          onGoTo={goTo}
          montarTodo={enReposo}
        />
      </div>

      {carta || enReposo ? (
        <Suspense fallback={null}>
          <CartaOverlay abierta={carta} listo={mode !== 'loading'} />
        </Suspense>
      ) : null}

      <div
        ref={chromeRef}
        // El header es transparente: solo sus botones capturan clics (el resto llega al marco).
        className="pointer-events-none invisible absolute inset-x-0 top-0 z-30 pt-[env(safe-area-inset-top)] opacity-0 [&_button]:pointer-events-auto"
      >
        <Navbar
          activeKey={panel.key}
          onSelect={onNavSelect}
          menuOpen={carta}
          onToggleMenu={carta ? cerrarCarta : verCarta}
          showLinks={abierto && !carta}
          ocultarMarca={carta}
        />
      </div>

      <Intro
        frame={frame}
        frameWrapRef={frameWrapRef}
        layerRefs={layerRefs}
        chromeRef={chromeRef}
        initialIndex={entrada.index}
        openOnEnter={entrada.abierto}
        closedOnEnter={!entrada.abierto && entrada.directa}
        onTextsIn={() => setTextsIn(true)}
        onEnterOpen={() => setTextsPanel(entrada.index)}
      />
    </div>
  )
}
