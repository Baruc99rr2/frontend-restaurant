// QA visual con Chrome por el protocolo de DevTools (sin dependencias).
// Uso: node scripts/qa-browser.mjs <plan.json>
//
// El plan es un JSON con { "chrome"?: ruta, "steps": [...] }. Pasos soportados:
//   { "viewport": { "width": 1440, "height": 900, "mobile": false, "scale": 1 } }
//   { "reducedMotion": true|false }
//   { "nav": "http://localhost:5173/" }
//   { "wait": 500 }                              (ms)
//   { "eval": "expresión JS", "label": "..." }   (await permitido; imprime el resultado)
//   { "shot": "ruta.png" }                       (captura del viewport)
//   { "wheel": { "x": 700, "y": 450, "dy": 120, "count": 1, "interval": 16 } }
//   { "key": "ArrowDown" }                       (ArrowDown, ArrowUp, PageDown, PageUp, Space, Enter, Escape)
//   { "swipe": { "x": 200, "fromY": 600, "toY": 300, "steps": 8 } }
//   { "click": { "x": 100, "y": 100 } }
//   { "move": { "x": 100, "y": 100 } }

import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const planPath = process.argv[2]
if (!planPath) {
  console.error('Uso: node scripts/qa-browser.mjs <plan.json>')
  process.exit(1)
}
const plan = JSON.parse(readFileSync(planPath, 'utf8'))

const CHROME_CANDIDATES = [
  plan.chrome,
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!chromePath) {
  console.error('No encontré Chrome. Pasá "chrome" en el plan o CHROME_PATH.')
  process.exit(1)
}

const port = 9300 + Math.floor(Math.random() * 500)
const profile = mkdtempSync(join(tmpdir(), 'qa-chrome-'))
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getPageWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      const list = await res.json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {
      // Chrome todavía no levantó
    }
    await sleep(200)
  }
  throw new Error('Chrome no respondió')
}

let ws
let nextId = 1
const pending = new Map()
const listeners = new Set()

function send(method, params = {}) {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((res, rej) => pending.set(id, { res, rej, method }))
}

function waitEvent(name, timeout = 15000) {
  return new Promise((res) => {
    const t = setTimeout(() => {
      listeners.delete(fn)
      res(null)
    }, timeout)
    const fn = (msg) => {
      if (msg.method === name) {
        clearTimeout(t)
        listeners.delete(fn)
        res(msg.params)
      }
    }
    listeners.add(fn)
  })
}

const KEYS = {
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  PageDown: { key: 'PageDown', code: 'PageDown', keyCode: 34 },
  PageUp: { key: 'PageUp', code: 'PageUp', keyCode: 33 },
  Space: { key: ' ', code: 'Space', keyCode: 32, text: ' ' },
  Enter: { key: 'Enter', code: 'Enter', keyCode: 13, text: '\r' },
  Escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
  Tab: { key: 'Tab', code: 'Tab', keyCode: 9 },
}

let viewport = { width: 1440, height: 900, mobile: false, scale: 1 }

async function run() {
  ws = new WebSocket(await getPageWs())
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) p.rej(new Error(`${p.method}: ${msg.error.message}`))
      else p.res(msg.result)
    } else {
      for (const fn of listeners) fn(msg)
    }
  })
  listeners.add((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('[page:exception]', msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text)
    }
    if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
      console.log(`[page:${msg.params.type}]`, msg.params.args.map((a) => a.value ?? a.description).join(' '))
    }
  })
  await send('Page.enable')
  await send('Runtime.enable')

  for (const step of plan.steps) {
    if (step.viewport) {
      viewport = { ...viewport, ...step.viewport }
      await send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.scale,
        mobile: viewport.mobile,
      })
      await send('Emulation.setTouchEmulationEnabled', { enabled: !!viewport.mobile, maxTouchPoints: viewport.mobile ? 5 : 1 })
      if (viewport.mobile) {
        await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' })
      }
    } else if ('reducedMotion' in step) {
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: step.reducedMotion ? 'reduce' : 'no-preference' }],
      })
    } else if (step.nav) {
      const loaded = waitEvent('Page.loadEventFired')
      await send('Page.navigate', { url: step.nav })
      await loaded
    } else if (step.wait) {
      await sleep(step.wait)
    } else if (step.eval) {
      const r = await send('Runtime.evaluate', {
        expression: `(async () => { return (${step.eval}) })()`,
        awaitPromise: true,
        returnByValue: true,
      })
      const val = r.exceptionDetails ? `ERROR ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}` : r.result.value
      console.log(`[eval${step.label ? ` ${step.label}` : ''}]`, typeof val === 'string' ? val : JSON.stringify(val))
    } else if (step.shot) {
      // Rutas relativas: respecto del archivo del plan (así las capturas no caen en el repo).
      const out = resolve(dirname(resolve(planPath)), step.shot)
      mkdirSync(dirname(out), { recursive: true })
      const r = await send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(out, Buffer.from(r.data, 'base64'))
      console.log('[shot]', out)
    } else if (step.wheel) {
      const { x = viewport.width / 2, y = viewport.height / 2, dy = 120, count = 1, interval = 16 } = step.wheel
      for (let i = 0; i < count; i++) {
        await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy })
        if (interval) await sleep(interval)
      }
    } else if (step.key) {
      const k = KEYS[step.key] ?? { key: step.key, code: step.key }
      const base = { key: k.key, code: k.code, windowsVirtualKeyCode: k.keyCode, nativeVirtualKeyCode: k.keyCode }
      await send('Input.dispatchKeyEvent', { type: k.text ? 'keyDown' : 'rawKeyDown', ...base, text: k.text })
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base })
    } else if (step.swipe) {
      const { x = viewport.width / 2, fromY, toY, steps = 8 } = step.swipe
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY }] })
      for (let i = 1; i <= steps; i++) {
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: fromY + ((toY - fromY) * i) / steps }] })
        await sleep(16)
      }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } else if (step.click) {
      const { x, y } = step.click
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
    } else if (step.move) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: step.move.x, y: step.move.y })
    }
  }
}

try {
  await run()
} catch (err) {
  console.error(err)
  process.exitCode = 1
} finally {
  try {
    ws?.close()
  } catch {
    // nada
  }
  chrome.kill()
  await sleep(300)
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    // Chrome puede retener el perfil unos ms en Windows
  }
}
