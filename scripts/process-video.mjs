// Procesa el video de content/ → public/media/video/ y actualiza
// src/content/media.generated.ts. Idempotente: no re-codifica si la salida es
// más nueva que la fuente. Usa ffmpeg-static (no hace falta instalar ffmpeg).
//
//   hero-lg.mp4   H.264 CRF 24, yuv420p, +faststart, sin audio, alto ≤ 1080
//   hero-sm.mp4   ídem CRF 26, alto ≤ 720 (pantallas < 1024px)
//   hero-poster-{lg,sm}.{avif,webp}  primer frame, vía sharp
// Nunca se agranda: si la fuente es más chica, se queda en su tamaño y se avisa.
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import ffmpegPath from 'ffmpeg-static'
import sharp from 'sharp'
import { CONTENT_DIR, MEDIA_DIR, VIDEO_MANIFEST, writeMediaModule } from './lib/media-module.mjs'

const OUT_DIR = resolve(MEDIA_DIR, 'video')
const PUBLIC_PREFIX = '/media/video'
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.mkv', '.m4v'])
const TARGETS = { lg: { height: 1080, crf: 24 }, sm: { height: 720, crf: 26 } }

const isFresh = (out, srcMtime) => existsSync(out) && statSync(out).mtimeMs >= srcMtime
const kb = (file) => Math.round(statSync(file).size / 1024)

function probe(src) {
  // ffmpeg -i sale con código 1 sin archivo de salida; la info va a stderr.
  const res = spawnSync(ffmpegPath, ['-hide_banner', '-i', src], { encoding: 'utf8' })
  const info = res.stderr
  const size = info.match(/Video:.*?(\d{2,5})x(\d{2,5})/)
  const dur = info.match(/Duration: (\d+):(\d+):([\d.]+)/)
  if (!size) throw new Error(`No pude leer el tamaño del video:\n${info}`)
  return {
    width: Number(size[1]),
    height: Number(size[2]),
    duration: dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : null,
  }
}

const even = (n) => Math.max(2, Math.round(n / 2) * 2)

async function main() {
  if (!existsSync(CONTENT_DIR)) {
    console.error('No existe content/. Poné el video ahí (ver README).')
    process.exit(1)
  }
  const videos = readdirSync(CONTENT_DIR).filter((f) => VIDEO_EXT.has(extname(f).toLowerCase()))
  if (videos.length === 0) {
    console.log('Video: no hay ninguno en content/. Sigo sin video.')
    writeFileSync(VIDEO_MANIFEST, 'null')
    writeMediaModule()
    return
  }
  if (videos.length > 1) console.log(`Video: hay ${videos.length}; uso el primero (${videos[0]}).`)

  mkdirSync(OUT_DIR, { recursive: true })
  const src = resolve(CONTENT_DIR, videos[0])
  const srcMtime = statSync(src).mtimeMs
  const info = probe(src)
  const warnings = []
  const manifest = { source: { file: videos[0], ...info, kb: kb(src) }, sources: {}, poster: {} }

  for (const [name, t] of Object.entries(TARGETS)) {
    const height = even(Math.min(t.height, info.height))
    const width = even((info.width * height) / info.height)
    if (height < t.height) warnings.push(`hero-${name}: ${width}×${height} (pedido alto ${t.height}, la fuente es ${info.width}×${info.height})`)
    const out = resolve(OUT_DIR, `hero-${name}.mp4`)
    if (!isFresh(out, srcMtime)) {
      execFileSync(ffmpegPath, [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-i', src,
        '-an',
        '-vf', `scale=${width}:${height}:flags=lanczos`,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', String(t.crf),
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        out,
      ])
    }
    manifest.sources[name] = { src: `${PUBLIC_PREFIX}/hero-${name}.mp4`, width, height, kb: kb(out) }
  }

  // Póster: primer frame a PNG en memoria → AVIF/WebP con sharp.
  const frame = execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-i', src, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], {
    maxBuffer: 64 * 1024 * 1024,
  })
  for (const [name, { width, height }] of Object.entries(manifest.sources)) {
    const poster = { width, height }
    for (const fmt of ['avif', 'webp']) {
      const file = `hero-poster-${name}.${fmt}`
      const out = resolve(OUT_DIR, file)
      if (!isFresh(out, srcMtime)) {
        const img = sharp(frame).resize(width, height, { fit: 'cover' })
        await (fmt === 'avif' ? img.avif({ quality: 55 }) : img.webp({ quality: 78 })).toFile(out)
      }
      poster[fmt] = `${PUBLIC_PREFIX}/${file}`
    }
    manifest.poster[name] = poster
  }
  const ph = await sharp(frame).resize(16, 9, { fit: 'cover' }).webp({ quality: 40 }).toBuffer()
  manifest.poster.placeholder = `data:image/webp;base64,${ph.toString('base64')}`

  writeFileSync(VIDEO_MANIFEST, JSON.stringify(manifest, null, 2))
  const outModule = writeMediaModule()

  console.log(`Video: ${videos[0]} · ${info.width}×${info.height} · ${info.duration?.toFixed(1)} s · ${manifest.source.kb} KB`)
  for (const [name, s] of Object.entries(manifest.sources)) console.log(`  hero-${name}.mp4  ${s.width}×${s.height}  ${s.kb} KB`)
  if (warnings.length) console.log(`Avisos:\n  - ${warnings.join('\n  - ')}`)
  console.log(`→ ${outModule}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
