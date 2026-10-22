import { useSyncExternalStore } from 'react'

/**
 * Miniaturas borrosas de las fotos (`media.placeholders.generated.ts`), fuera del chunk
 * principal: se piden al arrancar (`cargarPlaceholders()` en `main.tsx`) y llegan en paralelo.
 * En el catálogo, `placeholder` es una clave (`f1/paisaje`); `usePlaceholder(clave)` devuelve
 * el data URI cuando el módulo ya llegó y `undefined` mientras tanto (se ve el fondo del contenedor).
 * Un data URI o una URL pasan tal cual (respaldo de BlurSwapImage).
 */

let mapa: Record<string, string> | null = null
let pedido: Promise<void> | null = null
const oyentes = new Set<() => void>()

export function cargarPlaceholders(): Promise<void> {
  pedido ??= import('./media.placeholders.generated').then(
    (m) => {
      mapa = m.placeholders
      oyentes.forEach((l) => l())
    },
    () => {
      // Sin miniaturas el sitio funciona igual: se ve el fondo del contenedor.
    },
  )
  return pedido
}

const subscribe = (l: () => void) => {
  oyentes.add(l)
  void cargarPlaceholders()
  return () => oyentes.delete(l)
}
const version = () => mapa

export function resolverPlaceholder(clave: string | undefined): string | undefined {
  if (!clave) return undefined
  if (clave.startsWith('data:') || clave.startsWith('/') || clave.startsWith('http')) return clave
  return mapa?.[clave]
}

export function usePlaceholder(clave: string | undefined): string | undefined {
  useSyncExternalStore(subscribe, version, version)
  return resolverPlaceholder(clave)
}
