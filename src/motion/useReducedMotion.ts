import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

let overrideValue: boolean | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  const mql = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY)
    : null

  if (mql) {
    mql.addEventListener('change', emit)
  }

  return () => {
    listeners.delete(callback)
    if (mql) {
      mql.removeEventListener('change', emit)
    }
  }
}

function getSnapshot(): boolean {
  if (overrideValue !== null) {
    return overrideValue
  }
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Permite forzar o desactivar `reducedMotion` desde `/dev` sin depender
 * de la preferencia del sistema operativo. Pasar `null` restaura el valor del SO.
 */
export function setReducedMotionOverride(value: boolean | null): void {
  if (overrideValue === value) return
  overrideValue = value
  emit()
}

/** Valor actual sin suscribirse (para timelines que se arman una sola vez, como la intro). */
export function getReducedMotionSnapshot(): boolean {
  return getSnapshot()
}

export function getReducedMotionOverride(): boolean | null {
  return overrideValue
}

/**
 * Devuelve `true` cuando el usuario prefiere reducir movimiento (`prefers-reduced-motion: reduce`)
 * o cuando el switch de `/dev` fuerza la simulación.
 * Todas las primitivas degradan a fades cortos de 200 ms cuando devuelve `true`.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
