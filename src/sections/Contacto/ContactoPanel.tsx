import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowUp, Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { SocialIcon } from '@/components/icons/social'
import { googleMapsUrl, siteConfig } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { describirDiaDistinto, estadoCocina, estadoLocal, resumirHorario } from '@/data/estado'
import { useLocal } from '@/data/useLocal'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { Reveal, SlideIn } from '@/motion/primitives'
import { useReducedMotion } from '@/motion/useReducedMotion'
import { useStage } from '@/stage/StageProvider'

const LazyContactoMapa = lazy(() => import('./ContactoMapa'))

/**
 * 05 CONTACTO (§8, ref. 05).
 * - Arriba izq.: etiqueta en Caslon cursiva "Te esperamos. Desde 2011." en bloque `champan`.
 * - Tarjeta `champan`: nombre y bajada; dirección, teléfono ("Pedidos por teléfono"), email y
 *   botón "Cómo llegar" (Google Maps con coordenadas de `site.config.ts`); horario semanal,
 *   próximo día distinto, estado en vivo y estado de cocina desde el endpoint.
 * - Fondo completo dentro del marco: mapa Leaflet con carga diferida (solo cuando CONTACTO está
 *   por mostrarse), teselas OSM oscuras, marcador SVG dorado con forma del marco inclinado y
 *   atribución OSM visible.
 * - Abajo izq.: redes en círculos (`siteConfig.redes`) y "Volver al inicio" (va al panel 00 HOME).
 */

type Props = {
  active: boolean
  onVolverAlInicio: () => void
}

const CONTACTO_INDEX = 5

export function ContactoPanel({ active, onVolverAlInicio }: Props) {
  const { state } = useStage()
  const localState = useLocal()
  const reduced = useReducedMotion()
  const mapWrapRef = useRef<HTMLDivElement | null>(null)

  const porMostrarse =
    active ||
    ((state.mode === 'open' || state.mode === 'opening') &&
      (state.activeIndex === CONTACTO_INDEX || state.transition?.to === CONTACTO_INDEX))

  const [shouldLoadMap, setShouldLoadMap] = useState(porMostrarse)

  useEffect(() => {
    if (porMostrarse && !shouldLoadMap) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldLoadMap(true)
    }
  }, [porMostrarse, shouldLoadMap])

  // Fundido del contenedor del mapa al entrar/salir de CONTACTO.
  useGSAP(
    () => {
      const wrap = mapWrapRef.current
      if (!wrap) return
      gsap.killTweensOf(wrap)
      gsap.to(wrap, {
        opacity: active ? 1 : 0,
        duration: reduced ? motionDuration.reduced : 0.75,
        ease: motionEase.ui,
      })
    },
    { dependencies: [active, shouldLoadMap, reduced] },
  )

  const ready = localState.status === 'ready' ? localState.data : null
  const local = ready?.local ?? null
  const menu = ready?.menu ?? null

  const nombreLocal = local?.name ?? siteConfig.marca.wordmark[0]
  const direccion = local?.address ?? ''
  const fraseEstado = local ? estadoLocal(local) : ''
  const fraseCocina = local && menu ? estadoCocina(menu.orders, local.time_zone) : null
  const filasHorario = local ? resumirHorario(local.weekly) : []
  const proximoEspecial = local?.special_days[0]
    ? describirDiaDistinto(local.special_days[0])
    : null

  return (
    <div className="absolute inset-0">
      {/* Mapa Leaflet diferido ocupando todo el fondo dentro del inset del marco abierto */}
      <div className="pointer-events-auto absolute inset-[clamp(12px,1.6vw,28px)] isolate z-0 overflow-hidden">
        <div ref={mapWrapRef} data-open-text className="isolate size-full opacity-0">
          {shouldLoadMap ? (
            <Suspense fallback={<div className="size-full bg-tizon" />}>
              <LazyContactoMapa active={active} />
            </Suspense>
          ) : null}
        </div>
      </div>

      {/* Contenido superpuesto a la izquierda (pointer-events-none en el contenedor para no tapar el mapa) */}
      <div
        data-stage-scroller
        className="pointer-events-none absolute inset-0 z-10 overflow-x-hidden overflow-y-auto overscroll-contain [touch-action:pan-y]"
      >
        <div className="relative z-10 mx-auto flex min-h-full max-w-7xl flex-col justify-end gap-3 px-[clamp(1rem,3vw,3rem)] pt-36 pb-16 sm:gap-4 landscape:lg:justify-center landscape:lg:gap-5 landscape:lg:pt-24 landscape:lg:pb-20">
          {/* Arriba izq.: etiqueta en Caslon cursiva "Te esperamos. Desde 2011." (ref. 05) */}
          <div data-open-text className="pointer-events-auto w-fit">
            <SlideIn from="left" active={active} delay={0.06}>
              <div className="bg-champan px-4 py-2 text-noche shadow-md sm:px-5 sm:py-2.5">
                <Reveal
                  as="p"
                  mode="words"
                  active={active}
                  delay={0.1}
                  className="font-serif text-cuerpo italic text-noche sm:text-subtitulo"
                >
                  {copy.contacto.etiqueta}
                </Reveal>
              </div>
            </SlideIn>
          </div>

          {/* Tarjeta champan con datos del local, horarios y estado en vivo (ref. 05) */}
          <div data-open-text className="pointer-events-auto w-full max-w-2xl">
            <SlideIn from="left" active={active} delay={0.16}>
              <article
                data-contacto-tarjeta
                className="bg-champan p-4 text-noche shadow-2xl sm:p-6 landscape:lg:p-7"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  {/* Columna 1: marca, dirección, teléfono, email y Cómo llegar */}
                  <div className="flex flex-col justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-subtitulo leading-tight font-bold uppercase tracking-wide text-noche">
                        {nombreLocal}
                      </h2>
                      <p className="font-serif text-etiqueta italic text-monte">
                        {siteConfig.marca.bajada}
                      </p>

                      <ul className="mt-3 space-y-2 font-ui text-etiqueta text-noche/90 sm:mt-4 sm:text-ui">
                        {direccion && (
                          <li className="flex items-start gap-2.5">
                            <MapPin
                              className="mt-0.5 size-4 shrink-0 text-monte"
                              aria-hidden="true"
                            />
                            <span data-contacto-direccion>{direccion}</span>
                          </li>
                        )}

                        <li className="flex items-start gap-2.5">
                          <Phone className="mt-0.5 size-4 shrink-0 text-monte" aria-hidden="true" />
                          <div>
                            <span className="block text-[0.6875rem] font-semibold uppercase tracking-wider text-noche/60">
                              {copy.contacto.telefono}
                            </span>
                            <a
                              data-contacto-telefono
                              href={`tel:${siteConfig.contacto.telefono.tel}`}
                              className="font-semibold text-noche underline decoration-oro/70 underline-offset-2 transition-colors hover:text-monte"
                            >
                              {siteConfig.contacto.telefono.mostrar}
                            </a>
                          </div>
                        </li>

                        <li className="flex items-center gap-2.5">
                          <Mail className="size-4 shrink-0 text-monte" aria-hidden="true" />
                          <a
                            data-contacto-email
                            href={`mailto:${siteConfig.contacto.email}`}
                            className="truncate font-semibold text-noche underline decoration-oro/70 underline-offset-2 transition-colors hover:text-monte"
                          >
                            {siteConfig.contacto.email}
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-1">
                      <a
                        data-contacto-como-llegar
                        href={googleMapsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-monte px-4 py-2 font-ui text-etiqueta font-semibold uppercase tracking-[0.12em] text-champan transition-colors duration-200 hover:bg-hoja focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monte"
                      >
                        <Navigation className="size-3.5 text-oro" aria-hidden="true" />
                        <span>{siteConfig.botones.comoLlegar}</span>
                      </a>
                    </div>
                  </div>

                  {/* Columna 2: estado en vivo, cocina, horario semanal y próximo día distinto */}
                  <div className="flex flex-col justify-between gap-2.5 border-t border-noche/15 pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 shrink-0 text-monte" aria-hidden="true" />
                        <h3 className="font-ui text-etiqueta font-bold uppercase tracking-[0.14em] text-noche">
                          {copy.contacto.horario}
                        </h3>
                      </div>

                      {fraseEstado && (
                        <p
                          data-contacto-estado
                          className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-monte px-3 py-1 font-ui text-[0.6875rem] font-semibold text-champan"
                        >
                          <span
                            aria-hidden="true"
                            className={`size-2 rounded-full ${
                              local?.open_now ? 'bg-oro' : 'bg-ceniza'
                            }`}
                          />
                          <span>{fraseEstado}</span>
                        </p>
                      )}

                      {fraseCocina && (
                        <p
                          data-contacto-cocina
                          className="mt-1 font-ui text-[0.6875rem] font-semibold text-monte"
                        >
                          {fraseCocina}
                        </p>
                      )}

                      <dl
                        data-contacto-horario
                        className="mt-2.5 space-y-1 font-ui text-[0.75rem] text-noche/90 sm:text-etiqueta"
                      >
                        {filasHorario.map((fila) => (
                          <div key={fila.dias} className="flex justify-between gap-2">
                            <dt className="font-semibold text-noche/75">{fila.dias}</dt>
                            <dd className="text-right tabular-nums">{fila.franjas}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    {proximoEspecial && (
                      <p
                        data-contacto-proximo
                        className="border-t border-noche/15 pt-2 font-ui text-[0.6875rem] text-noche/75"
                      >
                        <span className="font-semibold uppercase tracking-wider text-noche">
                          {copy.contacto.proximoDistinto}:{' '}
                        </span>
                        <span>{proximoEspecial}</span>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </SlideIn>
          </div>

          {/* Abajo izq.: redes en círculos y botón "Volver al inicio" (ref. 05) */}
          <div data-open-text className="pointer-events-auto flex flex-wrap items-center gap-3">
            <SlideIn from="left" active={active} delay={0.26}>
              <div className="flex flex-wrap items-center gap-4">
                <ul className="flex items-center gap-2">
                  {siteConfig.redes.map((item) => (
                    <li key={item.red}>
                      <a
                        data-contacto-red={item.red}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.red}
                        className="grid size-10 cursor-pointer place-items-center rounded-full border border-champan/25 bg-tizon/85 text-champan backdrop-blur-md transition-colors duration-200 hover:border-oro hover:bg-oro hover:text-noche focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
                      >
                        <SocialIcon red={item.red} className="size-4" />
                      </a>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  data-contacto-inicio
                  onClick={onVolverAlInicio}
                  className="group inline-flex cursor-pointer items-center gap-3 rounded-full border border-champan/25 bg-tizon/85 pr-4 font-ui text-etiqueta font-semibold uppercase tracking-[0.14em] text-champan backdrop-blur-md transition-colors duration-200 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro"
                >
                  <span className="grid size-10 place-items-center rounded-full border border-champan/40 bg-noche/75 transition-colors duration-300 group-hover:border-oro group-hover:bg-oro group-hover:text-noche">
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </span>
                  <span>{siteConfig.botones.volverAlInicio}</span>
                </button>
              </div>
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
  )
}
