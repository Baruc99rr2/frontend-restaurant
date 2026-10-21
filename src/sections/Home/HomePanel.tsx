import { ArrowRight } from 'lucide-react'
import { siteConfig, whatsappUrl } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { CountUp, Reveal, SlideIn } from '@/motion/primitives'

/**
 * 00 HOME en modo abierto (§8, ref. 01).
 * - Bloques `champan` con texto `noche` que entran con `SlideIn` desde la izquierda.
 * - Subtítulo con `Reveal words`.
 * - "Ver la carta" (overlay, F9) y "Reservar mesa" (WhatsApp desde config).
 * - Abajo izq.: círculo con flecha + "Conocer la casa" (va a LA CASA).
 * - Columna der.: sello + cuatro datos (placeholder de config) con `CountUp`.
 * Cada bloque animado va envuelto en `[data-open-text]`: el escenario los desvanece al salir.
 */

type Props = {
  active: boolean
  onVerCarta: () => void
  onConocerLaCasa: () => void
}

/** "12 h" → { n: 12, sufijo: ' h' }; "4,8" → { n: 4.8, decimales: 1 }. Lo que no es número queda como texto. */
function parsearDato(valor: string) {
  const m = /^([\d.,]+)(.*)$/.exec(valor)
  if (!m) return null
  const crudo = m[1] ?? ''
  const decimales = crudo.includes(',') ? (crudo.split(',')[1]?.length ?? 0) : 0
  const n = Number(crudo.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? { n, decimales, sufijo: m[2] ?? '' } : null
}

const pill =
  'inline-flex cursor-pointer items-center justify-center rounded-full px-6 py-3 font-ui text-ui font-semibold uppercase tracking-[0.14em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro'

export function HomePanel({ active, onVerCarta, onConocerLaCasa }: Props) {
  const { home, botones, marca } = siteConfig

  return (
    <div
      data-stage-scroller
      className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain [touch-action:pan-y]"
    >
      <div className="relative flex min-h-full flex-col justify-center gap-8 px-[clamp(12px,1.6vw,28px)] pt-24 pb-28 landscape:lg:gap-10 landscape:lg:pt-28 landscape:lg:pb-24">
        <div className="max-w-[min(100%,46rem)]">
          <h1 className="sr-only">
            {marca.wordmark.join(' — ')}. {copy.home.bloques.join(' ')}
          </h1>
          <div aria-hidden="true" className="flex flex-col items-start">
            {copy.home.bloques.map((bloque, i) => (
              <div key={bloque} data-open-text className="overflow-hidden">
                <SlideIn from="left" active={active} delay={i * 0.1}>
                  {/* Un bloque por línea, del ancho del texto (ref. 01). */}
                  <span className="inline-block bg-champan px-[0.18em] pt-[0.1em] pb-[0.02em] font-gigante text-[clamp(2.25rem,5.2vw,5.75rem)] leading-[0.92] whitespace-nowrap text-noche">
                    {bloque}
                  </span>
                </SlideIn>
              </div>
            ))}
          </div>

          <div data-open-text className="mt-7 ml-[clamp(0.75rem,2vw,2rem)] max-w-xl">
            <Reveal as="p" mode="words" active={active} delay={0.3} className="font-ui text-subtitulo text-champan">
              {copy.home.subtitulo}
            </Reveal>
          </div>

          <div data-open-text className="mt-8 ml-[clamp(0.75rem,2vw,2rem)]">
            <SlideIn from="left" active={active} delay={0.45} className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onVerCarta}
                className={`${pill} bg-oro text-noche hover:bg-champan`}
              >
                {botones.verCarta}
              </button>
              <a
                href={whatsappUrl(copy.reservar.mensaje)}
                target="_blank"
                rel="noreferrer"
                className={`${pill} border border-champan/30 bg-noche/40 text-champan backdrop-blur-md hover:border-oro hover:text-oro`}
              >
                {botones.reservar}
              </a>
            </SlideIn>
          </div>
        </div>

        {/* Columna derecha (lugar de los logos de la ref. 01). En vertical pasa abajo, en grilla. */}
        <div
          data-open-text
          className="landscape:lg:absolute landscape:lg:top-1/2 landscape:lg:right-[clamp(12px,1.6vw,28px)] landscape:lg:-translate-y-1/2"
        >
          <SlideIn from="right" active={active} delay={0.55}>
            <div className="flex flex-col items-start gap-5 landscape:lg:items-end">
              <p className="bg-champan px-3 py-1.5 font-ui text-etiqueta font-bold uppercase text-noche">{home.sello}</p>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-5 landscape:lg:grid-cols-1 landscape:lg:text-right">
                {home.datos.map((dato) => {
                  const p = parsearDato(dato.valor)
                  return (
                    <div key={dato.etiqueta}>
                      <dd className="font-gigante text-titulo leading-none text-champan">
                        {p ? (
                          <CountUp
                            value={active ? p.n : 0}
                            decimals={p.decimales}
                            suffix={p.sufijo}
                            duration={1.2}
                          />
                        ) : (
                          dato.valor
                        )}
                      </dd>
                      <dt className="mt-1.5 font-ui text-etiqueta uppercase text-champan/75">{dato.etiqueta}</dt>
                    </div>
                  )
                })}
              </dl>
            </div>
          </SlideIn>
        </div>

        {/* Abajo izq.: Conocer la casa. */}
        <div
          data-open-text
          className="ml-[clamp(0.75rem,2vw,2rem)] landscape:lg:absolute landscape:lg:bottom-[clamp(1.5rem,4vh,3rem)] landscape:lg:left-[clamp(12px,1.6vw,28px)]"
        >
          <SlideIn from="left" active={active} delay={0.65}>
            <button
              type="button"
              onClick={onConocerLaCasa}
              className="group inline-flex cursor-pointer items-center gap-4 font-ui text-ui font-semibold uppercase tracking-[0.14em] text-champan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro"
            >
              <span className="grid size-12 place-items-center rounded-full border border-champan/60 transition-colors duration-300 group-hover:border-oro group-hover:bg-oro group-hover:text-noche">
                <ArrowRight className="size-5" aria-hidden="true" />
              </span>
              {botones.conocerLaCasa}
            </button>
          </SlideIn>
        </div>
      </div>
    </div>
  )
}
