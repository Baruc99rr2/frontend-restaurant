/**
 * Foco atrapado en un diálogo (overlay de la carta): Tab y Shift+Tab recorren solo
 * `elementos` (en ese orden) y dan la vuelta. Si el foco quedó afuera, vuelve al primero.
 * Los elementos fuera del diálogo que tienen que seguir alcanzables (p. ej. el botón
 * CERRAR del navbar) se pasan junto con los de adentro.
 */

const TABULABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Elementos tabulables y visibles dentro de `raiz`, en orden del documento. */
export function tabulables(raiz: ParentNode): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>(TABULABLE)).filter(
    (el) => el.tabIndex >= 0 && !el.closest('[inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
  )
}

/** Manejar Tab con el foco atrapado. Devuelve true si movió el foco. */
export function atraparFoco(e: KeyboardEvent, elementos: HTMLElement[]): boolean {
  if (e.key !== 'Tab' || elementos.length === 0) return false
  const actual = document.activeElement as HTMLElement | null
  const i = actual ? elementos.indexOf(actual) : -1
  const siguiente =
    i === -1
      ? e.shiftKey
        ? elementos.length - 1
        : 0
      : (i + (e.shiftKey ? -1 : 1) + elementos.length) % elementos.length
  e.preventDefault()
  elementos[siguiente]?.focus()
  return true
}
