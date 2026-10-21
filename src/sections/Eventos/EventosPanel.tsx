import { useMemo, useState } from 'react'
import { Mail, Minus, Plus } from 'lucide-react'
import { teclaRoving } from '@/components/roving'
import { siteConfig } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import {
  calcularEvento,
  clampInvitados,
  formatos,
  invitados,
  mailtoEventoUrl,
  ocasiones,
  redondearPlata,
  whatsappEventoUrl,
  type FormatoId,
  type OcasionId,
  type Seleccion,
} from '@/content/eventos'
import { formatPrecio } from '@/data/format'
import { CountUp, Reveal, SlideIn, WipeSwap } from '@/motion/primitives'

/**
 * 03 EVENTOS — Nuestros servicios (§8, ref. 04).
 * Calculadora de catering que habla del restaurante:
 * - Fondo: foto Restaurante 3 (`r3` en `StageMedia` + `velo`) oscurecida con veta cálida.
 * - Título: "Armá tu evento y te decimos cuánto fuego hace falta."
 * - Izq., controles estilo ref. 04 (etiqueta en píldora `champan` + stepper/chips oscuros):
 *   - Invitados: 10–200, paso 5, inicial 40.
 *   - Ocasión (chips): Día de la Madre, Día del Padre, Navidad, Año Nuevo, Cumpleaños, Empresa.
 *   - Formato (chips): Cóctel, Mesa servida, Asado a la vista.
 * - Der., 6 tarjetas `champan` con número en `monte` (`CountUp`) y etiqueta (`WipeSwap`).
 * - Nota orientativa y botón "Pedir presupuesto" que abre `wa.me` con el resumen URL-encoded
 *   (más alternativa `mailto:`).
 * La veta (`EventosFondo`) la monta el escenario en la capa del panel, sobre la foto: entra y
 * sale con ella.
 */

/** Fondo de EVENTOS en modo abierto: veta cálida diagonal sobre la foto r3 oscurecida (ref. 04). */
export function EventosFondo() {
  return (
    <div className="absolute inset-0 [background:radial-gradient(ellipse_75%_55%_at_62%_38%,color-mix(in_srgb,var(--color-oro)_26%,transparent)_0%,color-mix(in_srgb,var(--color-oro)_14%,var(--color-hoja)_22%)_48%,color-mix(in_srgb,var(--color-monte)_30%,transparent)_80%)]" />
  )
}

type Props = {
  active: boolean
}

const formatPlataCard = (cents: number) => formatPrecio(redondearPlata(cents))
const formatNumeroCard = (n: number) =>
  n.toLocaleString(siteConfig.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })

export function EventosPanel({ active }: Props) {
  const [cantidad, setCantidad] = useState<number>(invitados.inicial)
  const [ocasion, setOcasion] = useState<OcasionId>(ocasiones[0].id)
  const [formato, setFormato] = useState<FormatoId>(formatos[0].id)

  const seleccion: Seleccion = useMemo(
    () => ({ invitados: cantidad, ocasion, formato }),
    [cantidad, ocasion, formato],
  )

  const resultados = useMemo(() => calcularEvento(seleccion), [seleccion])
  const waHref = useMemo(() => whatsappEventoUrl(seleccion), [seleccion])
  const mailHref = useMemo(() => mailtoEventoUrl(seleccion), [seleccion])

  const restarInvitados = () => {
    setCantidad((prev) => clampInvitados(prev - invitados.paso))
  }

  const sumarInvitados = () => {
    setCantidad((prev) => clampInvitados(prev + invitados.paso))
  }

  const minAlcanzado = cantidad <= invitados.min
  const maxAlcanzado = cantidad >= invitados.max

  return (
    <div className="absolute inset-0">
      <div
        data-stage-scroller
        className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain [touch-action:pan-y]"
      >
        <div className="relative z-10 mx-auto flex min-h-full max-w-7xl flex-col justify-center gap-5 px-[clamp(1.25rem,3.5vw,3.5rem)] pt-20 pb-20 landscape:lg:grid landscape:lg:grid-cols-[minmax(22rem,1.08fr)_minmax(25rem,1.22fr)] landscape:lg:items-center landscape:lg:gap-10 landscape:lg:pt-24 landscape:lg:pb-20">
          {/* Columna izquierda: título, controles estilo ref. 04, nota y CTA */}
          <div className="flex flex-col gap-4 landscape:lg:gap-5">
            <div data-open-text className="max-w-xl">
              <Reveal
                as="h2"
                mode="words"
                active={active}
                delay={0.05}
                className="font-serif text-[clamp(1.5rem,2.8vw,2.65rem)] leading-[1.08] text-champan"
              >
                {copy.eventos.titulo}
              </Reveal>
            </div>

            {/* 1. Invitados: etiqueta en píldora champan + stepper oscuro (10–200, paso 5, inicial 40) */}
            <div data-open-text>
              <SlideIn from="left" active={active} delay={0.12}>
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  <div className="flex h-11 min-w-[8.5rem] items-center justify-end rounded-r-full bg-champan pr-5 pl-4 font-ui text-ui font-semibold text-noche sm:h-12 sm:min-w-[11rem] sm:pr-6">
                    <span>{copy.eventos.etiquetas.invitados}</span>
                  </div>

                  <div
                    role="group"
                    aria-label={copy.eventos.etiquetas.invitados}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-champan/20 bg-tizon/90 px-1.5 backdrop-blur-md sm:h-12 sm:gap-3 sm:px-2"
                  >
                    <button
                      type="button"
                      data-eventos-menos
                      onClick={restarInvitados}
                      disabled={minAlcanzado}
                      aria-label="Restar 5 invitados"
                      className="grid size-8 cursor-pointer place-items-center rounded-full border border-champan/25 bg-champan/10 text-champan transition-colors duration-200 hover:border-oro hover:bg-oro hover:text-noche focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-champan/25 disabled:hover:bg-champan/10 disabled:hover:text-champan sm:size-9"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>

                    <output
                      data-eventos-invitados
                      aria-live="polite"
                      className="min-w-[3.25rem] text-center font-ui text-subtitulo font-bold tabular-nums text-champan"
                    >
                      {cantidad}
                    </output>

                    <button
                      type="button"
                      data-eventos-mas
                      onClick={sumarInvitados}
                      disabled={maxAlcanzado}
                      aria-label="Sumar 5 invitados"
                      className="grid size-8 cursor-pointer place-items-center rounded-full border border-champan/25 bg-champan/10 text-champan transition-colors duration-200 hover:border-oro hover:bg-oro hover:text-noche focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-champan/25 disabled:hover:bg-champan/10 disabled:hover:text-champan sm:size-9"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </SlideIn>
            </div>

            {/* 2. Ocasión: etiqueta en píldora champan + 6 chips */}
            <div data-open-text>
              <SlideIn from="left" active={active} delay={0.2}>
                <div className="flex flex-col gap-2">
                  <div className="inline-flex w-fit items-center rounded-r-full bg-champan py-1.5 pr-4 pl-3.5 font-ui text-etiqueta font-bold uppercase tracking-[0.14em] text-noche">
                    {copy.eventos.etiquetas.ocasion}
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={copy.eventos.etiquetas.ocasion}
                    onKeyDown={(e) =>
                      teclaRoving(
                        e,
                        ocasiones.findIndex((o) => o.id === ocasion),
                        ocasiones.length,
                        (i) => setOcasion(ocasiones[i]?.id ?? ocasion),
                      )
                    }
                    className="flex flex-wrap gap-1.5 sm:gap-2"
                  >
                    {ocasiones.map((o) => {
                      const isSelected = ocasion === o.id
                      return (
                        <button
                          key={o.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          data-eventos-ocasion={o.id}
                          onClick={() => setOcasion(o.id)}
                          className={`cursor-pointer rounded-full border px-3 py-1.5 font-ui text-etiqueta font-semibold uppercase tracking-[0.1em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:px-3.5 sm:py-2 ${
                            isSelected
                              ? 'border-oro bg-oro text-noche'
                              : 'border-champan/25 bg-tizon/85 text-champan hover:border-oro hover:text-oro'
                          }`}
                        >
                          {o.nombre}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </SlideIn>
            </div>

            {/* 3. Formato: etiqueta en píldora champan + 3 chips */}
            <div data-open-text>
              <SlideIn from="left" active={active} delay={0.28}>
                <div className="flex flex-col gap-2">
                  <div className="inline-flex w-fit items-center rounded-r-full bg-champan py-1.5 pr-4 pl-3.5 font-ui text-etiqueta font-bold uppercase tracking-[0.14em] text-noche">
                    {copy.eventos.etiquetas.formato}
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={copy.eventos.etiquetas.formato}
                    onKeyDown={(e) =>
                      teclaRoving(
                        e,
                        formatos.findIndex((f) => f.id === formato),
                        formatos.length,
                        (i) => setFormato(formatos[i]?.id ?? formato),
                      )
                    }
                    className="flex flex-wrap gap-1.5 sm:gap-2"
                  >
                    {formatos.map((f) => {
                      const isSelected = formato === f.id
                      return (
                        <button
                          key={f.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          data-eventos-formato={f.id}
                          onClick={() => setFormato(f.id)}
                          className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-ui text-etiqueta font-semibold uppercase tracking-[0.1em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:px-4 sm:py-2 ${
                            isSelected
                              ? 'border-oro bg-oro text-noche'
                              : 'border-champan/25 bg-tizon/85 text-champan hover:border-oro hover:text-oro'
                          }`}
                        >
                          {f.nombre}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </SlideIn>
            </div>

            {/* Nota orientativa y CTA WhatsApp + alternativa mailto */}
            <div data-open-text>
              <SlideIn from="left" active={active} delay={0.36}>
                <div className="flex flex-col gap-3 pt-1">
                  <p data-eventos-nota className="font-ui text-etiqueta text-champan/80">
                    {copy.eventos.nota}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      data-eventos-whatsapp
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex cursor-pointer items-center justify-center rounded-full bg-oro px-6 py-2.5 font-ui text-etiqueta font-bold uppercase tracking-[0.15em] text-noche transition-colors duration-300 hover:bg-champan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:py-3"
                    >
                      {siteConfig.botones.pedirPresupuesto}
                    </a>
                    <a
                      data-eventos-mailto
                      href={mailHref}
                      aria-label={`${siteConfig.botones.pedirPresupuesto} (${copy.preguntas.links.email})`}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-champan/30 bg-noche/45 px-4 py-2.5 font-ui text-etiqueta font-semibold uppercase tracking-[0.12em] text-champan backdrop-blur-md transition-colors duration-300 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:py-3"
                    >
                      <Mail className="size-3.5" aria-hidden="true" />
                      <span>{copy.preguntas.links.email}</span>
                    </a>
                  </div>
                </div>
              </SlideIn>
            </div>
          </div>

          {/* Columna derecha: 6 tarjetas champan con número en monte (CountUp) y etiqueta (WipeSwap) */}
          <div data-open-text>
            <SlideIn from="right" active={active} delay={0.22}>
              <div
                data-eventos-tarjetas
                className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 landscape:lg:gap-4"
              >
                {resultados.map((r) => {
                  const isPlata = r.unidad === 'plata'
                  const isKg = r.id === 'kg'
                  return (
                    <article
                      key={r.id}
                      data-eventos-card={r.id}
                      className="flex min-h-[7.25rem] flex-col justify-between bg-champan p-3.5 text-noche shadow-lg sm:min-h-[8.5rem] sm:p-4 landscape:lg:min-h-[10.5rem] landscape:lg:p-5"
                    >
                      <div>
                        <p
                          data-eventos-area={r.id}
                          className="font-ui text-etiqueta font-semibold uppercase tracking-[0.14em] text-noche/60"
                        >
                          {r.area}
                        </p>
                        <div data-eventos-etiqueta={r.id} className="mt-1">
                          <WipeSwap
                            value={r.etiqueta}
                            as="p"
                            className="block font-ui text-etiqueta font-bold uppercase tracking-[0.08em] text-noche"
                          />
                        </div>
                      </div>

                      <div data-eventos-valor={r.id} className="mt-3">
                        <CountUp
                          as="p"
                          value={active ? r.valor : 0}
                          decimals={isKg ? 1 : 0}
                          format={isPlata ? formatPlataCard : formatNumeroCard}
                          className={`block font-gigante leading-none text-monte ${
                            isPlata
                              ? 'text-[clamp(1.15rem,1.85vw,1.75rem)]'
                              : 'text-[clamp(1.5rem,2.6vw,2.5rem)]'
                          }`}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
  )
}
