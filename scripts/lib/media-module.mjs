// Escribe src/content/media.generated.ts (rutas y medidas) y
// src/content/media.placeholders.generated.ts (miniaturas base64) a partir de los
// manifiestos que dejan process-images.mjs y process-video.mjs en public/media/.
// Lo llaman los dos scripts al terminar, así el orden en que corren no importa.
// Las miniaturas van en un módulo aparte para que no pesen en el chunk principal:
// en el catálogo, `placeholder` es una clave (`f1/paisaje`, `video/poster`) que
// resuelve `usePlaceholder()` (src/content/placeholders.ts) cuando el módulo llega.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const CONTENT_DIR = resolve(ROOT, 'content')
export const MEDIA_DIR = resolve(ROOT, 'public', 'media')
export const IMAGES_MANIFEST = resolve(MEDIA_DIR, 'images.manifest.json')
export const VIDEO_MANIFEST = resolve(MEDIA_DIR, 'video.manifest.json')
const OUT = resolve(ROOT, 'src', 'content', 'media.generated.ts')
const OUT_PLACEHOLDERS = resolve(ROOT, 'src', 'content', 'media.placeholders.generated.ts')

const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback)

export function writeMediaModule() {
  const images = readJson(IMAGES_MANIFEST, {})
  const video = readJson(VIDEO_MANIFEST, null)
  const placeholders = {}

  for (const [id, item] of Object.entries(images)) {
    for (const shape of ['paisaje', 'retrato', 'banda']) {
      const s = item[shape]
      if (!s?.placeholder) continue
      const clave = `${id}/${shape}`
      placeholders[clave] = s.placeholder
      s.placeholder = clave
    }
  }
  if (video?.poster?.placeholder) {
    placeholders['video/poster'] = video.poster.placeholder
    video.poster.placeholder = 'video/poster'
  }

  const aviso = '// ARCHIVO GENERADO por `pnpm media` (scripts/process-*.mjs). No editar a mano.'
  const body = [
    aviso,
    "import type { MediaCatalog } from './media.types.ts'",
    '',
    `export const media = ${JSON.stringify({ images, video }, null, 2)} as const satisfies MediaCatalog`,
    '',
    'export type MediaId = keyof typeof media.images',
    '',
  ].join('\n')
  const bodyPlaceholders = [
    aviso,
    '// Miniaturas borrosas (16 px) por clave `id/forma`; se cargan aparte del chunk principal.',
    '',
    `export const placeholders: Record<string, string> = ${JSON.stringify(placeholders, null, 2)}`,
    '',
  ].join('\n')

  writeFileSync(OUT, body)
  writeFileSync(OUT_PLACEHOLDERS, bodyPlaceholders)
  return OUT
}
