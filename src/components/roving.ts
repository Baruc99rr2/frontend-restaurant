import type { KeyboardEvent } from 'react'

/**
 * Teclado de un grupo con foco itinerante (pestañas de LA CASA, chips de EVENTOS):
 * flechas, Inicio y Fin mueven la selección y el foco; Tab entra y sale del grupo.
 * Consume la tecla (así el escenario no la toma como paso de sección).
 * Los botones del grupo llevan `tabIndex` 0 el seleccionado y -1 el resto.
 */
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
  const items = e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"], [role="radio"]')
  items[next]?.focus()
}
