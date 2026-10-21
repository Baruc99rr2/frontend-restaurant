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

export function closedBox(vp: Viewport, index: number, baseAngle: number): ClosedBox {
  const variacion = VARIACION_POR_PANEL[index] ?? 0
  const angle = baseAngle + variacion
  if (esVertical(vp)) {
    const h = vp.height * 0.54
    const w = Math.min(vp.width * 0.64, h * 0.62)
    return { cx: vp.width / 2, cy: vp.height * 0.47, w, h, angle }
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
