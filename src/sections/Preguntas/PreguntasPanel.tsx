import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { siteConfig, whatsappUrl } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { faq, normalizar, type Faq } from '@/content/faq'
import { formatPrecio } from '@/data/format'
import type { DeliveryZone } from '@/data/types'
import { useLocal } from '@/data/useLocal'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { Reveal, SlideIn, WipeSwap } from '@/motion/primitives'
import { useReducedMotion } from '@/motion/useReducedMotion'

/**
 * 04 PREGUNTAS (§8, ref. 10).
 * - Fondo: diagonales `monte` → `noche`.
 * - Título: "Lo que más nos preguntan."
 * - Bajada: "Si no está acá, escribinos por mail, llamanos o mandanos un WhatsApp." (links reales).
 * - Buscador en píldora (filtra pregunta + respuesta ignorando acentos y mayúsculas, con `WipeSwap`
 *   en la lista; si no hay resultados, muestra mensaje con fundido).
 * - Acordeón: una abierta a la vez, chevron que rota, altura animada sin saltos.
 * - 3 por página, paginación "1 / 4" con botones circulares.
 * - Pregunta 12 (`dinamica: 'zonas-delivery'`): completa la respuesta con los barrios del backend.
 */

type Props = {
  active: boolean
}

const PAGE_SIZE = 3
const SLOTS = [0, 1, 2] as const

function BajadaConLinks() {
  const { contacto } = siteConfig
  const { bajada, links } = copy.preguntas
  const partes = bajada.split(/(\{email\}|\{telefono\}|\{whatsapp\})/g)

  const linkClass =
    'underline decoration-oro/70 underline-offset-4 transition-colors duration-200 hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro'

  return (
    <p data-preguntas-bajada className="font-ui text-cuerpo text-champan/85">
      {partes.map((parte, i) => {
        if (parte === '{email}') {
          return (
            <a
              key={i}
              data-preguntas-link="email"
              href={`mailto:${contacto.email}`}
              className={linkClass}
            >
              {links.email}
            </a>
          )
        }
        if (parte === '{telefono}') {
          return (
            <a
              key={i}
              data-preguntas-link="telefono"
              href={`tel:${contacto.telefono.tel}`}
              className={linkClass}
            >
              {links.telefono}
            </a>
          )
        }
        if (parte === '{whatsapp}') {
          return (
            <a
              key={i}
              data-preguntas-link="whatsapp"
              href={whatsappUrl(copy.reservar.mensaje)}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {links.whatsapp}
            </a>
          )
        }
        return <span key={i}>{parte}</span>
      })}
    </p>
  )
}

type AccordionRowProps = {
  slotIndex: number
  item: Faq | undefined
  isOpen: boolean
  onToggle: () => void
  zonas: DeliveryZone[]
  reduced: boolean
}

function AccordionRow({ slotIndex, item, isOpen, onToggle, zonas, reduced }: AccordionRowProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)

  useGSAP(
    () => {
      const body = bodyRef.current
      const inner = innerRef.current
      if (!body || !inner) return

      gsap.killTweensOf(body)

      if (!initializedRef.current) {
        initializedRef.current = true
        if (isOpen && item) {
          gsap.set(body, { display: 'block', height: 'auto', opacity: 1 })
        } else {
          gsap.set(body, { display: 'none', height: 0, opacity: 0 })
        }
        return
      }

      if (isOpen && item) {
        const startH = body.offsetHeight
        gsap.set(body, { display: 'block', height: 'auto' })
        const targetH = inner.scrollHeight
        gsap.fromTo(
          body,
          { height: startH, opacity: startH > 0 ? Number(gsap.getProperty(body, 'opacity')) || 0.4 : 0 },
          {
            height: targetH,
            opacity: 1,
            duration: reduced ? motionDuration.reduced : 0.36,
            ease: motionEase.ui,
            onComplete: () => {
              gsap.set(body, { height: 'auto' })
            },
          },
        )
      } else {
        const startH = body.offsetHeight
        if (startH <= 0) {
          gsap.set(body, { display: 'none', height: 0, opacity: 0 })
          return
        }
        gsap.fromTo(
          body,
          { height: startH },
          {
            height: 0,
            opacity: 0,
            duration: reduced ? motionDuration.reduced : 0.28,
            ease: motionEase.ui,
            onComplete: () => {
              gsap.set(body, { display: 'none' })
            },
          },
        )
      }
    },
    { dependencies: [isOpen, item?.pregunta, reduced] },
  )

  if (!item) {
    return (
      <li aria-hidden="true" className="hidden">
        <div ref={bodyRef}>
          <div ref={innerRef} />
        </div>
      </li>
    )
  }

  return (
    <li
      data-preguntas-item={slotIndex}
      data-preguntas-open={isOpen ? 'true' : 'false'}
      className="border-b border-champan/15"
    >
      <h3>
        <button
          type="button"
          data-preguntas-btn={slotIndex}
          aria-expanded={isOpen}
          onClick={onToggle}
          className="group flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left font-ui text-cuerpo font-semibold text-champan transition-colors duration-200 hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:py-5 landscape:lg:text-subtitulo"
        >
          <span className="flex min-w-0 items-baseline gap-3">
            <span className="shrink-0 font-ui text-ui font-bold text-oro">Q:</span>
            <span data-preguntas-titulo={slotIndex} className="min-w-0">
              <WipeSwap value={item.pregunta} className="block" />
            </span>
          </span>

          <ChevronLeft
            aria-hidden="true"
            className={`size-5 shrink-0 text-champan/75 transition-transform duration-300 group-hover:text-oro ${
              isOpen ? '-rotate-90 text-oro' : 'rotate-0'
            }`}
          />
        </button>
      </h3>

      <div
        ref={bodyRef}
        data-preguntas-respuesta={slotIndex}
        style={{ display: 'none', height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div ref={innerRef} className="pb-5 pl-7 pr-4 sm:pb-6 sm:pl-8">
          <p className="font-ui text-cuerpo leading-relaxed text-champan/85">{item.respuesta}</p>

          {item.dinamica === 'zonas-delivery' && zonas.length > 0 && (
            <ul
              data-preguntas-zonas
              className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {zonas.map((z) => (
                <li
                  key={z.name}
                  data-preguntas-zona={z.name}
                  className="flex flex-col justify-between rounded-lg border border-hoja/50 bg-tizon/75 px-3.5 py-2.5 font-ui text-etiqueta"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-champan">{z.name}</span>
                    <span className="font-semibold text-oro">{formatPrecio(z.fee_cents)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-ceniza">
                    <span>mín. {formatPrecio(z.min_order_cents)}</span>
                    {z.eta_minutes !== null && <span>~{z.eta_minutes} min</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  )
}

export function PreguntasPanel({ active }: Props) {
  const localState = useLocal()
  const reduced = useReducedMotion()

  const bgRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listWrapRef = useRef<HTMLDivElement | null>(null)
  const emptyWrapRef = useRef<HTMLDivElement | null>(null)

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

  const zonas = useMemo<DeliveryZone[]>(
    () => (localState.status === 'ready' ? localState.data.zonas : []),
    [localState],
  )

  const zonasTexto = useMemo(() => zonas.map((z) => z.name).join(' '), [zonas])

  const filtradas = useMemo(() => {
    const q = normalizar(query.trim())
    if (!q) return faq
    return faq.filter((item) => {
      const extra = item.dinamica === 'zonas-delivery' ? ` ${zonasTexto}` : ''
      const haystack = normalizar(`${item.pregunta} ${item.respuesta}${extra}`)
      return haystack.includes(q)
    })
  }, [query, zonasTexto])

  const sinResultados = filtradas.length === 0
  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageItems = useMemo(
    () => filtradas.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filtradas, safePage],
  )

  const paginaTexto = copy.preguntas.pagina
    .replace('{actual}', String(sinResultados ? 0 : safePage + 1))
    .replace('{total}', String(sinResultados ? 0 : totalPages))

  // Fundido del fondo diagonal monte → noche al entrar/salir.
  useGSAP(
    () => {
      const bg = bgRef.current
      if (!bg) return
      gsap.killTweensOf(bg)
      gsap.to(bg, {
        opacity: active ? 1 : 0,
        duration: reduced ? motionDuration.reduced : 0.75,
        ease: motionEase.ui,
      })
    },
    { dependencies: [active, reduced] },
  )

  // Transición suave entre lista con resultados y mensaje de "sin resultados" (nunca vacío de golpe).
  useGSAP(
    () => {
      const listEl = listWrapRef.current
      const emptyEl = emptyWrapRef.current
      if (!listEl || !emptyEl) return

      gsap.killTweensOf([listEl, emptyEl])
      const dur = reduced ? motionDuration.reduced : 0.28

      if (sinResultados) {
        gsap.to(listEl, {
          opacity: 0,
          duration: dur * 0.7,
          ease: motionEase.ui,
          onComplete: () => {
            gsap.set(listEl, { display: 'none' })
          },
        })
        gsap.set(emptyEl, { display: 'block' })
        gsap.fromTo(
          emptyEl,
          { opacity: 0, y: reduced ? 0 : 8 },
          { opacity: 1, y: 0, duration: dur, ease: motionEase.ui },
        )
      } else {
        gsap.to(emptyEl, {
          opacity: 0,
          duration: dur * 0.6,
          ease: motionEase.ui,
          onComplete: () => {
            gsap.set(emptyEl, { display: 'none' })
          },
        })
        gsap.set(listEl, { display: 'block' })
        gsap.to(listEl, { opacity: 1, duration: dur, ease: motionEase.ui })
      }
    },
    { dependencies: [sinResultados, reduced] },
  )

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery)
    setPage(0)
    setOpenQuestion(null)
  }

  const goPrevPage = () => {
    setOpenQuestion(null)
    setPage((prev) => Math.max(0, Math.min(prev, totalPages - 1) - 1))
  }

  const goNextPage = () => {
    setOpenQuestion(null)
    setPage((prev) => Math.min(totalPages - 1, Math.min(prev, totalPages - 1) + 1))
  }

  return (
    <div className="absolute inset-0">
      {/* Fondo: diagonales monte → noche dentro del inset del marco abierto (ref. 10) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[clamp(12px,1.6vw,28px)] overflow-hidden"
      >
        <div data-open-text className="absolute -inset-6">
          <div
            ref={bgRef}
            className="size-full opacity-0 [background:linear-gradient(128deg,var(--color-monte)_0%,color-mix(in_srgb,var(--color-monte)_78%,var(--color-noche))_42%,var(--color-noche)_88%),linear-gradient(218deg,color-mix(in_srgb,var(--color-hoja)_34%,transparent)_0%,transparent_52%)]"
          />
        </div>
      </div>

      <div
        data-stage-scroller
        className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain [touch-action:pan-y]"
      >
        <div className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col justify-between gap-6 px-[clamp(1.25rem,3.5vw,3.5rem)] pt-22 pb-22 landscape:lg:pt-26 landscape:lg:pb-20">
          {/* Cabecera: título + bajada con links reales a la izq., buscador en píldora a la der. */}
          <div className="flex flex-col gap-5 landscape:lg:flex-row landscape:lg:items-start landscape:lg:justify-between landscape:lg:gap-8">
            <div className="max-w-xl">
              <div data-open-text>
                <Reveal
                  as="h2"
                  mode="words"
                  active={active}
                  delay={0.05}
                  className="font-serif text-[clamp(1.65rem,3vw,2.75rem)] leading-[1.06] text-champan"
                >
                  {copy.preguntas.titulo}
                </Reveal>
              </div>

              <div data-open-text className="mt-3">
                <SlideIn from="left" active={active} delay={0.14}>
                  <BajadaConLinks />
                </SlideIn>
              </div>
            </div>

            {/* Buscador en píldora (ref. 10) */}
            <div data-open-text className="w-full shrink-0 landscape:lg:w-80">
              <SlideIn from="right" active={active} delay={0.18}>
                <div className="flex h-12 items-center gap-2 rounded-full border border-champan/20 bg-tizon/75 pr-2 pl-5 backdrop-blur-md transition-colors focus-within:border-oro">
                  <input
                    ref={inputRef}
                    type="search"
                    data-preguntas-buscar
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder={copy.preguntas.buscar}
                    aria-label={copy.preguntas.buscar}
                    className="w-full min-w-0 bg-transparent font-ui text-ui text-champan placeholder:text-ceniza focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                  />
                  <button
                    type="button"
                    data-preguntas-limpiar
                    aria-label={query ? siteConfig.botones.cerrar : copy.preguntas.buscar}
                    onClick={() => {
                      if (query) {
                        handleQueryChange('')
                      } else {
                        inputRef.current?.focus()
                      }
                    }}
                    className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-champan/10 text-champan transition-colors duration-200 hover:bg-oro hover:text-noche focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
                  >
                    {query ? (
                      <X className="size-4" aria-hidden="true" />
                    ) : (
                      <Search className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </SlideIn>
            </div>
          </div>

          {/* Cuerpo: acordeón de 3 preguntas por página o mensaje de sin resultados con fundido */}
          <div data-open-text className="my-auto py-2">
            <SlideIn from="left" active={active} delay={0.24}>
              <div className="relative min-h-[14rem]">
                <div ref={listWrapRef} data-preguntas-lista>
                  <ul className="border-t border-champan/15">
                    {SLOTS.map((slotIdx) => {
                      const item = pageItems[slotIdx]
                      const isOpen = !!item && openQuestion === item.pregunta
                      return (
                        <AccordionRow
                          key={slotIdx}
                          slotIndex={slotIdx}
                          item={item}
                          isOpen={isOpen}
                          onToggle={() => {
                            if (!item) return
                            setOpenQuestion((prev) => (prev === item.pregunta ? null : item.pregunta))
                          }}
                          zonas={zonas}
                          reduced={reduced}
                        />
                      )
                    })}
                  </ul>
                </div>

                <div
                  ref={emptyWrapRef}
                  data-preguntas-vacio
                  style={{ display: 'none', opacity: 0 }}
                  className="rounded-2xl border border-champan/15 bg-tizon/65 px-6 py-10 text-center backdrop-blur-md"
                >
                  <p className="font-serif text-subtitulo italic text-champan">
                    {copy.preguntas.sinResultados}
                  </p>
                </div>
              </div>
            </SlideIn>
          </div>

          {/* Pie: paginación "1 / 4" con botones circulares */}
          <div data-open-text className="flex items-center justify-center gap-4">
            <SlideIn from="right" active={active} delay={0.3}>
              <div className="inline-flex items-center gap-4">
                <button
                  type="button"
                  data-preguntas-prev
                  onClick={goPrevPage}
                  disabled={sinResultados || safePage <= 0}
                  aria-label="Página anterior"
                  className="grid size-11 cursor-pointer place-items-center rounded-full border border-champan/25 bg-tizon/65 text-champan transition-colors duration-200 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-champan/25 disabled:hover:text-champan"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>

                <span
                  data-preguntas-pagina
                  aria-live="polite"
                  className="min-w-[3.75rem] text-center font-ui text-ui font-semibold tabular-nums text-champan"
                >
                  {paginaTexto}
                </span>

                <button
                  type="button"
                  data-preguntas-next
                  onClick={goNextPage}
                  disabled={sinResultados || safePage >= totalPages - 1}
                  aria-label="Página siguiente"
                  className="grid size-11 cursor-pointer place-items-center rounded-full border border-champan/25 bg-tizon/65 text-champan transition-colors duration-200 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-champan/25 disabled:hover:text-champan"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
  )
}
