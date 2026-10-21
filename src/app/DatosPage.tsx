// Página de QA de F1 (/dev/datos, solo en desarrollo): muestra los datos del
// repositorio unidos con lo editorial y los medios generados. No es diseño final.

import { Picture } from '@/components/Picture'
import { siteConfig } from '@/config/site.config'
import { copy, paneles } from '@/content/copy.es'
import { categoriasCarta, editorial, imagen, platosInsignia, type PlatoCarta } from '@/content/editorial'
import { calcularEvento, formatos, invitados, ocasiones } from '@/content/eventos'
import { faq } from '@/content/faq'
import { media } from '@/content/media.generated'
import { describirDiaDistinto, estadoCocina, estadoLocal, resumirHorario } from '@/data/estado'
import { formatPrecio } from '@/data/format'
import { retryLocal, useLocal } from '@/data/useLocal'

function Titulo({ n, children }: { n: string; children: string }) {
  return (
    <h2 className="mb-6 flex items-baseline gap-4 border-b border-oro/40 pb-3 font-ui text-subtitulo font-semibold uppercase tracking-[0.08em]">
      <span className="text-etiqueta text-oro">{n}</span>
      {children}
    </h2>
  )
}

function Alergenos({ lista }: { lista: string[] }) {
  if (!lista.length) return null
  return (
    <span className="ml-2 inline-flex gap-1 align-middle">
      {lista.map((a) => (
        <abbr
          key={a}
          title={copy.alergenos[a]?.nombre ?? a}
          className="rounded-sm border border-ceniza/50 px-1 font-ui text-[0.625rem] font-semibold text-ceniza no-underline"
        >
          {copy.alergenos[a]?.marca ?? a}
        </abbr>
      ))}
    </span>
  )
}

function Item({ it }: { it: PlatoCarta }) {
  return (
    <li className={`flex gap-3 py-3 ${it.available ? '' : 'opacity-50'}`}>
      {it.foto ? (
        <Picture image={it.foto} shape="retrato" alt="" sizes="48px" className="h-15 w-12 shrink-0 object-cover" />
      ) : (
        <span className="h-15 w-12 shrink-0 border border-dashed border-hoja" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-ui text-ui font-semibold uppercase tracking-wide">{it.name}</span>
          {it.porcion && <span className="font-ui text-etiqueta text-ceniza">({it.porcion})</span>}
          <span className="flex-1 border-b border-dotted border-hoja" aria-hidden="true" />
          <span className={`font-ui text-ui font-semibold text-oro ${it.available ? '' : 'line-through decoration-1'}`}>
            {formatPrecio(it.price_cents)}
          </span>
        </div>
        <p className="font-ui text-ui text-ceniza">
          {it.description}
          <Alergenos lista={it.allergens} />
          {!it.available && <span className="ml-2 font-semibold text-champan">{copy.carta.sinStock}</span>}
        </p>
      </div>
    </li>
  )
}

export default function DatosPage() {
  const estado = useLocal()

  if (estado.status === 'loading') {
    return <p className="p-8 font-ui text-ui text-ceniza">Cargando datos del local…</p>
  }
  if (estado.status === 'error') {
    return (
      <div className="p-8 font-ui text-ui">
        <p>No se pudieron cargar los datos: {estado.error.message}</p>
        <button type="button" onClick={retryLocal} className="mt-4 rounded-full bg-oro px-5 py-2 text-noche">
          Reintentar
        </button>
      </div>
    )
  }

  const { local, menu, zonas } = estado.data
  const categorias = categoriasCarta(menu)
  const insignia = platosInsignia(menu)
  const cocina = estadoCocina(menu.orders, local.time_zone)
  const proximo = local.special_days[0]
  const evento = calcularEvento({ invitados: invitados.inicial, ocasion: 'cumpleanos', formato: 'asado' })

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <header className="mb-14">
        <p className="font-ui text-etiqueta font-semibold uppercase text-ceniza">QA · F1 · datos + editorial + medios</p>
        <h1 className="mt-3 font-serif text-display leading-[0.95]">{local.name}</h1>
        <p className="mt-2 font-serif text-subtitulo italic text-oro">{siteConfig.marca.bajada}</p>
      </header>

      {/* Local */}
      <section className="mb-16 grid gap-6 md:grid-cols-2">
        <div className="bg-champan p-6 text-noche">
          <p className="font-ui text-etiqueta font-semibold uppercase">GET /v1/public/{'{slug}'}</p>
          <p className="mt-3 font-ui text-subtitulo font-bold">{estadoLocal(local)}</p>
          {cocina && <p className="font-ui text-ui">{cocina}</p>}
          <p className="mt-4 font-ui text-ui">{local.address}</p>
          <p className="font-ui text-ui">
            {copy.contacto.telefono}: {siteConfig.contacto.telefono.mostrar} · {siteConfig.contacto.email}
          </p>
          {local.promotions.map((p) => (
            <p key={p.title} className="mt-4 border-t border-noche/20 pt-3 font-ui text-ui">
              <strong>{p.title}.</strong> {p.body}
            </p>
          ))}
        </div>
        <div className="border border-ceniza/25 bg-tizon p-6">
          <p className="font-ui text-etiqueta font-semibold uppercase text-ceniza">{copy.contacto.horario}</p>
          <dl className="mt-3 space-y-1 font-ui text-ui">
            {resumirHorario(local.weekly).map((f) => (
              <div key={f.dias} className="flex justify-between gap-4">
                <dt className="text-ceniza">{f.dias}</dt>
                <dd className="text-right">{f.franjas}</dd>
              </div>
            ))}
          </dl>
          {proximo && (
            <p className="mt-4 font-ui text-ui">
              <span className="text-ceniza">{copy.contacto.proximoDistinto}: </span>
              {describirDiaDistinto(proximo)}
            </p>
          )}
        </div>
      </section>

      {/* Escenario */}
      <section className="mb-16">
        <Titulo n="01">Escenario · media por panel</Titulo>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paneles.map((p, i) => {
            const img = p.key === 'home' ? null : imagen(editorial.medios.escenario[p.key])
            return (
              <li key={p.key} className="relative aspect-video overflow-hidden bg-tizon">
                {p.key === 'home' && media.video ? (
                  <video
                    className="size-full object-cover"
                    src={media.video.sources.sm.src}
                    poster={media.video.poster.sm.webp}
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  img && <Picture image={img} shape="paisaje" alt="" sizes="(min-width: 1024px) 33vw, 100vw" className="size-full object-cover" />
                )}
                <div className="velo absolute inset-0" />
                <span className="absolute left-3 top-3 font-ui text-etiqueta font-semibold text-oro">
                  {String(i).padStart(2, '0')} · {p.key === 'home' ? 'video' : editorial.medios.escenario[p.key]}
                </span>
                <span className="absolute bottom-2 left-3 font-gigante text-subtitulo text-champan">{p.titulo}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Platos insignia */}
      <section className="mb-16">
        <Titulo n="02">Platos · los de siempre</Titulo>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {insignia.map((p) => (
            <li key={p.id}>
              {p.foto && <Picture image={p.foto} shape="retrato" alt={p.name} sizes="(min-width: 768px) 20vw, 50vw" className="aspect-4/5 w-full border border-champan object-cover" />}
              <p className="mt-2 font-serif text-subtitulo leading-tight">{p.origen}</p>
              <p className="font-ui text-etiqueta uppercase text-ceniza">{p.region}</p>
              <p className="mt-1 font-ui text-ui font-semibold text-oro">{p.name}</p>
              <p className="font-ui text-etiqueta text-ceniza">
                {p.categoria} · {formatPrecio(p.price_cents)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Carta */}
      <section className="mb-16">
        <Titulo n="03">Carta · GET /menu</Titulo>
        {menu.daily_menu.map((d) => (
          <p key={d.id} className="mb-8 font-ui text-subtitulo">
            <span className="text-oro">{copy.carta.hoy}</span> {d.name} — {formatPrecio(d.price_cents)}
          </p>
        ))}
        <div className="space-y-12">
          {categorias.map((cat) => (
            <article key={cat.id} className="bg-monte">
              {cat.portada && (
                <div className="relative">
                  <Picture image={cat.portada} shape="banda" alt="" sizes="(min-width: 1152px) 1152px, 100vw" className="aspect-12/5 w-full object-cover" />
                  <div className="velo absolute inset-0" />
                  <p className="absolute bottom-3 left-4 font-gigante text-display uppercase text-champan">
                    <span className="mr-4 text-oro">{cat.numero}</span>
                    {cat.name}
                  </p>
                </div>
              )}
              <div className="p-5">
                <p className="font-ui text-etiqueta text-ceniza">/carta/{cat.slug}</p>
                <div className={`mt-2 grid gap-x-10 ${cat.grupos.length > 1 ? 'md:grid-cols-2' : ''}`}>
                  {cat.grupos.map((g, gi) => (
                    <div key={g.nombre ?? gi}>
                      {g.nombre && <p className="mt-3 font-serif text-subtitulo italic text-oro">{g.nombre}</p>}
                      <ul className={`divide-y divide-hoja ${cat.grupos.length > 1 ? '' : 'md:grid md:grid-cols-2 md:gap-x-10 md:divide-y-0'}`}>
                        {g.items.map((it) => (
                          <Item key={it.id} it={it} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
        {menu.uncategorized.length > 0 && (
          <p className="mt-6 font-ui text-ui text-ceniza">
            Sin categoría: {menu.uncategorized.map((u) => `${u.name} (${formatPrecio(u.price_cents)})`).join(' · ')}
          </p>
        )}
        <p className="mt-4 font-ui text-etiqueta text-ceniza">
          {copy.carta.leyendaAlergenos}: {Object.values(copy.alergenos).map((a) => `${a.marca} ${a.nombre}`).join(' · ')}
        </p>
      </section>

      {/* Eventos + zonas + faq */}
      <section className="mb-16 grid gap-8 md:grid-cols-3">
        <div>
          <Titulo n="04">Eventos</Titulo>
          <p className="mb-3 font-ui text-ui text-ceniza">
            {invitados.inicial} invitados · {ocasiones.find((o) => o.id === 'cumpleanos')?.nombre} · {formatos.find((f) => f.id === 'asado')?.nombre}
          </p>
          <ul className="grid grid-cols-2 gap-2">
            {evento.map((r) => (
              <li key={r.id} className="bg-champan p-3 text-noche">
                <p className="font-ui text-etiqueta uppercase">{r.area}</p>
                <p className="font-gigante text-titulo text-monte">{r.unidad === 'plata' ? formatPrecio(r.valor) : r.valor.toLocaleString(siteConfig.locale)}</p>
                <p className="font-ui text-etiqueta">{r.etiqueta}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Titulo n="05">Zonas de delivery</Titulo>
          <table className="w-full font-ui text-ui">
            <tbody>
              {zonas.map((z) => (
                <tr key={z.name} className="border-b border-ceniza/20">
                  <td className="py-1.5">{z.name}</td>
                  <td className="text-right text-oro">{formatPrecio(z.fee_cents)}</td>
                  <td className="text-right text-ceniza">mín. {formatPrecio(z.min_order_cents)}</td>
                  <td className="text-right text-ceniza">{z.eta_minutes ? `${z.eta_minutes}′` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <Titulo n="06">Preguntas</Titulo>
          <p className="font-ui text-ui text-ceniza">{faq.length} preguntas · {Math.ceil(faq.length / 3)} páginas de 3</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 font-ui text-ui">
            {faq.slice(0, 4).map((f) => (
              <li key={f.pregunta}>{f.pregunta}</li>
            ))}
            <li className="list-none text-ceniza">…</li>
          </ol>
        </div>
      </section>
    </main>
  )
}
