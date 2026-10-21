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

type EstadoHistorial = { carta?: string; debajo?: EscenarioDebajo; desde?: string; pasos?: number }

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

/** Entrada a una categoría desde la carta o desde otra categoría (la usa el barrido). */
export function navegarACategoria(slug: string) {
  const actual = estado()
  const ruta = rutaActual().nombre
  const desdeCarta = ruta === 'carta' || actual.desde === CARGA
  const pasos = ruta === 'carta' ? 1 : (actual.pasos ?? 0) + 1
  navegar(`/carta/${encodeURIComponent(slug)}`, {
    state: (desdeCarta ? { desde: CARGA, pasos, debajo: actual.debajo } : {}) satisfies EstadoHistorial,
  })
}

/**
 * Desde una categoría, volver a la carta: atrás si se llegó desde la carta en esta carga
 * (tantos pasos como categorías se hayan recorrido, así el historial vuelve limpio a `/carta`);
 * si no, reemplaza la entrada actual por `/carta` (con HOME abierto abajo).
 */
export function volverALaCarta(): void | Promise<void> {
  const actual = estado()
  if (actual.desde === CARGA) return atras(actual.pasos ?? 1)
  navegar('/carta', {
    replace: true,
    state: { carta: 'externa', debajo: { index: 0, abierto: true } } satisfies EstadoHistorial,
  })
}
