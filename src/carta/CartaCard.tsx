import { ArrowRight } from 'lucide-react'
import { Picture } from '@/components/Picture'
import { copy } from '@/content/copy.es'
import type { CategoriaCarta } from '@/content/editorial'

/**
 * Cartelito de la carta (§9, refs. 08–09): el marco inclinado en chico.
 * Rotación (-4° a 5°) y desplazamiento vertical fijos por índice, nunca aleatorios.
 * Frente: número + nombre. Dorso (rotateY 180°): portada, nombre y "Ver categoría".
 *
 * Capas (cada una la mueve uno solo):
 * - `li`: rotación y desplazamiento base (CSS, fijos).
 * - `[data-carta-caida]`: entrada y salida en cascada (GSAP, el overlay).
 * - `button`: leve subida con hover/foco (CSS `translate`, no choca con GSAP).
 * - `[data-carta-flip]`: la vuelta (GSAP, el overlay).
 * Todo el cartelito es un solo botón: 1er clic lo da vuelta, 2do clic entra a la categoría.
 * "Ver categoría" es parte del dorso (mismo botón), así no hay botones anidados.
 */

/** Rotación en grados por índice (entre -4 y 5). */
const ROTACIONES = [-3, 2.5, -1.5, 4, -4, 5] as const
/** Desplazamiento vertical por índice, en rem (en mobile, la mitad). */
const DESPLAZAMIENTOS = [1.75, -0.75, 2.25, -1.25, 2.75, -1.5] as const

const rotacion = (i: number) => ROTACIONES[i % ROTACIONES.length] ?? 0
const desplazamiento = (i: number) => DESPLAZAMIENTOS[i % DESPLAZAMIENTOS.length] ?? 0

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')

type Props = {
  categoria: CategoriaCarta
  index: number
  volteado: boolean
  /** Parada de Tab del grupo (foco itinerante). */
  tabStop: boolean
  onActivar: (index: number) => void
  onFoco: (index: number) => void
}

export function CartaCard({ categoria, index, volteado, tabStop, onActivar, onFoco }: Props) {
  const rot = rotacion(index)
  const desp = desplazamiento(index)

  return (
    <li
      data-carta-item={categoria.slug}
      className="w-[min(62vw,17rem)] shrink-0 snap-center translate-y-(--desp) rotate-(--rot) lg:w-auto lg:max-w-[min(17rem,calc((100svh-22rem)*0.75))] lg:flex-1 lg:translate-y-(--desp-lg)"
      style={
        {
          '--rot': `${rot}deg`,
          '--desp': `${desp / 2}rem`,
          '--desp-lg': `${desp}rem`,
        } as React.CSSProperties
      }
    >
      <div data-carta-caida className="opacity-0 will-change-transform">
        <button
          type="button"
          data-roving
          data-carta-card={categoria.slug}
          data-volteado={volteado ? '' : undefined}
          tabIndex={tabStop ? 0 : -1}
          aria-label={volteado ? fill(copy.carta.irACategoria, { categoria: categoria.name }) : `${categoria.numero} ${categoria.name}`}
          onClick={() => onActivar(index)}
          onFocus={() => onFoco(index)}
          className="group relative block aspect-[3/4] w-full cursor-pointer transition-[translate] duration-300 ease-out [perspective:1400px] hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro"
        >
          <span data-carta-flip className="relative block size-full [transform-style:preserve-3d]">
            {/* Frente */}
            <span className="absolute inset-0 flex flex-col items-center border border-champan/10 bg-[color-mix(in_oklab,var(--color-champan)_6%,var(--color-tizon))] px-3 pt-[12%] pb-[18%] text-center shadow-[0_1.5rem_3rem_-1.5rem_var(--color-noche)] transition-colors duration-300 [backface-visibility:hidden] group-hover:border-champan/25">
              <span className="font-ui text-etiqueta text-champan/80">{categoria.numero}</span>
              <span className="my-auto font-ui text-[clamp(1.05rem,1.75vw,1.9rem)] leading-[1.02] font-medium text-balance break-words uppercase text-champan">
                {categoria.name}
              </span>
            </span>

            {/* Dorso: portada con el nombre y "Ver categoría" */}
            <span className="absolute inset-0 flex flex-col items-center overflow-hidden bg-tizon px-3 pt-[12%] pb-[10%] text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {categoria.portada ? (
                <Picture
                  image={categoria.portada}
                  shape="retrato"
                  alt=""
                  sizes="(min-width: 1024px) 17vw, 62vw"
                  className="absolute inset-0 size-full object-cover"
                />
              ) : null}
              <span className="velo absolute inset-0" />
              <span className="relative font-ui text-etiqueta text-champan/90">{categoria.numero}</span>
              <span className="relative my-auto font-ui text-[clamp(1.05rem,1.75vw,1.9rem)] leading-[1.02] font-medium text-balance break-words uppercase text-champan">
                {categoria.name}
              </span>
              <span className="relative inline-flex items-center gap-2 rounded-full bg-oro px-4 py-2 font-ui text-etiqueta font-semibold uppercase text-noche transition-colors duration-300 group-hover:bg-champan">
                {copy.carta.verCategoria}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </span>
          </span>
        </button>
      </div>
    </li>
  )
}
