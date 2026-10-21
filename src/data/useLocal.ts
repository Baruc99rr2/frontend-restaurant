import { useSyncExternalStore } from 'react'
import { repository } from './repository'
import type { DeliveryZone, PublicLocal, PublicMenu } from './types'

export type LocalData = {
  local: PublicLocal
  /** Carta + menú del día + si la cocina toma pedidos. */
  menu: PublicMenu
  zonas: DeliveryZone[]
}

export type LocalState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: LocalData; error: null }
  | { status: 'error'; data: null; error: Error }

// Caché de módulo: un solo pedido por endpoint y por carga de página, compartido
// por todos los componentes (la API limita pedidos por minuto). `retry()`
// vuelve a pedir solo si el anterior falló.
let state: LocalState = { status: 'loading', data: null, error: null }
let started = false
const listeners = new Set<() => void>()

function set(next: LocalState) {
  state = next
  listeners.forEach((l) => l())
}

function load() {
  started = true
  set({ status: 'loading', data: null, error: null })
  Promise.all([repository.getLocal(), repository.getCarta(), repository.getZonasDelivery()])
    .then(([local, menu, zonas]) => set({ status: 'ready', data: { local, menu, zonas }, error: null }))
    .catch((err: unknown) => set({ status: 'error', data: null, error: err instanceof Error ? err : new Error(String(err)) }))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!started) load()
  return () => listeners.delete(listener)
}

const getSnapshot = () => state

export function retryLocal() {
  if (state.status === 'error') load()
}

/** Datos operativos del local (backend o mock), cargados una vez y cacheados. */
export function useLocal(): LocalState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
