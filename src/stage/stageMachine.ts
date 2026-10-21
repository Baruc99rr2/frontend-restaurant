import { paneles } from '@/content/copy.es'
import type { PanelKey } from '@/content/editorial'

/**
 * Máquina de estados del escenario (§5):
 * `loading → intro → closed ⇄ opening/closing → open`, más una transición en curso
 * (`transition`, con `lock`) que bloquea el input. Un solo reducer; las animaciones
 * son timelines GSAP que leen este estado y, al terminar, despachan el evento siguiente.
 * Cola de 1 input como máximo: lo que llega durante una transición se encola una vez.
 */

export type StageMode = 'loading' | 'intro' | 'closed' | 'opening' | 'open' | 'closing'

export type StageTransition = { from: number; to: number; dir: 1 | -1 }

export type StageState = {
  mode: StageMode
  activeIndex: number
  /** Bloquea el input mientras corre una animación de escena. */
  lock: boolean
  transition: StageTransition | null
  /** Panel encolado (máx. 1) para cuando termine la transición actual. */
  queued: number | null
}

export type StageEvent =
  | { type: 'READY' }
  | { type: 'READY_OPEN'; index: number }
  | { type: 'INTRO_DONE' }
  | { type: 'STEP'; dir: 1 | -1 }
  | { type: 'GOTO'; index: number }
  | { type: 'TRANSITION_DONE' }
  | { type: 'OPEN' }
  | { type: 'OPENED' }
  | { type: 'CLOSE' }
  | { type: 'CLOSED' }

export const TOTAL_PANELES = paneles.length

export const clampIndex = (i: number) => Math.max(0, Math.min(TOTAL_PANELES - 1, i))

function startTransition(state: StageState, to: number): StageState {
  if (to === state.activeIndex) return { ...state, lock: false, transition: null, queued: null }
  return {
    ...state,
    lock: true,
    transition: { from: state.activeIndex, to, dir: to > state.activeIndex ? 1 : -1 },
    queued: null,
  }
}

/** Panel al que apunta un pedido: con una transición en curso, se cuenta desde su destino. */
function targetFor(state: StageState, event: { type: 'STEP'; dir: 1 | -1 } | { type: 'GOTO'; index: number }) {
  const base = state.transition?.to ?? state.activeIndex
  return event.type === 'STEP' ? clampIndex(base + event.dir) : clampIndex(event.index)
}

export function stageReducer(state: StageState, event: StageEvent): StageState {
  switch (event.type) {
    case 'READY':
      return state.mode === 'loading' ? { ...state, mode: 'intro', lock: true } : state
    case 'READY_OPEN':
      return state.mode === 'loading'
        ? { ...state, mode: 'open', activeIndex: clampIndex(event.index), lock: false }
        : state
    case 'INTRO_DONE':
      return state.mode === 'intro' ? { ...state, mode: 'closed', lock: false } : state

    case 'STEP':
    case 'GOTO': {
      if (state.mode !== 'closed') return state // F4: pasos en modo abierto
      const target = targetFor(state, event)
      if (state.lock) {
        // Cola de 1: solo si no hay nada encolado y el pedido mueve algo.
        if (state.queued !== null || !state.transition || target === state.transition.to) return state
        return { ...state, queued: target }
      }
      if (target === state.activeIndex) return state
      return startTransition(state, target)
    }

    case 'TRANSITION_DONE': {
      if (!state.transition) return state
      const settled: StageState = { ...state, activeIndex: state.transition.to, transition: null, lock: false }
      if (state.queued !== null && state.queued !== settled.activeIndex) {
        return startTransition(settled, state.queued)
      }
      return { ...settled, queued: null }
    }

    case 'OPEN':
      return state.mode === 'closed' && !state.lock ? { ...state, mode: 'opening', lock: true, queued: null } : state
    case 'OPENED':
      return state.mode === 'opening' ? { ...state, mode: 'open', lock: false } : state
    case 'CLOSE':
      return state.mode === 'open' && !state.lock ? { ...state, mode: 'closing', lock: true } : state
    case 'CLOSED':
      return state.mode === 'closing' ? { ...state, mode: 'closed', lock: false } : state
  }
}

export function panelIndexFromHash(hash: string): number | null {
  const key = decodeURIComponent(hash.replace(/^#/, '')) as PanelKey
  const i = paneles.findIndex((p) => p.key === key)
  return i >= 0 ? i : null
}
