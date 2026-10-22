import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { copy, paneles } from '@/content/copy.es'
import { gsap, useGSAP } from '@/motion/gsap'
import { Reveal } from '@/motion/primitives'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'
import { closedBox, esVertical, leerRotacion, shapePoints, boundingBox } from '@/stage/geometry'
import { TOTAL_PANELES } from '@/stage/stageMachine'
import { useCoarsePointer, useElementSize } from '@/stage/useStageSize'

/**
 * Modo cerrado (§5, refs 06–07): título gigante abajo (superpuesto al borde inferior del
 * marco), etiquetas laterales que ruedan, números laterales para saltar a un panel e
 * indicación "Hacé clic para entrar" junto al marco. Es una capa encima del marco: no
 * captura clics salvo en sus botones, así el clic en el marco lo recibe el marco.
 */

type Props = {
  displayIndex: number
  /** `false` durante el loader y el crecimiento del marco: todo afuera. */
  textsIn: boolean
  /** Abriendo/abierto: la capa se desvanece (el título no sale letra por letra). */
  faded: boolean
  onGoTo: (index: number) => void
}

const pad = (n: number) => String(n).padStart(2, '0')
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))

// --- Texto que rueda (etiquetas): pila con overflow:hidden y la pila se desplaza ------

type RollProps = {
  /** Un ítem por slot; el slot 0 es el vacío desde el que "ruedan hacia adentro". */
  items: ReactNode[]
  slot: number
  delay?: number
  className?: string
  itemClassName: string
}

function Roll({ items, slot, delay = 0, className = '', itemClassName }: RollProps) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const firstRef = useRef(true)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const list = listRef.current
      if (!list) return
      const yPercent = (-slot * 100) / items.length
      gsap.killTweensOf(list)
      if (firstRef.current) {
        firstRef.current = false
        gsap.set(list, { yPercent })
        return
      }
      if (reduced) {
        gsap
          .timeline()
          .to(list, { opacity: 0, duration: motionDuration.reduced / 2, ease: motionEase.ui })
          .set(list, { yPercent })
          .to(list, { opacity: 1, duration: motionDuration.reduced, ease: motionEase.ui })
        return
      }
      // Desde donde esté (interrumpible): nunca salta.
      gsap.to(list, {
        yPercent,
        opacity: 1,
        duration: motionDuration.stage.closed.labelsRoll,
        delay,
        ease: motionEase.scene,
      })
    },
    { dependencies: [slot, reduced, items.length] },
  )

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div ref={listRef} className="will-change-transform">
        {items.map((item, i) => (
          <div key={i} className={itemClassName}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Números laterales: rueda colapsada; con hover/foco se despliega la lista --------

function IndexColumn({
  displayIndex,
  textsIn,
  onGoTo,
  expandDown,
}: {
  displayIndex: number
  textsIn: boolean
  onGoTo: (i: number) => void
  /** Arriba de la pantalla (mobile): la lista se despliega solo hacia abajo. */
  expandDown: boolean
}) {
  const windowRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const firstRef = useRef(true)
  const [expanded, setExpanded] = useState(false)
  const reduced = useReducedMotion()
  const coarse = useCoarsePointer()
  const open = expanded && textsIn

  // Slots: 0 vacío + un número por panel. Un slot = 1.5em.
  const slot = textsIn ? displayIndex + 1 : 0

  useGSAP(
    () => {
      const win = windowRef.current
      const list = listRef.current
      if (!win || !list) return
      // Desplegado: la ventana crece hacia arriba y abajo y el número actual queda quieto.
      const top = open && !expandDown ? -displayIndex * 1.5 : 0
      const height = open ? TOTAL_PANELES * 1.5 : 1.5
      const y = open ? -1.5 : -slot * 1.5
      const vars = { top: `${top}em`, height: `${height}em` }
      gsap.killTweensOf([win, list])
      if (firstRef.current) {
        firstRef.current = false
        win.dataset.open = String(open)
        gsap.set(win, vars)
        gsap.set(list, { y: `${y}em` })
        return
      }
      const duration = reduced
        ? motionDuration.reduced
        : String(open) !== win.dataset.open
          ? motionDuration.stage.closed.indexExpand
          : motionDuration.stage.closed.labelsRoll
      const ease = reduced ? motionEase.ui : motionEase.scene
      win.dataset.open = String(open)
      gsap.to(win, { ...vars, duration, ease })
      gsap.to(list, { y: `${y}em`, duration, ease })
    },
    { dependencies: [open, slot, displayIndex, reduced, expandDown] },
  )

  return (
    <div
      className="pointer-events-auto relative h-[1.5em] w-[2.5em] text-ui"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setExpanded(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExpanded(false)
      }}
    >
      <nav
        ref={windowRef}
        aria-label={copy.escenario.paneles}
        className="absolute inset-x-0 overflow-hidden"
      >
        <div ref={listRef} className="will-change-transform">
          <div className="h-[1.5em]" aria-hidden="true" />
          {paneles.map((p, i) => {
            const actual = i === displayIndex
            return (
              <button
                key={p.key}
                type="button"
                tabIndex={textsIn ? 0 : -1}
                aria-current={actual ? 'step' : undefined}
                aria-label={fill(copy.escenario.irA, { n: pad(i + 1), panel: p.titulo })}
                onClick={(e) => {
                  e.stopPropagation()
                  // En táctil, el primer toque sobre el número actual despliega la lista.
                  if (coarse && actual && !open) {
                    setExpanded(true)
                    return
                  }
                  setExpanded(false)
                  if (!actual) onGoTo(i)
                }}
                className={`flex h-[1.5em] w-full cursor-pointer items-center tabular-nums transition-colors duration-300 focus-visible:outline-1 focus-visible:outline-oro ${
                  actual ? 'text-champan' : 'text-champan/45 hover:text-oro'
                }`}
              >
                {pad(i + 1)}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

// --- Título gigante: tamaño ajustado al ancho ---------------------------------------

/** Tope del título: alto en desktop (~25% del alto), ancho en mobile. */
function tituloTope(w: number, h: number) {
  return w / h < 1 ? w * 0.24 : Math.min(w * 0.16, h * 0.25)
}

export function ClosedView({ displayIndex, textsIn, faded, onGoTo }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const titleRefs = useRef<(HTMLDivElement | null)[]>([])
  const size = useElementSize(rootRef)
  const coarse = useCoarsePointer()
  const reduced = useReducedMotion()
  const vertical = esVertical(size)

  // Cada título se mide a 100px y se escala para entrar en el ancho (con un tope).
  useLayoutEffect(() => {
    const fit = () => {
      const w = rootRef.current?.clientWidth ?? 0
      const h = rootRef.current?.clientHeight ?? 0
      if (!w || !h) return
      const disponible = w - (w < 640 ? 32 : 64)
      const tope = tituloTope(w, h)
      // En tres pasadas (escribir todos, medir todos, escribir todos): un solo reflow.
      const titulos = titleRefs.current.filter((el): el is HTMLDivElement => !!el)
      for (const el of titulos) el.style.fontSize = '100px'
      const anchos = titulos.map((el) => el.scrollWidth)
      titulos.forEach((el, i) => {
        const ancho = anchos[i] ?? 0
        const px = ancho > 0 ? Math.min(tope, (disponible * 100) / ancho) : tope
        el.style.fontSize = `${Math.floor(px)}px`
      })
    }
    fit()
    let cancel = false
    void document.fonts?.ready.then(() => !cancel && fit())
    return () => {
      cancel = true
    }
  }, [size.width, size.height])

  // Capa completa: fade al abrir/cerrar.
  useGSAP(
    () => {
      const el = rootRef.current
      if (!el) return
      gsap.to(el, {
        autoAlpha: faded ? 0 : 1,
        duration: reduced ? motionDuration.reduced : motionDuration.stage.openCloseTexts,
        ease: motionEase.ui,
      })
    },
    { dependencies: [faded, reduced] },
  )

  // Indicación junto al marco: desktop a la derecha del borde derecho; mobile debajo del marco.
  const rot = leerRotacion(document.documentElement)
  const box = closedBox(size, displayIndex, rot)
  const pts = shapePoints({ kind: 'closed', index: displayIndex }, size, rot)
  // Mobile: fila fija debajo del marco (el borde más bajo de los 6 paneles, para que no salte).
  const bajoMarco = vertical
    ? Math.max(...paneles.map((_, i) => boundingBox(shapePoints({ kind: 'closed', index: i }, size, rot)).bottom)) + 14
    : 0
  // Desktop: junto a la esquina inferior derecha, lejos de la etiqueta derecha y del título.
  const hint = vertical ? { x: 16, y: bajoMarco } : { x: pts[4] + 24, y: pts[5] - 8 }

  const slot = textsIn ? displayIndex + 1 : 0
  const izquierdas = [['', ''], ...paneles.map((p) => p.izquierda)]
  const derechas = [['', ''], ...paneles.map((p) => p.derecha)]
  const frase = (l: string[]) => (
    <>
      <span className="block">{l[0]}</span>
      <span className="block">{l[1]}</span>
    </>
  )
  // Dos líneas exactas por etiqueta: sin cortes (la ventana del rodillo mide 2 líneas).
  const labelClass = `h-[2.6em] whitespace-nowrap leading-[1.3] ${vertical ? 'tracking-[0.1em]' : 'tracking-[0.14em]'}`
  const derecha = (
    <Roll
      items={derechas.map(frase)}
      slot={slot}
      delay={motionDuration.stage.closed.labelsStagger}
      className={labelClass}
      itemClassName={`h-[2.6em] ${vertical ? 'text-right' : 'text-center'}`}
    />
  )
  const total = (
    <Roll
      items={['', pad(TOTAL_PANELES)]}
      slot={textsIn ? 1 : 0}
      delay={motionDuration.stage.closed.labelsStagger * 2}
      className="h-[1.5em] w-[2.5em] text-right text-ui tabular-nums"
      itemClassName="flex h-[1.5em] items-center justify-end"
    />
  )

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-10 font-ui text-etiqueta uppercase text-champan">
      {/* El anuncio del panel actual para lectores de pantalla vive en Stage (también en modo abierto). */}
      {/* Etiquetas laterales. Desktop: a los lados, a la altura del centro del marco.
          Mobile: índice + frase izq. arriba; frase der. debajo del marco (no entran las dos en una fila). */}
      <div
        className={`absolute inset-x-0 flex items-start justify-between px-4 sm:px-8 ${
          vertical ? 'top-[calc(env(safe-area-inset-top)+5.25rem)]' : '-translate-y-1/2'
        }`}
        style={vertical ? undefined : { top: box.cy }}
      >
        <div className={`flex items-start ${vertical ? 'gap-4' : 'w-[30vw] gap-[6vw]'}`}>
          <IndexColumn displayIndex={displayIndex} textsIn={textsIn} onGoTo={onGoTo} expandDown={vertical} />
          <Roll
            items={izquierdas.map(frase)}
            slot={slot}
            className={labelClass}
            itemClassName={`h-[2.6em] ${vertical ? 'text-left' : 'text-center'}`}
          />
        </div>
        <div className={`flex items-start justify-end ${vertical ? '' : 'w-[30vw] gap-[6vw]'}`}>
          {!vertical && derecha}
          {total}
        </div>
      </div>
      {vertical && (
        <div className="absolute right-4" style={{ top: bajoMarco }}>
          {derecha}
        </div>
      )}

      {/* Indicación discreta junto al marco. */}
      <div
        className="absolute top-0 left-0 transition-[transform,opacity] duration-1000 ease-[cubic-bezier(.65,0,.35,1)]"
        style={{
          transform: `translate(${hint.x}px, ${hint.y}px)${vertical ? '' : ' translateY(-50%)'}`,
          opacity: textsIn ? 1 : 0,
        }}
      >
        <p className="flex items-center gap-2 whitespace-nowrap tracking-[0.18em] text-champan/80 group-has-[[data-frame]:focus-visible]/stage:text-oro">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full rounded-full bg-oro opacity-70 motion-safe:animate-ping" />
            <span className="relative inline-flex size-1.5 rounded-full bg-oro" />
          </span>
          {coarse ? copy.intro.tocar : copy.intro.clic}
        </p>
      </div>

      {/* Título gigante: los 6 apilados; el activo entra letra por letra y el anterior sale hacia abajo. */}
      <div
        className="absolute inset-x-0 grid justify-items-center px-4 sm:px-8"
        style={{ bottom: 'max(2svh, env(safe-area-inset-bottom))' }}
        aria-hidden="true"
      >
        {paneles.map((p, i) => (
          <div
            key={p.key}
            ref={(el) => {
              titleRefs.current[i] = el
            }}
            className="col-start-1 row-start-1 self-end whitespace-nowrap"
          >
            <Reveal
              as="span"
              mode="chars"
              active={textsIn && i === displayIndex}
              delay={motionDuration.stage.closed.titleInDelay}
              className="block font-gigante text-[1em] leading-[0.82] text-champan"
            >
              {p.titulo}
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  )
}
