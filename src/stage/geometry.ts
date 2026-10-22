// Geometría del marco (§5 Frame). Funciones puras: viewport + forma → 4 puntos (8 números).
// El marco es un cuadrilátero; el media queda derecho y a pantalla completa detrás del recorte.

export type Viewport = { width: number; height: number }

/** 4 esquinas en orden: arriba-izq., arriba-der., abajo-der., abajo-izq. → [x1, y1, …, x4, y4] */
export type FramePoints = [number, number, number, number, number, number, number, number]

export type FrameShape =
  /** Modo cerrado: cuadrilátero rotado (con la variación del panel). */
  | { kind: 'closed'; index: number }
  /** Arranque de la intro: la forma cerrada a escala 0.25 alrededor de su centro. */
  | { kind: 'intro'; index: number }
  /** Modo abierto: rectángulo con inset `clamp(12px, 1.6vw, 28px)`. */
  | { kind: 'open' }
  /** Sin marco (transiciones abiertas, F4). */
  | { kind: 'full' }

/** Variación sutil del ángulo por panel (grados, se suma a `--marco-rotacion`). */
export const VARIACION_POR_PANEL = [0, 1.6, -1.4, 2, -1.8, 1.1] as const

export const ESCALA_INTRO = 0.25

/** Portrait/mobile: más alto y angosto (§5). */
export const esVertical = (vp: Viewport) => vp.width / vp.height < 1

export type ClosedBox = { cx: number; cy: number; w: number; h: number; angle: number }

/** Tope del título gigante del modo cerrado: alto en desktop (~25% del alto), ancho en vertical. */
export function tituloTope(vp: Viewport) {
  return esVertical(vp) ? Math.min(vp.width * 0.24, vp.height * 0.12) : Math.min(vp.width * 0.16, vp.height * 0.25)
}

/**
 * Filas del modo cerrado en vertical (px), compartidas con `ClosedView` para que el marco
 * nunca se pise con ellas:
 * - arriba: navbar + fila de índice/etiqueta (en pantallas bajas, < 480 px, sin etiquetas);
 * - debajo del marco: indicación + etiqueta derecha (en angosto, < 340 px, una debajo de la otra);
 * - abajo: título gigante.
 */
export function filasVertical(vp: Viewport) {
  const bajo = vp.height < 480
  const angosto = vp.width < 340
  const filaArriba = bajo ? 72 : 84
  const arriba = filaArriba + 44 + 8
  // Indicación (~18 px) y etiqueta derecha (2 líneas, ~29 px).
  const filasBajoMarco = bajo ? 18 : angosto ? 18 + 8 + 29 : 29
  const titulo = tituloTope(vp) * 0.82
  const abajo = Math.max(vp.height * 0.02, 0) + titulo + 12 + filasBajoMarco + 14
  return { bajo, angosto, filaArriba, arriba, abajo }
}

export function closedBox(vp: Viewport, index: number, baseAngle: number): ClosedBox {
  const variacion = VARIACION_POR_PANEL[index] ?? 0
  const angle = baseAngle + variacion
  if (esVertical(vp)) {
    // El alto rotado (con el ángulo más inclinado de los 6 paneles) entra en la banda libre;
    // donde sobra lugar queda como siempre (54% del alto, centro al 47%).
    const { arriba, abajo } = filasVertical(vp)
    const maxRad = (Math.max(...VARIACION_POR_PANEL.map((v) => Math.abs(baseAngle + v))) * Math.PI) / 180
    const banda = Math.max(0, vp.height - arriba - abajo)
    const h = Math.min(vp.height * 0.54, banda / (Math.cos(maxRad) + 0.62 * Math.sin(maxRad)))
    const w = Math.min(vp.width * 0.64, h * 0.62)
    const altoRotado = h * Math.cos(maxRad) + w * Math.sin(maxRad)
    const cy = Math.min(Math.max(vp.height * 0.47, arriba + altoRotado / 2), vp.height - abajo - altoRotado / 2)
    return { cx: vp.width / 2, cy, w, h, angle }
  }
  // Desktop: ~34vw × 72vh (ref. 06). Se limita para que el cuadrilátero rotado
  // no se salga por arriba ni por abajo en pantallas muy apaisadas.
  let w = vp.width * 0.34
  let h = vp.height * 0.72
  const rad = (Math.abs(angle) * Math.PI) / 180
  const altoRotado = h * Math.cos(rad) + w * Math.sin(rad)
  const maxAlto = vp.height * 0.86
  if (altoRotado > maxAlto) {
    const k = maxAlto / altoRotado
    w *= k
    h *= k
  }
  return { cx: vp.width / 2, cy: vp.height * 0.48, w, h, angle }
}

function boxPoints({ cx, cy, w, h, angle }: ClosedBox, scale = 1): FramePoints {
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = (w / 2) * scale
  const hh = (h / 2) * scale
  const corners: [number, number][] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ]
  const out: number[] = []
  for (const [x, y] of corners) {
    out.push(cx + x * cos - y * sin, cy + x * sin + y * cos)
  }
  return out as FramePoints
}

export function openInset(vp: Viewport): number {
  return Math.min(28, Math.max(12, vp.width * 0.016))
}

function rectPoints(vp: Viewport, inset: number): FramePoints {
  const r = vp.width - inset
  const b = vp.height - inset
  return [inset, inset, r, inset, r, b, inset, b]
}

export function shapePoints(shape: FrameShape, vp: Viewport, baseAngle: number): FramePoints {
  switch (shape.kind) {
    case 'closed':
      return boxPoints(closedBox(vp, shape.index, baseAngle))
    case 'intro':
      return boxPoints(closedBox(vp, shape.index, baseAngle), ESCALA_INTRO)
    case 'open':
      return rectPoints(vp, openInset(vp))
    case 'full':
      return rectPoints(vp, 0)
  }
}

export function lerpPoints(a: FramePoints, b: FramePoints, t: number): FramePoints {
  return a.map((v, i) => v + ((b[i] ?? v) - v) * t) as FramePoints
}

export function toClipPath(p: FramePoints): string {
  const r = (n: number) => Math.round(n * 10) / 10
  return `polygon(${r(p[0])}px ${r(p[1])}px, ${r(p[2])}px ${r(p[3])}px, ${r(p[4])}px ${r(p[5])}px, ${r(p[6])}px ${r(p[7])}px)`
}

/** Lee `--marco-rotacion` (p. ej. "-16deg") del elemento; white-label desde tokens.css. */
export function leerRotacion(el: Element): number {
  const raw = getComputedStyle(el).getPropertyValue('--marco-rotacion').trim()
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n)) return -16
  if (raw.endsWith('rad')) return (n * 180) / Math.PI
  if (raw.endsWith('turn')) return n * 360
  return n
}

export function boundingBox(p: FramePoints) {
  const xs = [p[0], p[2], p[4], p[6]]
  const ys = [p[1], p[3], p[5], p[7]]
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) }
}
