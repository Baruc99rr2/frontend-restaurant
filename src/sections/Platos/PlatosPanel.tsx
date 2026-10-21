import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Flame } from 'lucide-react'
import { siteConfig } from '@/config/site.config'
import { copy, paneles } from '@/content/copy.es'
import { editorial, imagen, platosInsignia } from '@/content/editorial'
import { formatPrecio } from '@/data/format'
import { useLocal } from '@/data/useLocal'
import { gsap, useGSAP } from '@/motion/gsap'
import { BlurSwapImage, Reveal, SlideIn, WipeSwap } from '@/motion/primitives'
import { useReducedMotion } from '@/motion/useReducedMotion'
import { useStage } from '@/stage/StageProvider'

/**
 * 02 PLATOS — los de siempre (§8, ref. 03).
 * - Franja superior (~40%): foto del escenario oscurecida con título "Los que nunca salen
 *   de la carta" y botón "Ver la carta completa" (misma acción que "Ver la carta" de HOME).
 * - Fila inferior de tres paneles:
 *   1. Izq.: marco con borde claro 1px y foto del plato (`BlurSwapImage`).
 *   2. Centro: panel `monte` con nombre de origen en Caslon grande + región chica (`WipeSwap`).
 *   3. Der.: panel `tizon` con puntos/guía arriba (activo `oro`, ancho mayor), descripción en
 *      cursiva, nombre del plato en `oro`, categoría + precio del repositorio, y botones
 *      circulares atrás/adelante con anillo de progreso (7 s) en el de adelante.
 * - Autoplay (7 s): se pausa con hover/focus en la fila, pestaña oculta, reduced motion o
 *   cuando PLATOS no es la sección activa del escenario (`useStage()`).
 */

type Props = {
  active: boolean
  onVerCarta: () => void
}

const AUTOPLAY_SECONDS = 7
const RING_RADIUS = 21
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** Foto mientras llegan los datos: la de la franja (después cambia con `BlurSwapImage`). */
const FOTO_ESPERA = imagen(editorial.medios.platosFranja)

export function PlatosPanel({ active, onVerCarta }: Props) {
  const { state } = useStage()
  const localState = useLocal()
  const reduced = useReducedMotion()

  // Unión editorial + repositorio en un solo lugar (`platosInsignia`). Mientras carga (o si
  // falla) la lista está vacía: los textos quedan vacíos y entran con su barrido al llegar.
  const platos = useMemo(
    () => (localState.status === 'ready' ? platosInsignia(localState.data.menu) : []),
    [localState],
  )

  const total = platos.length
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [rowHovered, setRowHovered] = useState(false)
  const [rowFocused, setRowFocused] = useState(false)
  const [docHidden, setDocHidden] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false,
  )

  const pointerDownRef = useRef(false)
  const ringCircleRef = useRef<SVGCircleElement | null>(null)
  const ringTweenRef = useRef<gsap.core.Tween | null>(null)
  const progressObjRef = useRef({ value: 0 })

  const safeIndex = total > 0 ? selectedIndex % total : 0
  const actual = platos[safeIndex] ?? null

  // Saber si PLATOS es la sección activa leyendo el estado del escenario.
  const isStagePlatosOpen =
    active &&
    state.mode === 'open' &&
    state.transition === null &&
    paneles[state.activeIndex]?.key === 'platos'

  const isPaused = !isStagePlatosOpen || reduced || docHidden || rowHovered || rowFocused
  const pausedRef = useRef(isPaused)
  useEffect(() => {
    pausedRef.current = isPaused
  }, [isPaused])

  const writeRingProgress = useCallback((p: number) => {
    const circle = ringCircleRef.current
    if (!circle) return
    const clamped = Math.max(0, Math.min(1, p))
    circle.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - clamped))
    circle.dataset.platosProgress = clamped.toFixed(3)
  }, [])

  const goNext = useCallback(() => {
    if (total <= 1) return
    setSelectedIndex((prev) => (prev + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    if (total <= 1) return
    setSelectedIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  // Escuchar visibilidad de la pestaña.
  useEffect(() => {
    const onVisChange = () => setDocHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisChange)
    return () => document.removeEventListener('visibilitychange', onVisChange)
  }, [])

  // Reiniciar el anillo de 7 s cada vez que cambia el plato seleccionado o se activa la sección.
  useGSAP(
    () => {
      ringTweenRef.current?.kill()
      ringTweenRef.current = null
      progressObjRef.current.value = 0
      writeRingProgress(0)

      if (!isStagePlatosOpen || reduced || total <= 1) {
        return
      }

      const tween = gsap.to(progressObjRef.current, {
        value: 1,
        duration: AUTOPLAY_SECONDS,
        ease: 'none',
        paused: pausedRef.current,
        onUpdate: () => {
          writeRingProgress(progressObjRef.current.value)
        },
        onComplete: () => {
          writeRingProgress(1)
          goNext()
        },
      })
      ringTweenRef.current = tween

      return () => {
        tween.kill()
      }
    },
    { dependencies: [safeIndex, isStagePlatosOpen, reduced, total, goNext, writeRingProgress] },
  )

  // Pausar / reanudar el tween en curso sin reiniciarlo cuando cambia hover/focus/visibilidad.
  useEffect(() => {
    const tween = ringTweenRef.current
    if (!tween) return
    tween.paused(isPaused)
  }, [isPaused])

  const fotoShape = actual?.foto?.paisaje ?? FOTO_ESPERA?.paisaje
  const fotoSrc = fotoShape?.lg.webp ?? ''
  const fotoPlaceholder = fotoShape?.placeholder

  const metaLinea = actual
    ? `${actual.categoria} · ${formatPrecio(actual.price_cents)}${
        actual.porcion ? ` · ${actual.porcion}` : ''
      }${!actual.available ? ` · ${copy.carta.sinStock}` : ''}`
    : ''

  return (
    <div
      data-stage-scroller
      className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain [touch-action:pan-y]"
    >
      <div className="relative z-10 mx-auto flex min-h-full max-w-7xl flex-col justify-between gap-5 px-[clamp(1.25rem,3.5vw,3.5rem)] pt-20 pb-20 landscape:lg:gap-8 landscape:lg:pt-24 landscape:lg:pb-20">
        {/* Franja superior (~40%): título y botón "Ver la carta completa" sobre la foto oscurecida */}
        <div className="flex flex-1 flex-col justify-end gap-4 pb-1 landscape:lg:flex-row landscape:lg:items-end landscape:lg:justify-between landscape:lg:pb-4">
          <div data-open-text className="max-w-2xl">
            <Reveal
              as="h2"
              mode="words"
              active={active}
              delay={0.05}
              className="font-gigante text-[clamp(1.75rem,3.8vw,3.5rem)] leading-[0.95] uppercase text-champan"
            >
              {copy.platos.titulo}
            </Reveal>
          </div>

          <div data-open-text className="shrink-0">
            <SlideIn from="right" active={active} delay={0.18}>
              <button
                type="button"
                data-platos-carta
                onClick={onVerCarta}
                className="inline-flex cursor-pointer items-center justify-center rounded-full border border-champan/35 bg-noche/50 px-5 py-2.5 font-ui text-etiqueta font-semibold uppercase tracking-[0.14em] text-champan backdrop-blur-md transition-colors duration-300 hover:border-oro hover:bg-oro hover:text-noche focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro landscape:lg:px-6 landscape:lg:py-3"
              >
                {siteConfig.botones.verCartaCompleta}
              </button>
            </SlideIn>
          </div>
        </div>

        {/* Fila inferior de tres paneles (pausa el autoplay con hover o foco dentro de la fila) */}
        <div
          data-platos-fila
          data-platos-paused={isPaused ? 'true' : 'false'}
          onPointerDown={() => {
            pointerDownRef.current = true
          }}
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') setRowHovered(true)
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setRowHovered(false)
          }}
          onFocusCapture={() => {
            if (!pointerDownRef.current) {
              setRowFocused(true)
            }
            pointerDownRef.current = false
          }}
          onBlurCapture={(e) => {
            pointerDownRef.current = false
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setRowFocused(false)
            }
          }}
          className="grid grid-cols-2 gap-3 landscape:lg:h-[clamp(17.5rem,43vh,23rem)] landscape:lg:grid-cols-[1.12fr_0.82fr_1.26fr] landscape:lg:gap-5"
        >
          {/* 1. Izquierda: marco con borde 1px claro y la foto del plato (BlurSwapImage) */}
          <div data-open-text className="col-span-1 h-36 sm:h-44 landscape:lg:h-full">
            <SlideIn from="left" active={active} delay={0.12} className="size-full">
              <div
                data-platos-marco
                className="size-full border border-champan/60 bg-noche/70 p-2 sm:p-2.5 landscape:lg:p-3"
              >
                <BlurSwapImage
                  src={fotoSrc}
                  placeholder={fotoPlaceholder}
                  alt={actual?.name ?? ''}
                  className="size-full"
                />
              </div>
            </SlideIn>
          </div>

          {/* 2. Centro: panel monte con el nombre de origen en Caslon grande + región chica (WipeSwap) */}
          <div data-open-text className="col-span-1 h-36 sm:h-44 landscape:lg:h-full">
            <SlideIn from="left" active={active} delay={0.22} className="size-full">
              <div
                data-platos-centro
                className="flex size-full flex-col items-center justify-center border border-hoja/40 bg-monte px-3 py-4 text-center sm:px-5 landscape:lg:px-8 landscape:lg:py-6"
              >
                <Flame
                  className="mb-2 size-5 text-oro/80 landscape:lg:mb-4 landscape:lg:size-6"
                  aria-hidden="true"
                />
                <div data-platos-origen>
                  <WipeSwap
                    value={actual?.origen ?? ''}
                    as="p"
                    className="block font-serif text-subtitulo leading-tight text-champan landscape:lg:text-titulo"
                  />
                </div>
                <div data-platos-region className="mt-1.5 landscape:lg:mt-2.5">
                  <WipeSwap
                    value={actual?.region ?? ''}
                    as="p"
                    className="block font-ui text-etiqueta font-semibold uppercase tracking-[0.16em] text-oro"
                  />
                </div>
              </div>
            </SlideIn>
          </div>

          {/* 3. Derecha: panel tizon con puntos arriba, descripción en cursiva, nombre en oro, categoría y controles */}
          <div data-open-text className="col-span-2 landscape:lg:col-span-1 landscape:lg:h-full">
            <SlideIn from="right" active={active} delay={0.3} className="size-full">
              <div
                data-platos-derecha
                className="flex size-full flex-col justify-between gap-4 border border-ceniza/20 bg-tizon p-4 sm:p-5 landscape:lg:p-7"
              >
                {/* Puntos / guía del carrusel (activo oro, ancho mayor). Botones simples con
                    `aria-current`: no hay panel por punto, así que no son pestañas. El área de
                    toque (24 px de alto) es más grande que el punto. */}
                <div
                  role="group"
                  aria-label={copy.platos.titulo}
                  className="flex min-h-6 items-center gap-2"
                >
                  {platos.map((p, i) => {
                    const isAct = i === safeIndex
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-current={isAct ? 'true' : undefined}
                        aria-label={`${i + 1}: ${p.name}`}
                        data-platos-dot={i}
                        onClick={() => setSelectedIndex(i)}
                        className="group/dot grid h-6 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
                      >
                        <span
                          aria-hidden="true"
                          className={`block h-2 rounded-full transition-all duration-300 ${
                            isAct ? 'w-9 bg-oro' : 'w-4 bg-ceniza/35 group-hover/dot:bg-ceniza/65'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>

                {/* Descripción del plato en cursiva */}
                <div data-platos-descripcion className="my-auto py-1">
                  <WipeSwap
                    value={actual?.description ?? ''}
                    as="p"
                    className="block font-serif text-cuerpo italic text-champan/90 landscape:lg:text-subtitulo"
                  />
                </div>

                {/* Pie del panel: nombre en oro + categoría/precio a la izq., botones atrás/adelante con anillo a la der. */}
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div data-platos-nombre>
                      <WipeSwap
                        value={actual?.name ?? ''}
                        as="h3"
                        className="block font-serif text-subtitulo font-bold text-oro"
                      />
                    </div>
                    <div data-platos-meta className="mt-1">
                      <WipeSwap
                        value={metaLinea}
                        as="p"
                        className="block font-ui text-etiqueta uppercase tracking-[0.14em] text-ceniza"
                      />
                    </div>
                  </div>

                  {/* Botones circulares atrás / adelante (con anillo de progreso de 7 s) */}
                  <div className="flex shrink-0 items-center gap-2.5">
                    <button
                      type="button"
                      data-platos-prev
                      aria-label={copy.platos.anterior}
                      onClick={goPrev}
                      className="grid size-11 cursor-pointer place-items-center rounded-full border border-ceniza/35 text-champan transition-colors duration-300 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
                    >
                      <ArrowLeft className="size-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      data-platos-next
                      aria-label={copy.platos.siguiente}
                      onClick={goNext}
                      className="group relative grid size-11 cursor-pointer place-items-center rounded-full text-champan transition-colors duration-300 hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
                    >
                      <svg
                        viewBox="0 0 44 44"
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 size-full -rotate-90"
                      >
                        <circle
                          cx="22"
                          cy="22"
                          r={RING_RADIUS}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.25"
                          className="text-ceniza/35"
                        />
                        <circle
                          ref={ringCircleRef}
                          cx="22"
                          cy="22"
                          r={RING_RADIUS}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={RING_CIRCUMFERENCE}
                          data-platos-progress="0"
                          className="text-oro"
                        />
                      </svg>
                      <ArrowRight className="relative z-10 size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
  )
}
