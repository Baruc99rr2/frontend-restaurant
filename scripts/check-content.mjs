// Verifica que el contenido editorial y el mock encajen entre sí:
// ids de editorial.json ↔ mock (forma del backend) ↔ catálogo de medios.
// Uso: pnpm check:content. Sale con código 1 si hay errores.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROOT } from './lib/media-module.mjs'

const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')
const mock = JSON.parse(read('mocks/public-local.json'))
const editorial = JSON.parse(read('src/content/editorial.json'))
const mediaIds = new Set([...read('src/content/media.generated.ts').matchAll(/"id": "(\w+)"/g)].map((m) => m[1]))

const errores = []
const avisos = []
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const { categories, uncategorized, daily_menu } = mock.menu
const itemsPorId = new Map()
const catDeItem = new Map()
for (const cat of categories) {
  if (!UUID.test(cat.id)) errores.push(`categoría con id no UUID: ${cat.id}`)
  for (const it of cat.items) {
    itemsPorId.set(it.id, it)
    catDeItem.set(it.id, cat.id)
  }
}
for (const it of [...uncategorized, ...daily_menu]) itemsPorId.set(it.id, it)
for (const it of itemsPorId.values()) {
  if (!UUID.test(it.id)) errores.push(`ítem con id no UUID: ${it.id}`)
  if (!Number.isInteger(it.price_cents) || it.price_cents < 0) errores.push(`precio no entero en centavos: ${it.name}`)
}

// Reglas del mock (§9): 4–7 platos por categoría, al menos uno sin stock, menú del día cargado.
for (const cat of categories) {
  if (cat.items.length < 4 || cat.items.length > 7) avisos.push(`${cat.name}: ${cat.items.length} platos (se piden 4–7)`)
}
if (![...itemsPorId.values()].some((it) => !it.available)) errores.push('ningún plato sin stock: hace falta al menos uno')
if (daily_menu.length === 0) errores.push('el mock no tiene menú del día')

const media = (id, donde) => {
  if (!mediaIds.has(id)) errores.push(`${donde}: media "${id}" no existe (¿corriste pnpm media?)`)
}

// Categorías
const slugs = new Set()
for (const [id, c] of Object.entries(editorial.categorias)) {
  const cat = categories.find((x) => x.id === id)
  if (!cat) {
    avisos.push(`editorial.categorias tiene una categoría que el backend no trae: ${id}`)
    continue
  }
  if (slugs.has(c.slug)) errores.push(`slug repetido: ${c.slug}`)
  slugs.add(c.slug)
  media(c.portada, `portada de ${cat.name}`)
  for (const g of c.grupos ?? []) {
    for (const pid of g.platos) {
      if (catDeItem.get(pid) !== id) errores.push(`grupo "${g.nombre}" de ${cat.name}: el plato ${pid} no es de esa categoría`)
    }
  }
}
for (const cat of categories) {
  if (!editorial.categorias[cat.id]) avisos.push(`${cat.name} no tiene entrada editorial (sin portada; slug derivado del nombre)`)
}
const portadas = Object.values(editorial.categorias).map((c) => c.portada)
if (new Set(portadas).size !== portadas.length) avisos.push('hay portadas de categoría repetidas')

// Platos
for (const [id, p] of Object.entries(editorial.platos)) {
  if (!itemsPorId.has(id)) avisos.push(`editorial.platos tiene un plato que el backend no trae: ${id}`)
  if (p.foto) media(p.foto, `foto de ${itemsPorId.get(id)?.name ?? id}`)
}

// Insignia
if (editorial.insignia.length !== 5) avisos.push(`PLATOS tiene ${editorial.insignia.length} platos insignia (se piden 5)`)
for (const ins of editorial.insignia) {
  const it = itemsPorId.get(ins.plato)
  if (!it) errores.push(`plato insignia que no existe: ${ins.plato}`)
  else if (!editorial.platos[ins.plato]?.foto) errores.push(`plato insignia sin foto: ${it.name}`)
}

// Medios del escenario
for (const [panel, id] of Object.entries(editorial.medios.escenario)) media(id, `escenario/${panel}`)
for (const k of ['laCasa', 'platosFranja', 'eventosFondo', 'openGraph']) media(editorial.medios[k], `medios.${k}`)

const fotosUsadas = new Set([
  ...Object.values(editorial.platos).map((p) => p.foto).filter(Boolean),
  ...portadas,
  ...Object.values(editorial.medios.escenario),
  editorial.medios.laCasa,
  editorial.medios.platosFranja,
  editorial.medios.eventosFondo,
  editorial.medios.openGraph,
])
const sinUso = [...mediaIds].filter((id) => !fotosUsadas.has(id))
if (sinUso.length) avisos.push(`fotos sin uso: ${sinUso.join(', ')}`)

console.log(`Mock: ${categories.length} categorías · ${itemsPorId.size} ítems · ${[...itemsPorId.values()].filter((i) => !i.available).length} sin stock · ${daily_menu.length} menú del día · ${mock.delivery_zones.items.length} zonas`)
console.log(`Medios en catálogo: ${mediaIds.size}`)
if (avisos.length) console.log(`Avisos:\n  - ${avisos.join('\n  - ')}`)
if (errores.length) {
  console.error(`Errores:\n  - ${errores.join('\n  - ')}`)
  process.exit(1)
}
console.log('Contenido OK')
