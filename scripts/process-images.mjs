// Procesa las fotos de content/ → public/media/img/ (AVIF + WebP) y actualiza
// src/content/media.generated.ts. Idempotente: no re-codifica una salida que
// ya existe y es más nueva que su fuente.
//
// Ids estables: restaurantN.* → rN, foodN.* → fN.
// Cada foto sale en tres formas (recorte por `attention`):
//   paisaje 16:9   lg 1920×1080 · sm 1280×720   (escenario, fondos de sección)
//   retrato 4:5    lg 900×1125  · sm 600×750    (cartelitos, polaroid, carrusel, marco inclinado)
//   banda   12:5   lg 1920×800  · sm 1280×533   (portadas de categoría)
// Nunca se agranda: si la fuente es más chica, la variante sale al máximo que
// da la fuente con esa proporción, y se avisa.
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve, extname, basename } from 'node:path'
import sharp from 'sharp'
import { CONTENT_DIR, IMAGES_MANIFEST, MEDIA_DIR, writeMediaModule } from './lib/media-module.mjs'

const OUT_DIR = resolve(MEDIA_DIR, 'img')
const PUBLIC_PREFIX = '/media/img'

const SHAPES = {
  paisaje: { ratio: 16 / 9, sizes: { lg: [1920, 1080], sm: [1280, 720] } },
  retrato: { ratio: 4 / 5, sizes: { lg: [900, 1125], sm: [600, 750] } },
  banda: { ratio: 12 / 5, sizes: { lg: [1920, 800], sm: [1280, 533] } },
}
const FORMATS = {
  avif: (img) => img.avif({ quality: 55, effort: 5 }),
  webp: (img) => img.webp({ quality: 78 }),
}
const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tif', '.tiff'])

function idFor(file) {
  const name = basename(file, extname(file)).toLowerCase()
  const m = name.match(/^(restaurant|restaurante|food|comida)[-_ ]?(\d+)$/)
  if (!m) return null
  const kind = m[1].startsWith('rest') ? 'r' : 'f'
  return `${kind}${Number(m[2])}`
}

/** Tamaño de salida sin agrandar: el máximo recorte con esa proporción, tope `target`. */
function fitSize(srcW, srcH, ratio, [tw]) {
  const cropW = Math.min(srcW, Math.floor(srcH * ratio))
  const w = Math.min(tw, cropW)
  return [w, Math.round(w / ratio)]
}

const isFresh = (out, srcMtime) => existsSync(out) && statSync(out).mtimeMs >= srcMtime

async function placeholder(src, ratio) {
  const w = 16
  const h = Math.max(1, Math.round(w / ratio))
  const buf = await sharp(src)
    .resize(w, h, { fit: 'cover', position: sharp.strategy.attention })
    .webp({ quality: 40 })
    .toBuffer()
  return `data:image/webp;base64,${buf.toString('base64')}`
}

async function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.error('No existe content/. Poné las fotos ahí (ver README).')
    process.exit(1)
  }
  mkdirSync(OUT_DIR, { recursive: true })

  const files = readdirSync(CONTENT_DIR).filter((f) => SOURCE_EXT.has(extname(f).toLowerCase()))
  const manifest = {}
  const warnings = []
  let encoded = 0
  let skipped = 0

  const entries = files
    .map((f) => ({ file: f, id: idFor(f) }))
    .filter((e) => {
      if (!e.id) warnings.push(`ignorada (nombre no reconocido): ${e.file}`)
      return e.id
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))

  for (const { file, id } of entries) {
    const src = resolve(CONTENT_DIR, file)
    const srcMtime = statSync(src).mtimeMs
    const meta = await sharp(src).metadata()
    const chicas = []
    const item = { id, kind: id.startsWith('r') ? 'restaurante' : 'comida', source: { file, width: meta.width, height: meta.height } }

    for (const [shapeName, shape] of Object.entries(SHAPES)) {
      const variants = {}
      for (const [sizeName, target] of Object.entries(shape.sizes)) {
        const [w, h] = fitSize(meta.width, meta.height, shape.ratio, target)
        if (w < target[0]) chicas.push(`${shapeName}-${sizeName} ${w}×${h}`)
        const sources = {}
        for (const [fmt, encode] of Object.entries(FORMATS)) {
          const name = `${id}-${shapeName}-${sizeName}.${fmt}`
          const out = resolve(OUT_DIR, name)
          if (isFresh(out, srcMtime)) {
            skipped++
          } else {
            await encode(sharp(src).resize(w, h, { fit: 'cover', position: sharp.strategy.attention })).toFile(out)
            encoded++
          }
          sources[fmt] = `${PUBLIC_PREFIX}/${name}`
        }
        variants[sizeName] = { width: w, height: h, ...sources }
      }
      item[shapeName] = { ...variants, placeholder: await placeholder(src, shape.ratio) }
    }
    if (chicas.length) warnings.push(`${id} (${file}, ${meta.width}×${meta.height}) sin agrandar: ${chicas.join(' · ')}`)
    manifest[id] = item
  }

  writeFileSync(IMAGES_MANIFEST, JSON.stringify(manifest, null, 2))
  const out = writeMediaModule()

  console.log(`Imágenes: ${entries.length} fotos · ${encoded} archivos generados · ${skipped} ya estaban al día`)
  console.log(`Ids: ${entries.map((e) => e.id).join(', ')}`)
  const counts = { r: entries.filter((e) => e.id.startsWith('r')).length, f: entries.filter((e) => e.id.startsWith('f')).length }
  if (counts.r !== 5 || counts.f !== 10) warnings.push(`se esperaban 5 de restaurante y 10 de comida; hay ${counts.r} y ${counts.f}`)
  if (warnings.length) console.log(`Avisos (${warnings.length}):\n  - ${warnings.join('\n  - ')}`)
  console.log(`→ ${out}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
