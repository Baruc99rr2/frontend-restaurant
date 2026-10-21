import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { atraparFoco, tabulables } from '@/components/focusTrap'
import { copy } from '@/content/copy.es'
import type { PlatoCarta } from '@/content/editorial'
import { formatPrecio } from '@/data/format'
import { Flip, gsap, useGSAP } from '@/motion/gsap'
import { BlurSwapImage, WipeSwap } from '@/motion/primitives'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

/**
 * Polaroid de un plato con foto (§9):
 * - Se abre al hacer clic en el nombre de un plato con foto.
 * - Fondo oscurecido con blur (`bg-noche/75 backdrop-blur-md`).
 * - La polaroid crece desde el punto del clic con GSAP `Flip` (`[data-polaroid-flip]`).
 * - En otra capa (`[data-polaroid-marco]`, "un elemento, un dueño"), rotación leve fija
 *   por plato (`--rot`), bordes de 14 px a los lados/arriba y pie de 56 px con el nombre
 *   del plato en Caslon (`WipeSwap`) y el precio (`WipeSwap`), y la foto con `BlurSwapImage`.
 * - Flechas ← → (y botones anterior/siguiente) recorren los platos con foto de esa categoría.
 * - Cierra con ✕, clic afuera o `Esc`; foco atrapado y devuelto al nombre del plato al cerrar.
 */

const ROTACIONES = [-2.5, 2, -1.5, 3, -2, 2.5] as const

const rotacionPolaroid = (catIndex: number, platoIndex: number): number =>
  ROTACIONES[(catIndex * 2 + platoIndex) % ROTACIONES.length] ?? -2.5

export type PuntoClic = { x: number; y: number }

type Props = {
  platos: PlatoCarta[]
  abierta: boolean
  indice: number
  catIndex: number
  origen: PuntoClic | null
  openerRef: RefObject<HTMLElement | null>
  onCambiar: (index: number) => void
  onCerrar: () => void
}

type EstadoPolaroid = 'cerrada' | 'abriendo' | 'abierta' | 'cerrando'

export function Polaroid({
  platos,
  abierta,
  indice,
  catIndex,
  origen,
  openerRef,
  onCambiar,
  onCerrar,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const flipRef = useRef<HTMLDivElement | null>(null)
  const anclaRef = useRef<HTMLSpanElement | null>(null)
  const cerrarBtnRef = useRef<HTMLButtonElement | null>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const reduced = useReducedMotion()
  const idxSeguro = platos.length > 0 ? ((indice % platos.length) + platos.length) % platos.length : 0
  const plato = platos[idxSeguro] ?? null
  const foto = plato?.foto ?? null
  const visible = abierta && plato !== null
  const rot = rotacionPolaroid(catIndex, idxSeguro)

  // Estado sincronizado en useLayoutEffect para el listener global de teclado (CLAUDE.md).
  const stateRef = useRef({ visible, indice: idxSeguro, total: platos.length, onCambiar, onCerrar })
  useLayoutEffect(() => {
    stateRef.current = { visible, indice: idxSeguro, total: platos.length, onCambiar, onCerrar }
  }, [visible, idxSeguro, platos.length, onCambiar, onCerrar])

  const marcar = (estado: EstadoPolaroid) => {
    if (rootRef.current) rootRef.current.dataset.polaroidEstado = estado
  }

  // Apertura con Flip desde el punto del clic y cierre suave.
  useGSAP(
    () => {
      const root = rootRef.current
      const flipEl = flipRef.current
      const anclaEl = anclaRef.current
      if (!root || !flipEl) return

      tlRef.current?.kill()
      Flip.killFlipsOf(flipEl)

      if (!visible && Number(gsap.getProperty(root, 'opacity')) === 0) {
        gsap.set(root, { autoAlpha: 0 })
        gsap.set(flipEl, { clearProps: 'transform,x,y,scaleX,scaleY,width,height,opacity' })
        marcar('cerrada')
        return
      }

      const tl = gsap.timeline()
      tlRef.current = tl
      const d = motionDuration.reduced

      if (visible) {
        marcar('abriendo')
        gsap.set(flipEl, { clearProps: 'transform,x,y,scaleX,scaleY,width,height', opacity: 1 })
        if (reduced || !anclaEl || !origen) {
          gsap.set(root, { autoAlpha: 0 })
          tl.to(root, { autoAlpha: 1, duration: d, ease: motionEase.ui }, 0)
        } else {
          gsap.set(root, { autoAlpha: 0 })
          tl.to(root, { autoAlpha: 1, duration: 0.3, ease: motionEase.ui }, 0)
          // Posicionar la polaroid en el ancla del clic con Flip.fit y animar hacia el centro con Flip.from.
          Flip.fit(flipEl, anclaEl, { scale: true })
          const state = Flip.getState(flipEl)
          gsap.set(flipEl, { clearProps: 'transform,x,y,scaleX,scaleY,width,height' })
          const flipTl = Flip.from(state, {
            duration: 0.6,
            ease: motionEase.enter,
            scale: true,
          })
          tl.add(flipTl, 0)
        }
        tl.call(() => marcar('abierta'))
      } else {
        marcar('cerrando')
        if (reduced || !anclaEl || !origen) {
          tl.to(root, { autoAlpha: 0, duration: d, ease: motionEase.ui }, 0)
        } else {
          const fitVars = Flip.fit(flipEl, anclaEl, { scale: true, getVars: true }) as gsap.TweenVars
          tl.to(
            flipEl,
            {
              x: fitVars.x ?? 0,
              y: fitVars.y ?? 0,
              scaleX: fitVars.scaleX ?? 0.2,
              scaleY: fitVars.scaleY ?? 0.2,
              opacity: 0,
              duration: 0.32,
              ease: motionEase.exit,
            },
            0,
          )
          tl.to(root, { autoAlpha: 0, duration: 0.28, ease: motionEase.ui }, 0.04)
        }
        tl.call(() => {
          gsap.set(flipEl, { clearProps: 'transform,x,y,scaleX,scaleY,width,height,opacity' })
          marcar('cerrada')
        })
      }
    },
    { dependencies: [visible, reduced] },
  )

  // Foco atrapado dentro del diálogo, navegación con ← → y Esc, y devolución del foco al plato al cerrar.
  useEffect(() => {
    const root = rootRef.current
    if (!root || !visible) return

    const destinoAlCerrar = openerRef.current
    const raf = requestAnimationFrame(() => {
      ;(cerrarBtnRef.current ?? root).focus({ preventScroll: true })
    })

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (!s.visible) return
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        s.onCerrar()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        if (s.total > 1) s.onCambiar((s.indice + 1) % s.total)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        if (s.total > 1) s.onCambiar((s.indice - 1 + s.total) % s.total)
        return
      }
      if (e.key === 'Tab') {
        atraparFoco(e, tabulables(root))
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown, true)
      requestAnimationFrame(() => {
        if (destinoAlCerrar && destinoAlCerrar.isConnected) {
          destinoAlCerrar.focus({ preventScroll: true })
        }
      })
    }
  }, [visible, openerRef])

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={plato?.name ?? copy.carta.titulo}
      tabIndex={-1}
      data-polaroid
      data-polaroid-estado="cerrada"
      data-polaroid-plato={plato?.id ?? ''}
      inert={!visible}
      className="invisible fixed inset-0 z-50 grid place-items-center p-4 opacity-0 outline-none sm:p-8"
    >
      {/* Fondo oscurecido con blur; clic afuera cierra. */}
      <div
        data-polaroid-fondo
        onClick={onCerrar}
        className="absolute inset-0 bg-noche/75 backdrop-blur-md"
      />

      {/* Ancla invisible en el punto exacto del clic para GSAP Flip. */}
      <span
        ref={anclaRef}
        aria-hidden="true"
        className="pointer-events-none fixed h-15 w-12 -translate-x-1/2 -translate-y-1/2"
        style={{
          left: origen ? `${origen.x}px` : '50%',
          top: origen ? `${origen.y}px` : '50%',
        }}
      />

      {/* Contenedor que anima GSAP Flip (sin pisar la rotación fija de la capa interna). */}
      <div
        ref={flipRef}
        data-polaroid-flip
        className="relative z-10 flex flex-col items-center gap-5 will-change-transform"
      >
        {/* Marco polaroid con rotación leve fija por plato, 14px de lados y 56px abajo. */}
        <div
          data-polaroid-marco
          style={{ '--rot': `${rot}deg` } as React.CSSProperties}
          className="relative w-[min(84vw,22.5rem)] rotate-(--rot) bg-champan px-[14px] pt-[14px] text-noche shadow-[0_2rem_4.5rem_-1.25rem_var(--color-noche)] transition-[rotate] duration-500 ease-out sm:w-[min(76vw,24.5rem)] motion-reduce:transition-none"
        >
          {/* Botón cerrar ✕ */}
          <button
            ref={cerrarBtnRef}
            type="button"
            data-polaroid-cerrar
            aria-label={copy.carta.cerrarFoto}
            onClick={onCerrar}
            className="absolute -top-4 -right-4 z-20 grid size-10 cursor-pointer place-items-center rounded-full border border-champan/40 bg-tizon text-champan shadow-lg transition-colors duration-200 hover:border-oro hover:bg-oro hover:text-noche focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          {/* Foto del plato (4:5) con desenfoque + leve zoom al cambiar entre platos */}
          <div className="aspect-4/5 w-full overflow-hidden bg-tizon">
            {foto ? (
              <BlurSwapImage
                src={foto.retrato.lg.webp}
                placeholder={foto.retrato.placeholder}
                alt={plato?.name ?? ''}
                className="size-full"
              />
            ) : null}
          </div>

          {/* Pie de 56px: nombre del plato en Caslon y precio en centavos formateado */}
          <div
            data-polaroid-pie
            className="flex min-h-[56px] items-baseline justify-between gap-4 pt-3 pb-3.5"
          >
            <div data-polaroid-nombre className="min-w-0 flex-1 overflow-hidden">
              <WipeSwap
                value={plato?.name ?? ''}
                as="p"
                className="font-serif text-cuerpo leading-snug font-bold text-noche sm:text-[1.1875rem]"
              />
            </div>
            <div data-polaroid-precio className="shrink-0">
              <WipeSwap
                value={plato ? formatPrecio(plato.price_cents) : ''}
                as="span"
                className="block font-ui text-ui font-bold tabular-nums text-monte"
              />
            </div>
          </div>
        </div>

        {/* Controles ← → para recorrer los platos con foto de la categoría (teclado, clic o toque) */}
        {platos.length > 1 ? (
          <div className="flex items-center gap-4 rounded-full border border-champan/20 bg-tizon/90 px-3 py-1.5 text-champan backdrop-blur-md">
            <button
              type="button"
              data-polaroid-anterior
              aria-label={copy.platos.anterior}
              onClick={() => onCambiar((idxSeguro - 1 + platos.length) % platos.length)}
              className="grid size-8 cursor-pointer place-items-center rounded-full border border-champan/25 text-champan transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <span data-polaroid-contador className="min-w-12 text-center">
              <WipeSwap
                value={`${idxSeguro + 1} / ${platos.length}`}
                className="font-ui text-etiqueta font-semibold tabular-nums text-champan/85"
              />
            </span>
            <button
              type="button"
              data-polaroid-siguiente
              aria-label={copy.platos.siguiente}
              onClick={() => onCambiar((idxSeguro + 1) % platos.length)}
              className="grid size-8 cursor-pointer place-items-center rounded-full border border-champan/25 text-champan transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
