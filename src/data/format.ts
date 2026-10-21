// Formato de plata y horas, con las mismas reglas que el backend:
// plata en centavos enteros; instantes en UTC que se muestran en la zona del local.

import { siteConfig } from '@/config/site.config'

const precioEntero = new Intl.NumberFormat(siteConfig.locale, {
  style: 'currency',
  currency: siteConfig.moneda,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const precioConCentavos = new Intl.NumberFormat(siteConfig.locale, {
  style: 'currency',
  currency: siteConfig.moneda,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 1850000 → "$ 18.500" (con centavos solo si los hay). */
export function formatPrecio(cents: number): string {
  if (!Number.isInteger(cents)) throw new Error(`Precio no entero en centavos: ${cents}`)
  return cents % 100 === 0 ? precioEntero.format(cents / 100) : precioConCentavos.format(cents / 100)
}

/** "20:00" → "20", "00:30" → "00:30". Para frases como "abre a las 20". */
export function horaCorta(hhmm: string): string {
  const [h = '', m = ''] = hhmm.split(':')
  return m === '00' ? String(Number(h)) : `${h.padStart(2, '0')}:${m}`
}

const partesCache = new Map<string, Intl.DateTimeFormat>()
function partesEn(timeZone: string) {
  let f = partesCache.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    partesCache.set(timeZone, f)
  }
  return f
}

/** Fecha (AAAA-MM-DD) y hora (HH:MM) de un instante en la zona dada. */
export function enZona(instante: string | Date, timeZone: string): { fecha: string; hora: string } {
  const d = typeof instante === 'string' ? new Date(instante) : instante
  const p = Object.fromEntries(partesEn(timeZone).formatToParts(d).map((x) => [x.type, x.value]))
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` }
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const

export const nombreDia = (weekday: number) => DIAS[weekday] ?? ''
export const nombreDiaCorto = (weekday: number) => DIAS_CORTOS[weekday] ?? ''

/** Día de la semana (0 = domingo) de una fecha AAAA-MM-DD. */
export function weekdayDe(fecha: string): number {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay()
}

/** "hoy", "mañana" o "el jueves" para un instante, visto desde `ahora` en la zona del local. */
export function diaRelativo(instante: string, timeZone: string, ahora: Date = new Date()): string {
  const objetivo = enZona(instante, timeZone).fecha
  const hoy = enZona(ahora, timeZone).fecha
  const dias = Math.round((Date.parse(`${objetivo}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`)) / 86_400_000)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  return `el ${nombreDia(weekdayDe(objetivo))}`
}

/** "2026-12-08" → "martes 8 de diciembre". */
export function fechaLarga(fecha: string): string {
  return new Intl.DateTimeFormat(siteConfig.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${fecha}T12:00:00Z`),
  )
}
