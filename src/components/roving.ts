import type { KeyboardEvent } from 'react'

/**
 * Teclado de un grupo con foco itinerante (pestañas de LA CASA, chips de EVENTOS,
 * cartelitos de la carta): flechas, Inicio y Fin mueven la selección y el foco;
 * Tab entra y sale del grupo. Consume la tecla (así el escenario no la toma como paso de sección).
 * Los elementos del grupo llevan `tabIndex` 0 el actual y -1 el resto, y se reconocen por
 * `role="tab"`, `role="radio"` o `data-roving` (botones comunes, como los cartelitos).
 * `seleccionar` recibe el índice nuevo: en pestañas y chips elige; en los cartelitos solo
 * mueve el foco (elegir es Enter/clic).
 */
export const ROVING_ITEM = '[role="tab"], [role="radio"], [data-roving]'

export function teclaRoving(
  e: KeyboardEvent<HTMLElement>,
  actual: number,
  total: number,
  seleccionar: (index: number) => void,
) {
  let next: number | null = null
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (actual + 1) % total
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (actual - 1 + total) % total
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = total - 1
  if (next === null) return
  e.preventDefault()
  e.stopPropagation()
  seleccionar(next)
  const items = e.currentTarget.querySelectorAll<HTMLElement>(ROVING_ITEM)
  items[next]?.focus()
}
