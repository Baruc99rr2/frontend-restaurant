// Capa editorial: lo que el backend no tiene y se diseña por cliente.
// Se une a los datos operativos por id del backend: un plato sin entrada
// editorial se muestra igual (sin foto); uno nuevo del dueño aparece solo.

import editorialJson from './editorial.json'
import { media, type MediaId } from './media.generated'
import type { MediaImage } from './media.types'
import type { MenuCategory, MenuItem, PublicMenu } from '@/data/types'

export type PanelKey = 'home' | 'la-casa' | 'platos' | 'eventos' | 'preguntas' | 'contacto'

export type Editorial = {
  medios: {
    /** Media del modo cerrado por panel. HOME usa el video. */
    escenario: Record<Exclude<PanelKey, 'home'>, string>
    laCasa: string
    platosFranja: string
    eventosFondo: string
    openGraph: string
  }
  categorias: Record<
    string,
    {
      /** El backend no tiene slug de categoría: la URL /carta/:slug sale de acá. */
      slug: string
      portada: string
      /** Grupos dentro de la categoría (el backend no los tiene). */
      grupos?: { nombre: string; platos: string[] }[]
    }
  >
  platos: Record<string, { foto?: string; porcion?: string }>
  /** Los 5 de PLATOS, en orden. */
  insignia: { plato: string; origen: string; region: string }[]
}

export const editorial: Editorial = editorialJson satisfies Editorial

export function imagen(id: string | undefined): MediaImage | null {
  if (!id) return null
  return (media.images as Record<string, MediaImage>)[id] ?? null
}

/**
 * Portada de una categoría por su slug (editorial puro): la página de categoría la muestra sin
 * esperar al repositorio (es lo primero grande que se ve).
 */
export function portadaDeSlug(slug: string): MediaImage | null {
  const e = Object.values(editorial.categorias).find((c) => c.slug === slug)
  return imagen(e?.portada)
}

export const esMediaId = (id: string): id is MediaId => id in media.images

// --- Uniones con los datos operativos -------------------------------------

export type CategoriaCarta = MenuCategory & {
  numero: string
  slug: string
  portada: MediaImage | null
  grupos: { nombre: string | null; items: PlatoCarta[] }[]
}

export type PlatoCarta = MenuItem & {
  foto: MediaImage | null
  porcion: string | null
}

const slugDe = (cat: MenuCategory) =>
  editorial.categorias[cat.id]?.slug ??
  cat.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function platoCarta(item: MenuItem): PlatoCarta {
  const e = editorial.platos[item.id]
  return { ...item, foto: imagen(e?.foto), porcion: e?.porcion ?? null }
}

/** Categorías del backend + slug, número, portada y grupos editoriales. */
export function categoriasCarta(menu: PublicMenu): CategoriaCarta[] {
  return menu.categories.map((cat, i) => {
    const e = editorial.categorias[cat.id]
    const items = cat.items.map(platoCarta)
    let grupos: CategoriaCarta['grupos'] = [{ nombre: null, items }]
    if (e?.grupos?.length) {
      const usados = new Set(e.grupos.flatMap((g) => g.platos))
      grupos = e.grupos
        .map((g) => ({ nombre: g.nombre, items: items.filter((it) => g.platos.includes(it.id)) }))
        .filter((g) => g.items.length > 0)
      // Lo que el dueño agregue y no esté en ningún grupo igual aparece.
      const sueltos = items.filter((it) => !usados.has(it.id))
      if (sueltos.length) grupos.push({ nombre: null, items: sueltos })
    }
    return { ...cat, numero: String(i).padStart(2, '0'), slug: slugDe(cat), portada: imagen(e?.portada), grupos }
  })
}

export type PlatoInsignia = PlatoCarta & { origen: string; region: string; categoria: string }

/** Los platos de PLATOS que existen en la carta de hoy (los que faltan se omiten). */
export function platosInsignia(menu: PublicMenu): PlatoInsignia[] {
  const out: PlatoInsignia[] = []
  for (const ins of editorial.insignia) {
    for (const cat of menu.categories) {
      const item = cat.items.find((it) => it.id === ins.plato)
      if (item) out.push({ ...platoCarta(item), origen: ins.origen, region: ins.region, categoria: cat.name })
    }
  }
  return out
}
