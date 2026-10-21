// Regresión de QA: corre todos los planes de qa/plans/ (en orden) con qa-browser.mjs.
// Requiere `pnpm dev` levantado en http://localhost:5173.
// Uso: node scripts/qa-all.mjs [filtro]   (p. ej. `f3` corre solo los planes que empiezan con f3)

import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLANS = join(ROOT, 'qa', 'plans')
const filtro = process.argv[2] ?? ''

const planes = readdirSync(PLANS)
  .filter((f) => f.endsWith('.json') && f.startsWith(filtro))
  .sort()

let fallidos = 0
for (const plan of planes) {
  console.log(`\n== ${plan}`)
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'qa-browser.mjs'), join(PLANS, plan)], {
    stdio: 'inherit',
  })
  if (r.status !== 0) fallidos++
}

console.log(`\n${planes.length - fallidos}/${planes.length} planes OK`)
if (fallidos > 0) process.exitCode = 1
