// Genera qa/plans/responsive.json: recorre todos los tamaños y en cada uno las pantallas clave
// (intro, modo cerrado, las 6 secciones, lámina del navbar, carta frente y dorso, categoría,
// polaroid). En cada pantalla, `__auditar` (qa-browser.mjs) verifica: sin scroll horizontal,
// ningún interactivo fuera del viewport/recortado/tapado, áreas táctiles mínimas, texto sin cortar
// y letra ≥ 10 px; y saca una captura en qa/shots/responsive/.
//
// Uso: node scripts/qa-responsive.mjs [--solo 240x320,667x375] [--out ruta.json]
//      (sin opciones escribe qa/plans/responsive.json con los 14 tamaños)

import { writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'http://localhost:5173'

// mobile = táctil emulado (teléfonos y tablets). Escritorio desde 1280.
const TAMANOS = [
  [240, 320], [280, 653], [320, 568], [360, 740], [390, 844], [414, 896],
  [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440],
  [667, 375], [844, 390],
]

const SECCIONES = ['home', 'la-casa', 'platos', 'eventos', 'preguntas', 'contacto']

const args = process.argv.slice(2)
const opt = (n) => {
  const i = args.indexOf(n)
  return i >= 0 ? args[i + 1] : undefined
}
const solo = opt('--solo')?.split(',')
// --pantallas cerrado,home,lamina,carta,categoria (para iterar; el plan versionado lleva todas)
const pantallas = opt('--pantallas')?.split(',')
const quiero = (p) => !pantallas || pantallas.includes(p)
const out = opt('--out') ?? join(ROOT, 'qa', 'plans', 'responsive.json')
const shotsDir = relative(dirname(out), join(ROOT, 'qa', 'shots', 'responsive')).replaceAll('\\', '/')

const tamanos = TAMANOS.filter(([w, h]) => !solo || solo.includes(`${w}x${h}`))

// Sin animaciones finitas de GSAP en curso (sirve sin escenario: página de categoría).
const QUIETO_GSAP =
  "() => !__qa.gsap.globalTimeline.getChildren(true, true, false).some((t) => t.isActive() && t.repeat() !== -1 && t.totalDuration() < 5)"

const steps = []
const auditar = (nombre, w, h, tactil, extra = '') => {
  const min = w <= 240 ? 40 : tactil ? 44 : 24
  steps.push({
    eval: `(({ letraMin, ...r }) => ({ ...r, letra: letraMin === null || letraMin >= 10 ? 'ok' : letraMin }))(__auditar({ min: ${min}${extra} }))`,
    label: `${w}×${h} ${nombre}`,
    expect: { desborde: 0, fuera: [], tapados: [], chicos: [], cortados: [], letra: 'ok' },
  })
  steps.push({ shot: `${shotsDir}/${w}x${h}-${nombre}.png` })
}
const ir = (ruta) => {
  steps.push({ nav: 'about:blank' })
  steps.push({ nav: BASE + ruta })
}

for (const [w, h] of tamanos) {
  const tactil = w <= 1024
  steps.push({ viewport: { width: w, height: h, mobile: tactil, scale: 1 } })

  // Intro (muestra a mitad, con el reloj lento) y modo cerrado.
  if (quiero('cerrado')) {
    ir('/')
    steps.push({
      eval: "(async () => { await __waitUntil(() => document.querySelector('[data-mode]')?.dataset.mode, (m) => m === 'intro', 15000); __qa.reloj(0.2); await __frames(30); return true })()",
    })
    steps.push({ shot: `${shotsDir}/${w}x${h}-intro.png` })
    steps.push({
      eval: "(async () => { __qa.reloj(1); await __waitUntil(() => document.querySelector('[data-mode]')?.dataset.mode, (m) => m === 'closed', 15000); return __qa.reposo() })()",
      expect: true,
    })
    auditar('cerrado', w, h, tactil)
  }

  // Las 6 secciones abiertas (entrada por hash).
  SECCIONES.forEach((key, i) => {
    const lamina = key === 'home' && w < 1200 && quiero('lamina')
    if (!quiero(key) && !lamina) return
    ir(`/#${key}`)
    steps.push({
      eval: `(async () => { await __waitUntil(() => document.querySelector('[data-mode]')?.dataset.texts, (t) => t === '${i}', 15000); ${
        key === 'contacto'
          ? "await __waitUntil(() => document.querySelectorAll('.leaflet-tile-loaded').length, (n) => n > 0, 8000); "
          : ''
      }return __qa.reposo() })()`,
      expect: true,
    })
    if (quiero(key)) auditar(key, w, h, tactil)

    // Lámina de links (debajo de 75rem de navbar).
    if (lamina) {
      steps.push({ click: { selector: '[aria-controls=navbar-mobile-sheet]' } })
      steps.push({
        eval: "(async () => { await __waitUntil(() => getComputedStyle(document.getElementById('navbar-mobile-sheet')).opacity, (o) => o === '1'); return __qa.reposo() })()",
        expect: true,
      })
      auditar('lamina', w, h, tactil, ", encima: '#navbar-mobile-sheet'")
    }
  })

  // Carta (frente y un cartelito dado vuelta).
  if (quiero('carta')) {
    ir('/carta')
    steps.push({
      eval: "(async () => { await __waitUntil(() => document.querySelector('[data-carta-estado]')?.dataset.cartaEstado, (e) => e === 'abierta', 15000); return __qa.reposo() })()",
      expect: true,
    })
    auditar('carta', w, h, tactil)
    steps.push({ click: { selector: '[data-carta-card]' } })
    steps.push({
      eval: "(async () => { await __waitUntil(() => document.querySelector('[data-volteado]') !== null, (v) => v, 5000); return __qa.reposo() })()",
      expect: true,
    })
    auditar('carta-dorso', w, h, tactil)
  }

  // Página de categoría, su pie y la polaroid.
  if (quiero('categoria')) {
    ir('/carta/fuegos')
    steps.push({
      eval: `(async () => { await __waitUntil(() => document.querySelectorAll('[data-plato]').length, (n) => n === 6, 15000); await __qa.cartaEstable(); return __waitUntil(${QUIETO_GSAP}, (v) => v) })()`,
      expect: true,
    })
    auditar('categoria', w, h, tactil)
    steps.push({ eval: "(window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }), __frames(4))" })
    steps.push({ shot: `${shotsDir}/${w}x${h}-categoria-pie.png` })
    steps.push({
      eval: "(document.querySelector('[data-plato-abrir]').scrollIntoView({ block: 'center', behavior: 'instant' }), __frames(4))",
    })
    steps.push({ click: { selector: '[data-plato-abrir]' } })
    steps.push({
      eval: `(async () => { await __waitUntil(() => document.querySelector('[data-polaroid]')?.dataset.polaroidEstado, (e) => e === 'abierta', 8000); return __waitUntil(${QUIETO_GSAP}, (v) => v) })()`,
      expect: true,
    })
    auditar('polaroid', w, h, tactil)
  }
}

const plan = {
  descripcion:
    'Responsividad de 240 a 2560 (generado por scripts/qa-responsive.mjs, no editar a mano): en cada tamaño, intro, modo cerrado, las 6 secciones, lámina, carta frente y dorso, categoría y polaroid. `__auditar`: sin scroll horizontal, interactivos dentro del viewport (o de un scroller), sin tapar, áreas táctiles ≥ 44 px (40 en 240, 24 con mouse), texto sin cortar y letra ≥ 10 px. Capturas en qa/shots/responsive/.',
  steps,
}
writeFileSync(out, JSON.stringify(plan, null, 2) + '\n')
console.log(`${out}: ${tamanos.length} tamaños, ${steps.length} pasos`)
