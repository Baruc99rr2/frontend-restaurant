// Frases de estado en vivo y resumen del horario, armadas con datos del backend
// y plantillas de copy.es.ts. Nada de horarios escritos a mano.

import { copy } from '@/content/copy.es'
import { diaRelativo, enZona, fechaLarga, horaCorta, nombreDia } from './format'
import type { OrderIntake, PublicLocal, SpecialDay, WeeklySlot } from './types'

const t = (plantilla: string, vars: Record<string, string>) => plantilla.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')

/** "Abierto ahora, cierra a las 00:30" / "Cerrado, abre mañana a las 12". */
export function estadoLocal(local: PublicLocal, ahora: Date = new Date()): string {
  const tz = local.time_zone
  if (local.open_now && local.open_until) {
    return t(copy.estado.abierto, { hora: horaCorta(enZona(local.open_until, tz).hora) })
  }
  if (!local.open_now && local.next_opening) {
    return t(copy.estado.cerradoAbre, {
      dia: diaRelativo(local.next_opening, tz, ahora),
      hora: horaCorta(enZona(local.next_opening, tz).hora),
    })
  }
  return local.open_now ? copy.estado.abiertoSinHora : copy.estado.cerrado
}

/** null si la cocina toma pedidos; si no, la frase de cuándo vuelve. */
export function estadoCocina(orders: OrderIntake, timeZone: string): string | null {
  if (orders.taking_orders) return null
  if (orders.resumes_at) return t(copy.estado.cocinaVuelve, { hora: horaCorta(enZona(orders.resumes_at, timeZone).hora) })
  return copy.estado.cocinaPausa
}

export type FilaHorario = { dias: string; franjas: string }

const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0] // lunes primero

const franjas = (slots: WeeklySlot[]) =>
  slots.length === 0
    ? copy.estado.diaCerrado
    : slots
        .slice()
        .sort((a, b) => a.opens_at.localeCompare(b.opens_at))
        .map((s) => `${horaCorta(s.opens_at)} a ${horaCorta(s.closes_at)}`)
        .join(' · ')

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Agrupa días seguidos con el mismo horario: "Martes a jueves · 12 a 15:30 · 20 a 00:30". */
export function resumirHorario(weekly: WeeklySlot[]): FilaHorario[] {
  const porDia = ORDEN_SEMANA.map((d) => ({ dia: d, texto: franjas(weekly.filter((s) => s.weekday === d)) }))
  const filas: { desde: number; hasta: number; texto: string }[] = []
  for (const { dia, texto } of porDia) {
    const ultima = filas.at(-1)
    if (ultima && ultima.texto === texto) ultima.hasta = dia
    else filas.push({ desde: dia, hasta: dia, texto })
  }
  return filas.map((f) => ({
    dias: capitalizar(f.desde === f.hasta ? nombreDia(f.desde) : `${nombreDia(f.desde)} a ${nombreDia(f.hasta)}`),
    franjas: f.texto,
  }))
}

/** "Martes 8 de diciembre: cerrado" / "Lunes 23 de noviembre: 12 a 16". */
export function describirDiaDistinto(dia: SpecialDay): string {
  const fecha = capitalizar(fechaLarga(dia.date))
  if (dia.closed || !dia.opens_at || !dia.closes_at) return `${fecha}: ${copy.estado.diaCerrado}`
  return `${fecha}: ${horaCorta(dia.opens_at)} a ${horaCorta(dia.closes_at)}`
}
