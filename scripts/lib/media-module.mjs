// Escribe src/content/media.generated.ts a partir de los manifiestos que dejan
// process-images.mjs y process-video.mjs en public/media/. Lo llaman los dos
// scripts al terminar, así el orden en que corren no importa.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const CONTENT_DIR = resolve(ROOT, 'content')
export const MEDIA_DIR = resolve(ROOT, 'public', 'media')
export const IMAGES_MANIFEST = resolve(MEDIA_DIR, 'images.manifest.json')
export const VIDEO_MANIFEST = resolve(MEDIA_DIR, 'video.manifest.json')
const OUT = resolve(ROOT, 'src', 'content', 'media.generated.ts')

const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback)

export function writeMediaModule() {
  const images = readJson(IMAGES_MANIFEST, {})
  const video = readJson(VIDEO_MANIFEST, null)

  const body = [
    '// ARCHIVO GENERADO por `pnpm media` (scripts/process-*.mjs). No editar a mano.',
    "import type { MediaCatalog } from './media.types'",
    '',
    `export const media = ${JSON.stringify({ images, video }, null, 2)} as const satisfies MediaCatalog`,
    '',
    'export type MediaId = keyof typeof media.images',
    '',
  ].join('\n')

  writeFileSync(OUT, body)
  return OUT
}
