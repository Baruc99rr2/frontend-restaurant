import { gsap } from '@/motion/gsap'
import {
  leerRotacion,
  lerpPoints,
  shapePoints,
  toClipPath,
  type FramePoints,
  type FrameShape,
  type Viewport,
} from '@/stage/geometry'

/**
 * Controlador del marco (§5 Frame): guarda los 8 números del polígono y la forma
 * a la que va. GSAP interpola un progreso 0 → 1 y en cada `onUpdate` mezcla los puntos
 * de partida con los de destino **recalculados con el viewport de ese momento**: un resize
 * a mitad de animación no rompe el polígono, y sin animación se recalcula sin animar.
 */
export type FrameController = {
  /** Tween hacia una forma; se puede insertar en un timeline. */
  tweenTo: (shape: FrameShape, vars?: gsap.TweenVars) => gsap.core.Tween
  /** Salta a una forma sin animar. */
  set: (shape: FrameShape) => void
  readonly shape: FrameShape
}

export type Internals = FrameController & {
  attach: (el: HTMLElement | null) => void
  relayout: () => void
}

export function createFrameController(initial: FrameShape): Internals {
  let el: HTMLElement | null = null
  let shape: FrameShape = initial
  let points: FramePoints | null = null
  let tween: gsap.core.Tween | null = null

  // Medidas cacheadas: se leen al enganchar el elemento y en cada `relayout` (resize), nunca
  // en el onUpdate de un tween (leer clientWidth/estilo después de escribir el clip-path
  // forzaba un reflow por frame).
  let medidas: { viewport: Viewport; angle: number } | null = null
  const medir = () => {
    medidas = {
      viewport: { width: el?.clientWidth ?? window.innerWidth, height: el?.clientHeight ?? window.innerHeight },
      angle: el ? leerRotacion(el) : -16,
    }
    return medidas
  }
  const target = (s: FrameShape) => {
    const m = medidas ?? medir()
    return shapePoints(s, m.viewport, m.angle)
  }

  const write = (p: FramePoints) => {
    points = p
    if (el) el.style.clipPath = toClipPath(p)
  }

  const ctrl: Internals = {
    get shape() {
      return shape
    },
    attach(node) {
      el = node
      medir()
      if (node) write(target(shape))
    },
    relayout() {
      medir()
      // Con un tween en curso, su onUpdate ya apunta al destino recalculado.
      if (tween?.isActive()) return
      write(target(shape))
    },
    set(next) {
      tween?.kill()
      tween = null
      shape = next
      write(target(next))
    },
    tweenTo(next, vars = {}) {
      const progress = { t: 0 }
      let from: FramePoints | null = null
      const t = gsap.to(progress, {
        t: 1,
        duration: 1,
        ease: 'none',
        ...vars,
        onStart() {
          // Si había otro tween del marco, este lo reemplaza desde donde quedó.
          if (tween && tween !== t) tween.kill()
          tween = t
          shape = next
          from = points ?? target(next)
          vars.onStart?.call(this)
        },
        onUpdate() {
          if (from) write(lerpPoints(from, target(next), progress.t))
          vars.onUpdate?.call(this)
        },
        onComplete() {
          write(target(next))
          if (tween === t) tween = null
          vars.onComplete?.call(this)
        },
      })
      return t
    },
  }
  return ctrl
}

