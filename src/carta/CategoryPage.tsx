import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import Lenis from 'lenis'
import { navegar } from '@/app/router'
import { cargarCartaOverlay, precargar } from '@/carta/cargas'
import { navegarACategoria, volverALaCarta } from '@/carta/navegacion'
import { Polaroid, type PuntoClic } from '@/carta/Polaroid'
import { useWipeTransition } from '@/carta/WipeTransition'
import { MenuButton } from '@/components/MenuButton'
import { Picture } from '@/components/Picture'
import { useTopeTitulo } from '@/components/useAjusteAncho'
import { siteConfig } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { categoriasCarta, portadaDeSlug, type PlatoCarta } from '@/content/editorial'
import { resumirHorario } from '@/data/estado'
import { formatPrecio } from '@/data/format'
import { retryLocal, useLocal } from '@/data/useLocal'
import { gsap } from '@/motion/gsap'
import { Reveal } from '@/motion/primitives'
import { useReducedMotion } from '@/motion/useReducedMotion'

/**
 * Página de categoría `/carta/:slug` (§9, ref. 11).
 * - Fondo `monte`, texto `champan`, precios `oro`, separadores 1px `hoja`.
 * - Barra superior en píldora centrada con "← Categorías" (reabre `/carta`), wordmark
 *   Caslon de dos líneas (→ `/#home`) y el botón MENU (reabre `/carta`).
 * - Portada a lo ancho (~60vh, oscurecida) con número y nombre gigantes.
 * - Debajo: nombre de categoría + horario semanal del repositorio a la derecha; grupos
 *   en dos columnas (una en mobile).
 * - Cada plato: NOMBRE (clickeable solo si tiene foto) + porción (solo si existe) + línea
 *   punteada + precio en centavos (`formatPrecio`); descripción en `ceniza`; alérgenos como
 *   marcas chicas con leyenda al pie; sin stock hoy atenuado con precio tachado suave y
 *   "No hay hoy" visible.
 * - Si la categoría no existe o está vacía: muestra aviso y vuelve sola a `/carta` con el barrido.
 * - Scroll suavizado con Lenis solo en esta página (se crea al montar y se destruye al desmontar).
 */

/** Cuánto queda a la vista el aviso de categoría inexistente antes de volver a la carta. */
const AVISO_SEGUNDOS = 1.8

function PlatoItem({
  plato,
  onAbrirFoto,
}: {
  plato: PlatoCarta
  onAbrirFoto: (platoId: string, e: MouseEvent<HTMLButtonElement>) => void
}) {
  const tieneFoto = plato.foto !== null
  const disponible = plato.available

  return (
    <li
      data-plato={plato.id}
      data-disponible={disponible ? 'true' : 'false'}
      data-con-foto={tieneFoto ? 'true' : 'false'}
      className="border-b border-hoja py-5"
    >
      <div className="flex items-baseline gap-2">
        {tieneFoto ? (
          <button
            type="button"
            data-plato-abrir={plato.id}
            aria-haspopup="dialog"
            onClick={(e) => onAbrirFoto(plato.id, e)}
            className={`toque-linea cursor-pointer text-left font-ui text-ui font-bold uppercase tracking-[0.06em] ${disponible ? 'text-champan' : 'text-ceniza'} underline decoration-oro/60 decoration-1 underline-offset-4 transition-colors duration-200 hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro`}
          >
            {plato.name}
          </button>
        ) : (
          <span
            data-plato-nombre={plato.id}
            className={`font-ui text-ui font-bold uppercase tracking-[0.06em] ${disponible ? 'text-champan' : 'text-ceniza'}`}
          >
            {plato.name}
          </span>
        )}

        {plato.porcion ? (
          <span
            data-plato-porcion
            className="shrink-0 font-ui text-etiqueta tracking-normal text-ceniza"
          >
            ({plato.porcion})
          </span>
        ) : null}

        <span aria-hidden="true" className="min-w-3 flex-1 border-b border-dotted border-hoja" />

        <span
          data-plato-precio
          className={`shrink-0 font-ui text-ui font-bold tabular-nums ${
            disponible ? 'text-oro' : 'text-ceniza line-through decoration-ceniza decoration-1'
          }`}
        >
          {formatPrecio(plato.price_cents)}
        </span>
      </div>

      {plato.description || plato.allergens.length > 0 || !disponible ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {plato.description ? (
            <p data-plato-descripcion className="font-ui text-ui text-ceniza">
              {plato.description}
            </p>
          ) : null}

          {plato.allergens.length > 0 ? (
            <span className="inline-flex flex-wrap items-center gap-1" data-plato-alergenos>
              {plato.allergens.map((a) => {
                const info = copy.alergenos[a]
                return (
                  <abbr
                    key={a}
                    data-alergeno={a}
                    title={info?.nombre ?? a}
                    className="rounded-sm border border-hoja bg-tizon/45 px-1.5 py-0.5 font-ui text-micro font-semibold uppercase tracking-[0.08em] text-champan/85 no-underline"
                  >
                    {info?.marca ?? a}
                  </abbr>
                )
              })}
            </span>
          ) : null}

          {!disponible ? (
            <span
              data-plato-sin-stock
              className="inline-flex items-center rounded-full border border-oro/45 bg-tizon/75 px-2.5 py-0.5 font-ui text-micro font-semibold uppercase tracking-[0.14em] text-champan"
            >
              {copy.carta.sinStock}
            </span>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export function CategoryPage({ slug }: { slug: string }) {
  const local = useLocal()
  const reduced = useReducedMotion()
  const { transicion } = useWipeTransition()

  const lenisRef = useRef<Lenis | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const [polaroidAbierta, setPolaroidAbierta] = useState(false)
  const [polaroidIndex, setPolaroidIndex] = useState(0)
  const [origenClic, setOrigenClic] = useState<PuntoClic | null>(null)

  const categorias = useMemo(
    () => (local.data ? categoriasCarta(local.data.menu) : []),
    [local.data],
  )
  const catIndex = useMemo(
    () => categorias.findIndex((c) => c.slug === slug),
    [categorias, slug],
  )
  const categoria = catIndex >= 0 ? categorias[catIndex] : undefined
  const vacia = !!categoria && categoria.items.length === 0
  const noExiste = local.status === 'ready' && (!categoria || vacia)

  const platosConFoto = useMemo(() => {
    if (!categoria || vacia) return []
    return categoria.grupos.flatMap((g) => g.items).filter((it) => it.foto !== null)
  }, [categoria, vacia])

  const filasHorario = useMemo(
    () => (local.data ? resumirHorario(local.data.local.weekly) : []),
    [local.data],
  )

  // Leyenda: solo los alérgenos que aparecen en esta categoría (en el orden del catálogo de copy).
  const leyendaAlergenos = useMemo(() => {
    if (!categoria) return []
    const presentes = new Set(categoria.items.flatMap((it) => it.allergens))
    const conocidos = Object.keys(copy.alergenos).filter((clave) => presentes.has(clave))
    const otros = [...presentes].filter((clave) => !(clave in copy.alergenos))
    return [...conocidos, ...otros].map((clave) => {
      const info = copy.alergenos[clave]
      return { clave, marca: info?.marca ?? clave, nombre: info?.nombre ?? clave }
    })
  }, [categoria])

  const portada = categoria?.portada ?? portadaDeSlug(slug)
  const mostrarPortada = local.status === 'loading' ? !!portada : !!categoria && !vacia

  const tituloRef = useRef<HTMLDivElement | null>(null)
  useTopeTitulo(tituloRef, categoria && !vacia ? categoria.name : undefined)

  // "← Categorías" vuelve al escenario con la carta: su chunk se pide en un rato libre.
  useEffect(() => precargar(cargarCartaOverlay), [])

  // Al montar una categoría, empezar arriba de todo.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  // Lenis solo en la página de categoría: se crea al montar y se destruye al desmontar.
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: reduced ? 1 : 0.1,
      smoothWheel: !reduced,
    })
    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reduced])

  // Pausar el scroll de Lenis mientras la Polaroid está abierta.
  useEffect(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    if (polaroidAbierta) lenis.stop()
    else lenis.start()
  }, [polaroidAbierta])

  // Si la categoría no existe o está vacía: muestra el aviso y vuelve sola a /carta con el barrido.
  useEffect(() => {
    if (!noExiste) return
    const dc = gsap.delayedCall(AVISO_SEGUNDOS, () => {
      void transicion(volverALaCarta)
    })
    return () => {
      dc.kill()
    }
  }, [noExiste, transicion])

  const abrirFoto = useCallback(
    (platoId: string, e: MouseEvent<HTMLButtonElement>) => {
      const idx = platosConFoto.findIndex((p) => p.id === platoId)
      if (idx < 0) return
      const btn = e.currentTarget
      openerRef.current = btn
      const rect = btn.getBoundingClientRect()
      const x = e.clientX > 0 ? e.clientX : rect.left + rect.width / 2
      const y = e.clientY > 0 ? e.clientY : rect.top + rect.height / 2
      setOrigenClic({ x, y })
      setPolaroidIndex(idx)
      setPolaroidAbierta(true)
    },
    [platosConFoto],
  )

  const cerrarFoto = useCallback(() => {
    setPolaroidAbierta(false)
  }, [])

  const irACarta = useCallback(() => {
    void transicion(volverALaCarta)
  }, [transicion])

  const irAInicio = useCallback(() => {
    void transicion(() => navegar('/#home'))
  }, [transicion])

  const anterior =
    categorias.length > 0 && catIndex >= 0
      ? categorias[(catIndex - 1 + categorias.length) % categorias.length]
      : undefined
  const siguiente =
    categorias.length > 0 && catIndex >= 0
      ? categorias[(catIndex + 1) % categorias.length]
      : undefined

  const [linea1, linea2] = siteConfig.marca.wordmark

  const botonPildora =
    'area-tactil inline-flex cursor-pointer items-center justify-center rounded-full border border-champan/30 px-5 py-2.5 font-ui text-etiqueta font-semibold uppercase tracking-[0.14em] text-champan transition-colors duration-300 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:px-6 sm:py-3 sm:text-ui'

  return (
    <main
      data-categoria={slug}
      className="relative min-h-svh overflow-x-clip bg-monte text-champan"
    >
      <div inert={polaroidAbierta}>
        {/* Barra superior centrada estilo ref. 11: "← Categorías" · wordmark (→ HOME) · MENU */}
        <header className="sticky top-3 z-30 mx-auto max-w-4xl px-2.5 pt-[env(safe-area-inset-top)] sm:top-5 sm:px-6">
          <div className="flex items-center justify-between gap-1.5 rounded-2xl border border-champan/15 bg-tizon/75 px-2.5 py-2 backdrop-blur-md sm:gap-4 sm:px-5 sm:py-2.5">
            <button
              type="button"
              data-categoria-carta
              onClick={irACarta}
              className="area-tactil shrink-0 cursor-pointer rounded-full border border-champan/25 bg-champan/5 px-2.5 py-2 font-ui text-micro font-semibold uppercase tracking-[0.08em] text-champan transition-colors duration-200 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:px-4 sm:py-2.5 sm:text-etiqueta sm:tracking-[0.15em]"
            >
              {copy.carta.categorias}
            </button>

            <button
              type="button"
              data-categoria-wordmark
              data-categoria-inicio
              onClick={irAInicio}
              className="group area-tactil flex shrink-0 cursor-pointer flex-col justify-center text-center font-serif text-champan max-[24rem]:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro"
            >
              <span className="block text-cuerpo leading-[0.92] tracking-[0.04em] uppercase transition-colors group-hover:text-oro sm:text-subtitulo sm:tracking-[0.06em]">
                {linea1}
              </span>
              <span className="mt-0.5 block text-micro leading-none tracking-[0.1em] uppercase text-champan/80 sm:text-etiqueta sm:tracking-[0.14em]">
                {linea2}
              </span>
            </button>

            <MenuButton open={false} onToggle={irACarta} className="px-3.5 py-2.5 sm:px-7 sm:py-3" />
          </div>
        </header>

        {/* Estado de error del repositorio */}
        {local.status === 'error' ? (
          <section className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center">
            <p className="font-serif text-subtitulo text-champan">{copy.carta.error}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={retryLocal} className={botonPildora}>
                {copy.carta.reintentar}
              </button>
              <button type="button" onClick={irAInicio} className={botonPildora}>
                {siteConfig.botones.volverAlInicio}
              </button>
            </div>
          </section>
        ) : null}

        {/* Categoría inexistente o vacía: aviso visible antes de volver con barrido a /carta */}
        {noExiste ? (
          <section
            data-categoria-aviso
            className="mx-auto flex min-h-[75svh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center"
          >
            <Reveal as="p" mode="words" className="font-serif text-subtitulo text-champan">
              {copy.carta.noExiste}
            </Reveal>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={irACarta} className={botonPildora}>
                {copy.carta.volverCarta}
              </button>
              <button
                type="button"
                data-categoria-inicio
                onClick={irAInicio}
                className={botonPildora}
              >
                {siteConfig.botones.volverAlInicio}
              </button>
            </div>
          </section>
        ) : null}

        {/* Categoría válida con platos */}
        {/* Portada a lo ancho (~60vh, oscurecida) con número y nombre gigantes. La foto sale de
            editorial por slug: se ve mientras carga el repositorio (es lo primero grande). */}
        {mostrarPortada ? (
          <section
            data-categoria-portada
            className="relative -mt-18 flex min-h-[54svh] w-full items-end overflow-hidden bg-tizon pt-28 pb-10 sm:-mt-20 sm:min-h-[60svh] sm:pb-14"
          >
            {portada ? (
              <Picture
                image={portada}
                shape="banda"
                alt=""
                sizes="100vw"
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
            <div className="velo absolute inset-0" />

            {categoria && !vacia ? (
              <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-8">
                <Reveal
                  as="p"
                  mode="chars"
                  className="font-ui text-etiqueta font-semibold uppercase tracking-[0.22em] text-oro"
                >
                  {categoria.numero}
                </Reveal>
                {/* El tamaño vive en el envoltorio (tope: text-gigante); el h1 lo hereda. */}
                <div
                  ref={tituloRef}
                  className="relative mt-2 font-gigante text-display uppercase text-champan sm:text-gigante"
                >
                  <Reveal as="h1" mode="chars">
                    {categoria.name}
                  </Reveal>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {categoria && !vacia ? (
          <>
            {/* Cuerpo: cabecera con nombre + horario a la derecha, grupos en 2 columnas y leyenda */}
            <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-8 sm:pt-14 sm:pb-20">
              <div className="flex flex-col justify-between gap-4 border-b border-hoja pb-6 md:flex-row md:items-end">
                <h2
                  data-categoria-subtitulo
                  className="font-gigante text-titulo uppercase tracking-[0.06em] text-champan"
                >
                  {categoria.name}
                </h2>

                {filasHorario.length > 0 ? (
                  <dl
                    data-categoria-horario
                    className="flex flex-wrap gap-x-5 gap-y-1 font-ui text-etiqueta tracking-[0.12em] uppercase text-ceniza md:justify-end"
                  >
                    {filasHorario.map((f) => (
                      <div key={f.dias} className="inline-flex flex-wrap items-baseline gap-x-1.5">
                        <dt className="font-semibold text-champan/85">{f.dias}:</dt>
                        <dd className="whitespace-nowrap tabular-nums">{f.franjas}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>

              {/* Grupos e ítems: 2 columnas en desktop, 1 en mobile (ref. 11) */}
              {categoria.grupos.length > 1 ? (
                <div
                  data-categoria-grupos
                  className="mt-10 grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2"
                >
                  {categoria.grupos.map((grupo, gi) => (
                    <div key={grupo.nombre ?? gi} data-categoria-grupo={grupo.nombre ?? ''}>
                      {grupo.nombre ? (
                        <h3 className="border-b border-hoja pb-3 font-ui text-ui font-bold uppercase tracking-[0.16em] text-oro">
                          {grupo.nombre}
                        </h3>
                      ) : null}
                      <ul>
                        {grupo.items.map((it) => (
                          <PlatoItem key={it.id} plato={it} onAbrirFoto={abrirFoto} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <ul
                  data-categoria-grupos
                  className="mt-6 grid grid-cols-1 gap-x-12 md:grid-cols-2"
                >
                  {categoria.grupos[0]?.items.map((it) => (
                    <PlatoItem key={it.id} plato={it} onAbrirFoto={abrirFoto} />
                  ))}
                </ul>
              )}

              {/* Leyenda de alérgenos al pie */}
              {leyendaAlergenos.length > 0 ? (
              <div
                data-leyenda-alergenos
                className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 font-ui text-etiqueta tracking-normal text-ceniza"
              >
                <span className="font-semibold uppercase tracking-[0.16em] text-champan/85">
                  {copy.carta.leyendaAlergenos}:
                </span>
                {leyendaAlergenos.map((a) => (
                  <span key={a.clave} data-leyenda-marca={a.clave} className="inline-flex items-center gap-1.5">
                    <span className="rounded-sm border border-hoja bg-tizon/45 px-1.5 py-0.5 text-micro font-semibold uppercase text-champan/85">
                      {a.marca}
                    </span>
                    <span>{a.nombre}</span>
                  </span>
                ))}
              </div>
              ) : null}
            </section>

            {/* Pie: "← Categoría anterior" / "Categoría siguiente →" grandes + Volver a la carta / Volver al inicio */}
            <footer className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-24">
              <div className="border-t border-hoja pt-10 sm:pt-14">
              {anterior && siguiente ? (
                <nav
                  aria-label={copy.carta.listaCategorias}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6"
                >
                  <button
                    type="button"
                    data-categoria-anterior={anterior.slug}
                    onClick={() => void transicion(() => navegarACategoria(anterior.slug))}
                    className="group flex cursor-pointer flex-col items-start justify-between gap-3 border border-hoja bg-tizon/45 p-5 text-left transition-colors duration-300 hover:border-oro sm:p-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
                  >
                    <span className="font-ui text-etiqueta font-semibold uppercase tracking-[0.16em] text-ceniza transition-colors group-hover:text-oro">
                      {copy.carta.anterior}
                    </span>
                    <span className="flex items-baseline gap-3">
                      <span className="font-ui text-etiqueta font-semibold text-oro">
                        {anterior.numero}
                      </span>
                      <span className="font-gigante text-subtitulo uppercase text-champan sm:text-titulo">
                        {anterior.name}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    data-categoria-siguiente={siguiente.slug}
                    onClick={() => void transicion(() => navegarACategoria(siguiente.slug))}
                    className="group flex cursor-pointer flex-col items-end justify-between gap-3 border border-hoja bg-tizon/45 p-5 text-right transition-colors duration-300 hover:border-oro sm:p-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
                  >
                    <span className="font-ui text-etiqueta font-semibold uppercase tracking-[0.16em] text-ceniza transition-colors group-hover:text-oro">
                      {copy.carta.siguiente}
                    </span>
                    <span className="flex items-baseline gap-3">
                      <span className="font-ui text-etiqueta font-semibold text-oro">
                        {siguiente.numero}
                      </span>
                      <span className="font-gigante text-subtitulo uppercase text-champan sm:text-titulo">
                        {siguiente.name}
                      </span>
                    </span>
                  </button>
                </nav>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
                <button
                  type="button"
                  data-categoria-volver-carta
                  onClick={irACarta}
                  className={botonPildora}
                >
                  {copy.carta.volverCarta}
                </button>
                <button
                  type="button"
                  data-categoria-pie-inicio
                  data-categoria-inicio
                  onClick={irAInicio}
                  className={botonPildora}
                >
                  {siteConfig.botones.volverAlInicio}
                </button>
              </div>
              </div>
            </footer>
          </>
        ) : null}
      </div>

      {/* Polaroid modal */}
      <Polaroid
        platos={platosConFoto}
        abierta={polaroidAbierta}
        indice={polaroidIndex}
        catIndex={catIndex >= 0 ? catIndex : 0}
        origen={origenClic}
        openerRef={openerRef}
        onCambiar={setPolaroidIndex}
        onCerrar={cerrarFoto}
      />
    </main>
  )
}
