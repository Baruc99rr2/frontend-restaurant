import { siteConfig } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { categoriasCarta } from '@/content/editorial'
import { navegar } from '@/app/router'
import { volverALaCarta } from '@/carta/navegacion'
import { useWipeTransition } from '@/carta/WipeTransition'
import { useLocal } from '@/data/useLocal'
import { Reveal } from '@/motion/primitives'

/**
 * `/carta/:slug` — placeholder mínimo hasta F10 (§9 Página de categoría).
 * Ya usa el barrido para salir: "← Categorías" vuelve a la carta y "Volver al inicio"
 * va al escenario con HOME abierto.
 */
export function CategoryPage({ slug }: { slug: string }) {
  const local = useLocal()
  const { transicion } = useWipeTransition()
  const categoria = local.data ? categoriasCarta(local.data.menu).find((c) => c.slug === slug) : undefined
  const noExiste = local.status !== 'loading' && !categoria

  const boton =
    'inline-flex cursor-pointer items-center justify-center rounded-full border border-champan/30 px-6 py-3 font-ui text-ui font-semibold uppercase tracking-[0.14em] text-champan transition-colors duration-300 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro'

  return (
    <main data-categoria={slug} className="grid min-h-svh place-items-center bg-monte px-6 py-16 text-center text-champan">
      <div className="flex flex-col items-center gap-6">
        {categoria ? (
          <>
            <Reveal as="p" mode="chars" className="font-ui text-etiqueta text-champan/80">
              {categoria.numero}
            </Reveal>
            <Reveal as="h1" mode="chars" className="font-gigante text-display uppercase">
              {categoria.name}
            </Reveal>
          </>
        ) : null}
        {noExiste ? (
          <Reveal as="p" mode="words" className="font-serif text-subtitulo">
            {copy.carta.noExiste}
          </Reveal>
        ) : null}
        {categoria ? (
          <Reveal as="p" mode="words" delay={0.2} className="font-ui text-etiqueta uppercase text-ceniza">
            {copy.carta.enPreparacion}
          </Reveal>
        ) : null}
        {/* Los botones no dependen de los datos: están desde el principio. */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" data-categoria-carta className={boton} onClick={() => void transicion(volverALaCarta)}>
            {copy.carta.categorias}
          </button>
          <button
            type="button"
            data-categoria-inicio
            className={boton}
            onClick={() => void transicion(() => navegar('/#home'))}
          >
            {siteConfig.botones.volverAlInicio}
          </button>
        </div>
      </div>
    </main>
  )
}
