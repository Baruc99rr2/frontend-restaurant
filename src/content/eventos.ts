// Calculadora de EVENTOS (§8). Fórmulas editables por cliente.
// Plata en centavos enteros, como todo el sitio.

import { siteConfig, whatsappUrl } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { formatPrecio } from '@/data/format'

export const invitados = { min: 10, max: 200, paso: 5, inicial: 40 } as const

export const ocasiones = [
  { id: 'dia-de-la-madre', nombre: 'Día de la Madre' },
  { id: 'dia-del-padre', nombre: 'Día del Padre' },
  { id: 'navidad', nombre: 'Navidad' },
  { id: 'ano-nuevo', nombre: 'Año Nuevo' },
  { id: 'cumpleanos', nombre: 'Cumpleaños' },
  { id: 'empresa', nombre: 'Empresa' },
] as const

export const formatos = [
  { id: 'coctel', nombre: 'Cóctel' },
  { id: 'mesa', nombre: 'Mesa servida' },
  { id: 'asado', nombre: 'Asado a la vista' },
] as const

export type OcasionId = (typeof ocasiones)[number]['id']
export type FormatoId = (typeof formatos)[number]['id']

export type Seleccion = { invitados: number; ocasion: OcasionId; formato: FormatoId }

export type Resultado = {
  id: 'kg' | 'botellas' | 'mozos' | 'pasos' | 'horas' | 'presupuesto'
  area: string
  valor: number
  /** 'plata': `valor` está en centavos. */
  unidad: 'numero' | 'plata'
  etiqueta: string
}

const KG_POR_PERSONA: Record<FormatoId, number> = { asado: 0.45, mesa: 0.3, coctel: 0.15 }
const PASOS: Record<FormatoId, { valor: number; etiqueta: string }> = {
  coctel: { valor: 8, etiqueta: 'bocados' },
  mesa: { valor: 4, etiqueta: 'pasos de menú' },
  asado: { valor: 5, etiqueta: 'pasos de menú' },
}
const HORAS: Partial<Record<OcasionId, number>> = { 'ano-nuevo': 6, empresa: 3 }

// PLACEHOLDER: valores de ejemplo, en centavos por persona.
const BASE_POR_PERSONA: Record<FormatoId, number> = { coctel: 2_200_000, mesa: 3_200_000, asado: 3_800_000 }
const MULTIPLICADOR: Record<OcasionId, number> = {
  'dia-de-la-madre': 1,
  'dia-del-padre': 1,
  navidad: 1.25,
  'ano-nuevo': 1.35,
  cumpleanos: 1,
  empresa: 1.1,
}

/** Redondea a $100 (10.000 centavos) para que el número sea legible. */
export const redondearPlata = (cents: number) => Math.round(cents / 10_000) * 10_000

/** Acota la cantidad de invitados al rango permitido (10–200) en múltiplos del paso (5). */
export function clampInvitados(n: number): number {
  const stepped = Math.round(n / invitados.paso) * invitados.paso
  return Math.max(invitados.min, Math.min(invitados.max, stepped))
}

export function calcularEvento({ invitados: n, ocasion, formato }: Seleccion): Resultado[] {
  const fiesta = ocasion === 'navidad' || ocasion === 'ano-nuevo'
  const kg = Math.round(n * KG_POR_PERSONA[formato] * 10) / 10
  const botellas = Math.ceil(Math.ceil(n / 2.5) * (fiesta ? 1.2 : 1))
  const mozos = Math.ceil(n / (formato === 'coctel' ? 15 : 12))
  const pasos = PASOS[formato]
  const horas = HORAS[ocasion] ?? 4
  const presupuesto = redondearPlata(BASE_POR_PERSONA[formato] * MULTIPLICADOR[ocasion])

  return [
    { id: 'kg', area: 'Cocina', valor: kg, unidad: 'numero', etiqueta: 'kg a la brasa' },
    { id: 'botellas', area: 'Bodega', valor: botellas, unidad: 'numero', etiqueta: 'botellas sugeridas' },
    { id: 'mozos', area: 'Salón', valor: mozos, unidad: 'numero', etiqueta: 'mozos asignados' },
    { id: 'pasos', area: 'Cocina', valor: pasos.valor, unidad: 'numero', etiqueta: pasos.etiqueta },
    { id: 'horas', area: 'Equipo', valor: horas, unidad: 'numero', etiqueta: 'horas de servicio' },
    { id: 'presupuesto', area: 'Presupuesto', valor: presupuesto, unidad: 'plata', etiqueta: 'desde, por persona' },
  ]
}

/** Formatea el valor numérico o en centavos de un resultado de `calcularEvento`. */
export function formatearResultado(r: Resultado): string {
  if (r.unidad === 'plata') return formatPrecio(r.valor)
  return r.valor.toLocaleString(siteConfig.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

/** Arma el texto completo del resumen para WhatsApp y mail a partir de `copy.eventos.mensaje`. */
export function armarMensajeEvento(sel: Seleccion): string {
  const ocasionNombre = ocasiones.find((o) => o.id === sel.ocasion)?.nombre ?? sel.ocasion
  const formatoNombre = formatos.find((f) => f.id === sel.formato)?.nombre ?? sel.formato
  const resultados = calcularEvento(sel)
  const resumen = resultados
    .map((r) => `${r.area}: ${formatearResultado(r)} ${r.etiqueta}`)
    .join(' · ')

  return copy.eventos.mensaje
    .replace('{invitados}', String(sel.invitados))
    .replace('{ocasion}', ocasionNombre)
    .replace('{formato}', formatoNombre)
    .replace('{resumen}', resumen)
}

/** URL de WhatsApp (`wa.me`) con el resumen de la selección URL-encoded. */
export function whatsappEventoUrl(sel: Seleccion): string {
  return whatsappUrl(armarMensajeEvento(sel))
}

/** Alternativa `mailto:` con asunto y cuerpo prellenados. */
export function mailtoEventoUrl(sel: Seleccion): string {
  const subject = encodeURIComponent(copy.eventos.asuntoMail)
  const body = encodeURIComponent(armarMensajeEvento(sel))
  return `mailto:${siteConfig.contacto.email}?subject=${subject}&body=${body}`
}
