import { useEffect, useLayoutEffect, useRef } from 'react'
import { Observer } from '@/motion/gsap'

/**
 * Input del escenario (§5): wheel, swipe táctil, `↓/↑`, `PageDown/PageUp` y `Espacio`
 * → un paso (+1 / -1). Usa `Observer` de GSAP para wheel y touch.
 *
 * Wheel: umbral acumulado ~50 px y **un paso por gesto**. Un gesto termina cuando hay una
 * pausa (> 200 ms) o cuando, después de haber decaído, el delta vuelve a crecer (un swipe
 * nuevo sobre la inercia del trackpad). Así la cola de inercia no produce dobles pasos,
 * pero un gesto nuevo durante una transición sí llega (y el escenario lo encola).
 *
 * Paneles con scroller interno (`data-stage-scroller`): el paso solo se dispara cuando
 * ese scroller está en el borde, y el gesto que lo scrolleó no cuenta.
 *
 * Zonas con gestos propios (`data-stage-gestos-propios`, p. ej. el mapa de CONTACTO activo):
 * la rueda y el swipe que empiezan ahí son de esa zona, no pasos de sección.
 */

export type StepDir = 1 | -1

type Options = {
  enabled: boolean
  onStep: (dir: StepDir) => void
}

export const WHEEL_UMBRAL = 50
export const SWIPE_UMBRAL = 50
const PAUSA_GESTO_MS = 200

const SCROLLER = '[data-stage-scroller]'
const GESTOS_PROPIOS = '[data-stage-gestos-propios]'

const tieneGestosPropios = (target: EventTarget | null) =>
  target instanceof Element && target.closest(GESTOS_PROPIOS) !== null

function puedeScrollear(target: EventTarget | null, dir: StepDir): boolean {
  if (!(target instanceof Element)) return false
  const el = target.closest<HTMLElement>(SCROLLER)
  if (!el) return false
  if (el.scrollHeight <= el.clientHeight + 1) return false
  return dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 1
}

function esCampoDeTexto(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

function normalizarDelta(e: WheelEvent): number {
  if (e.deltaMode === 1) return e.deltaY * 16
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight
  return e.deltaY
}

/** Detector de gestos de wheel (puro, testeable desde /dev). */
export function createWheelGesture(onStep: (dir: StepDir) => void) {
  let acc = 0
  let lastTime = -Infinity
  let consumed = false
  let peak = 0
  let decayed = false
  const recent: number[] = []

  return {
    /** Devuelve true si el evento disparó un paso. */
    push(delta: number, now: number, blockedByScroller: boolean): boolean {
      const abs = Math.abs(delta)
      const gap = now - lastTime
      lastTime = now

      recent.push(abs)
      if (recent.length > 6) recent.shift()

      let nuevoGesto = gap > PAUSA_GESTO_MS
      if (!nuevoGesto && consumed) {
        peak = Math.max(peak, abs)
        if (abs < peak * 0.55) decayed = true
        // Swipe nuevo encima de la inercia: había decaído y vuelve a acelerar.
        if (decayed && recent.length >= 4) {
          const prev = ((recent[recent.length - 4] ?? 0) + (recent[recent.length - 3] ?? 0)) / 2
          const last = ((recent[recent.length - 2] ?? 0) + (recent[recent.length - 1] ?? 0)) / 2
          if (last > prev * 1.6 && last > 12) nuevoGesto = true
        }
      }
      if (nuevoGesto) {
        consumed = false
        acc = 0
        peak = abs
        decayed = false
      }

      if (blockedByScroller) {
        // El gesto scrolleó contenido interno: no cuenta para pasar de panel.
        consumed = true
        acc = 0
        return false
      }
      if (consumed) return false

      if (acc !== 0 && Math.sign(acc) !== Math.sign(delta)) acc = 0
      acc += delta
      if (Math.abs(acc) >= WHEEL_UMBRAL) {
        const dir: StepDir = acc > 0 ? 1 : -1
        acc = 0
        consumed = true
        peak = abs
        decayed = false
        onStep(dir)
        return true
      }
      return false
    },
  }
}

export function useStepInput({ enabled, onStep }: Options) {
  const onStepRef = useRef(onStep)
  const enabledRef = useRef(enabled)
  // En el commit (no en un efecto pasivo): si el escenario se habilita desde un tick de GSAP,
  // un efecto pasivo puede correr después del primer input y ese paso se perdía.
  useLayoutEffect(() => {
    onStepRef.current = onStep
    enabledRef.current = enabled
  }, [onStep, enabled])

  useEffect(() => {
    const emit = (dir: StepDir) => {
      if (enabledRef.current) onStepRef.current(dir)
    }
    const wheel = createWheelGesture(emit)
    let touchScroll = { down: false, up: false }
    let touchPropio = false

    const observer = Observer.create({
      target: window,
      type: 'wheel,touch',
      // Sin preventDefault global: los scrollers internos tienen que poder scrollear.
      onWheel: (self) => {
        const e = self.event as WheelEvent
        if (e.ctrlKey) return // pinch-zoom del trackpad
        if (tieneGestosPropios(e.target)) return
        const delta = normalizarDelta(e)
        if (delta === 0) return
        const dir: StepDir = delta > 0 ? 1 : -1
        wheel.push(delta, performance.now(), puedeScrollear(e.target, dir))
      },
      onPress: (self) => {
        // Se mira al apoyar el dedo: si el scroller interno podía moverse en esa
        // dirección, el gesto es para scrollearlo aunque al soltar ya esté en el borde.
        const target = self.event.target
        touchScroll = { down: puedeScrollear(target, 1), up: puedeScrollear(target, -1) }
        touchPropio = tieneGestosPropios(target)
      },
      onRelease: (self) => {
        if (touchPropio) return
        const dy = (self.y ?? 0) - (self.startY ?? 0)
        const dx = (self.x ?? 0) - (self.startX ?? 0)
        if (Math.abs(dy) < SWIPE_UMBRAL || Math.abs(dy) < Math.abs(dx)) return
        const dir: StepDir = dy < 0 ? 1 : -1 // dedo hacia arriba → panel siguiente
        if (dir > 0 ? touchScroll.down : touchScroll.up) return
        emit(dir)
      },
    })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return
      const active = document.activeElement
      if (esCampoDeTexto(active)) return
      let dir: StepDir | null = null
      if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1
      else if (e.key === ' ' || e.code === 'Space') {
        // Espacio sobre un botón o link lo activa (comportamiento nativo).
        if (active instanceof HTMLElement && active.closest('button, a, [role="button"]')) return
        dir = e.shiftKey ? -1 : 1
      }
      if (dir === null) return
      if (puedeScrollear(active, dir)) return
      e.preventDefault()
      emit(dir)
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      observer.kill()
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
