import { useEffect, useRef, useState } from 'react'
import { Flame, Sprout, Users, UtensilsCrossed, Wheat, Wine, type LucideIcon } from 'lucide-react'
import { Picture } from '@/components/Picture'
import { teclaRoving } from '@/components/roving'
import { copy } from '@/content/copy.es'
import { editorial, imagen } from '@/content/editorial'
import { gsap, useGSAP } from '@/motion/gsap'
import { Reveal, SlideIn, WipeSwap } from '@/motion/primitives'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

/**
 * 01 LA CASA — Sobre nosotros (§8, ref. 02).
 * - Fondo: gradiente radial `hoja` → `monte` → `noche`.
 * - Izq.: lista con ícono + nombre; el activo con fondo `champan`. Clic o hover-intent (200 ms)
 *   cambia el activo; navegable con teclado (flechas ↑/↓/←/→, Home, End, Tab, Enter/Espacio).
 * - Centro: foto Restaurante 2 (`editorial.medios.laCasa`) fija en el marco inclinado
 *   (`--marco-rotacion`), con parallax leve con el mouse.
 * - Der.: cita arriba ("Cocinar es saber esperar.") y panel con título + texto que cambian
 *   con `WipeSwap` (soporta cambios rápidos e interrupción a mitad sin mezclar texto).
 * Cada bloque visible lleva `[data-open-text]` para que el escenario lo desvanezca al salir.
 * El fondo (`LaCasaFondo`) lo monta el escenario en la capa del panel: entra y sale con él.
 */

/** Fondo de LA CASA en modo abierto: gradiente radial `hoja` → `monte` → `noche`. */
export function LaCasaFondo() {
  return (
    <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_48%,var(--color-hoja)_0%,var(--color-monte)_54%,var(--color-noche)_100%)]" />
  )
}

type Props = {
  active: boolean
}

const HOVER_INTENT_MS = 200

const ICONOS: Record<string, LucideIcon> = {
  Flame,
  Wheat,
  Sprout,
  Wine,
  UtensilsCrossed,
  Users,
}

const ITEMS = copy.laCasa.items
const FOTO_CASA = imagen(editorial.medios.laCasa)

export function LaCasaPanel({ active }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const reduced = useReducedMotion()

  const sectionRef = useRef<HTMLDivElement | null>(null)
  const frameCardRef = useRef<HTMLDivElement | null>(null)
  const parallaxRef = useRef<HTMLDivElement | null>(null)
  const hoverTimerRef = useRef<number | null>(null)
  const quickXRef = useRef<gsap.QuickToFunc | null>(null)
  const quickYRef = useRef<gsap.QuickToFunc | null>(null)

  const clearHoverTimer = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  // Entrada del marco inclinado central cuando el panel activa sus textos.
  useGSAP(
    () => {
      const card = frameCardRef.current
      if (!card) return

      gsap.killTweensOf(card)

      if (!active) {
        gsap.set(card, { opacity: 0 })
        return
      }

      gsap.fromTo(
        card,
        { opacity: 0, scale: reduced ? 1 : 0.92 },
        {
          opacity: 1,
          scale: 1,
          duration: reduced ? motionDuration.reduced : 0.85,
          delay: reduced ? 0 : 0.14,
          ease: motionEase.enter,
        },
      )
    },
    { dependencies: [active, reduced], scope: sectionRef },
  )

  // Configurar quickTo para el parallax leve del marco central con el mouse.
  useGSAP(
    () => {
      const el = parallaxRef.current
      if (!el) return
      gsap.set(el, { x: 0, y: 0 })
      if (reduced) {
        quickXRef.current = null
        quickYRef.current = null
        return
      }
      quickXRef.current = gsap.quickTo(el, 'x', { duration: 0.55, ease: motionEase.ui })
      quickYRef.current = gsap.quickTo(el, 'y', { duration: 0.55, ease: motionEase.ui })
    },
    { dependencies: [reduced], scope: sectionRef },
  )

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    quickXRef.current?.(nx * 22)
    quickYRef.current?.(ny * 18)
  }

  const handlePointerLeave = () => {
    clearHoverTimer()
    quickXRef.current?.(0)
    quickYRef.current?.(0)
  }

  const selectItem = (index: number) => {
    clearHoverTimer()
    setSelectedIndex(index)
  }

  const startHoverIntent = (index: number, pointerType: string) => {
    if (pointerType !== 'mouse') return
    clearHoverTimer()
    if (index === selectedIndex) return
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null
      setSelectedIndex(index)
    }, HOVER_INTENT_MS)
  }

  const actual = ITEMS[selectedIndex] ?? ITEMS[0]!

  return (
    <div
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="absolute inset-0"
    >
      <div
        data-stage-scroller
        className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain [touch-action:pan-y]"
      >
        <div className="relative z-10 mx-auto flex min-h-full max-w-7xl flex-col justify-center gap-5 px-[clamp(1.25rem,3.5vw,3.5rem)] pt-20 pb-20 landscape:lg:grid landscape:lg:grid-cols-[minmax(13.5rem,1fr)_auto_minmax(19rem,1.2fr)] landscape:lg:items-center landscape:lg:gap-10 landscape:lg:pt-24 landscape:lg:pb-20">
          {/* Izquierda: lista de 6 ítems con ícono + nombre (activo con fondo champan) */}
          <div
            role="tablist"
            aria-label="Sobre nosotros"
            onKeyDown={(e) => teclaRoving(e, selectedIndex, ITEMS.length, selectItem)}
            className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 landscape:lg:flex landscape:lg:flex-col landscape:lg:items-start landscape:lg:gap-2.5"
          >
            {ITEMS.map((it, i) => {
              const Icon = ICONOS[it.icono] ?? Flame
              const isSelected = i === selectedIndex
              return (
                <div key={it.item} data-open-text>
                  <SlideIn from="left" active={active} delay={0.04 + i * 0.055}>
                    <button
                      type="button"
                      role="tab"
                      id={`la-casa-tab-${i}`}
                      aria-selected={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      aria-controls="la-casa-tabpanel"
                      data-casa-item={it.item}
                      onClick={() => selectItem(i)}
                      onPointerEnter={(e) => startHoverIntent(i, e.pointerType)}
                      onPointerLeave={clearHoverTimer}
                      className="group flex w-full cursor-pointer items-center gap-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro landscape:lg:w-auto landscape:lg:gap-2.5"
                    >
                      <span
                        className={`grid size-6 shrink-0 place-items-center transition-colors duration-300 landscape:lg:size-9 ${
                          isSelected
                            ? 'text-oro'
                            : 'text-champan/70 group-hover:text-champan'
                        }`}
                      >
                        <Icon className="size-3.5 landscape:lg:size-5" aria-hidden="true" />
                      </span>
                      <span
                        data-casa-pill={isSelected ? 'active' : 'inactive'}
                        className={`inline-block whitespace-nowrap px-2 py-1 font-ui text-etiqueta font-bold uppercase tracking-[0.08em] transition-colors duration-300 landscape:lg:px-4 landscape:lg:py-2 landscape:lg:text-ui landscape:lg:tracking-[0.14em] ${
                          isSelected
                            ? 'bg-champan text-noche'
                            : 'bg-transparent text-champan/75 group-hover:text-champan'
                        }`}
                      >
                        {it.item}
                      </span>
                    </button>
                  </SlideIn>
                </div>
              )
            })}
          </div>

          {/* Centro: foto Restaurante 2 fija en el marco inclinado con parallax leve */}
          <div
            data-open-text
            className="my-1 flex items-center justify-center py-1 landscape:lg:my-0 landscape:lg:px-6"
          >
            <div ref={frameCardRef} className="opacity-0">
              <div ref={parallaxRef} className="will-change-transform">
                <div
                  data-casa-marco
                  className="relative aspect-[4/5] w-[clamp(8.5rem,31vw,11.5rem)] rotate-(--marco-rotacion) overflow-hidden border-[6px] border-noche bg-tizon shadow-[0_24px_60px_color-mix(in_srgb,var(--color-noche)_65%,transparent),0_0_0_1px_var(--color-oro)] landscape:lg:w-[clamp(14rem,20vw,19.5rem)] landscape:lg:border-[10px]"
                >
                  {FOTO_CASA ? (
                    <Picture
                      image={FOTO_CASA}
                      shape="retrato"
                      alt="Mesa servida en Quebracho"
                      sizes="(min-width: 1024px) 22vw, 45vw"
                      loading="eager"
                      className="size-full scale-[1.18] object-cover"
                    />
                  ) : (
                    <div className="size-full bg-tizon" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-noche/15" />
                </div>
              </div>
            </div>
          </div>

          {/* Derecha: cita arriba y panel con título + texto que cambian con WipeSwap */}
          <div
            id="la-casa-tabpanel"
            role="tabpanel"
            aria-labelledby={`la-casa-tab-${selectedIndex}`}
            className="flex flex-col items-stretch gap-3 landscape:lg:items-end landscape:lg:gap-4"
          >
            <div data-open-text className="self-end">
              <SlideIn from="right" active={active} delay={0.18}>
                <div className="bg-champan px-4 py-2.5 text-noche shadow-[0_16px_40px_color-mix(in_srgb,var(--color-noche)_35%,transparent)] landscape:lg:px-6 landscape:lg:py-4">
                  <Reveal
                    as="p"
                    mode="words"
                    active={active}
                    delay={0.28}
                    className="font-serif text-subtitulo italic text-monte"
                  >
                    {`“${copy.laCasa.cita}”`}
                  </Reveal>
                </div>
              </SlideIn>
            </div>

            <div data-open-text className="w-full">
              <SlideIn from="right" active={active} delay={0.3}>
                <div className="bg-champan p-5 text-noche shadow-[0_20px_50px_color-mix(in_srgb,var(--color-noche)_40%,transparent)] sm:p-6 landscape:lg:p-8">
                  <div data-casa-titulo>
                    <WipeSwap
                      value={actual.titulo}
                      as="h3"
                      className="block font-gigante text-subtitulo uppercase text-monte landscape:lg:text-titulo"
                    />
                  </div>

                  <div data-casa-texto className="mt-2.5 landscape:lg:mt-4">
                    <WipeSwap
                      value={actual.texto}
                      as="p"
                      className="block font-ui text-cuerpo text-noche/90"
                    />
                  </div>
                </div>
              </SlideIn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
