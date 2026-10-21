// Estado del barrido negro (módulo aparte de WipeTransition.tsx: ahí solo van componentes).

let activo = false

/** Hay un barrido en curso (los atajos como Esc o MENU no navegan mientras tanto). */
export const barridoActivo = () => activo

export function marcarBarrido(valor: boolean) {
  activo = valor
}
