import { atras, navegar, rutaActual, volviendoAtras } from '@/app/router'
import { barridoActivo } from '@/carta/barrido'

/**
 * Abrir y cerrar la carta es navegar: `/carta` es una ruta. Así el botón MENU, "Ver la carta",
 * `Esc` y el atrás del navegador pasan todos por la URL y nada queda desincronizado.
 *
 * - Abrir: `pushState('/carta')` guardando en el historial cómo estaba el escenario de abajo.
 * - Cerrar: si la entrada `/carta` la puso esta carga de la página, `history.back()`
 *   (el historial queda limpio y "adelante" la vuelve a abrir). Si no (se entró directo a
 *   `/carta` o se recargó), se reemplaza por `/` y el escenario reescribe su hash.
 */

/** Identifica las entradas del historial creadas por esta carga de la página. */
const CARGA = Math.random().toString(36).slice(2)

/** Cómo estaba el escenario debajo de la carta (para volver a montarlo igual). */
export type EscenarioDebajo = { index: number; abierto: boolean }

type EstadoHistorial = { carta?: string; debajo?: EscenarioDebajo; desde?: string }

const estado = (): EstadoHistorial => (history.state as EstadoHistorial | null) ?? {}

const ocupado = () => volviendoAtras() || barridoActivo()

export function abrirCarta(debajo: EscenarioDebajo) {
  if (rutaActual().nombre !== 'escenario' || ocupado()) return
  navegar('/carta', { state: { carta: CARGA, debajo } satisfies EstadoHistorial })
}

export function cerrarCarta() {
  if (rutaActual().nombre !== 'carta' || ocupado()) return
  if (estado().carta === CARGA) void atras()
  else navegar('/', { replace: true })
}

/**
 * Escenario de abajo al montar en `/carta` (recarga o vuelta desde una categoría):
 * el que había al abrir la carta; sin dato (URL directa), HOME abierto.
 */
export function escenarioDebajoDeLaCarta(): EscenarioDebajo {
  const d = estado().debajo
  return d && Number.isInteger(d.index) ? { index: d.index, abierto: !!d.abierto } : { index: 0, abierto: true }
}

/** Entrada a una categoría desde la carta (la usa el barrido). */
export function navegarACategoria(slug: string) {
  navegar(`/carta/${encodeURIComponent(slug)}`, { state: { desde: CARGA } satisfies EstadoHistorial })
}

/**
 * Desde una categoría, volver a la carta: atrás si se llegó desde la carta en esta carga
 * (historial limpio); si no, se abre la carta como entrada nueva (con HOME abierto abajo).
 */
export function volverALaCarta(): void | Promise<void> {
  if (estado().desde === CARGA) return atras()
  navegar('/carta', { state: { carta: 'externa', debajo: { index: 0, abierto: true } } satisfies EstadoHistorial })
}
