// QA visual con Chrome por el protocolo de DevTools (sin dependencias).
// Uso: node scripts/qa-browser.mjs <plan.json>
//
// El plan es un JSON con { "chrome"?: ruta, "steps": [...] }. Pasos soportados:
//   { "viewport": { "width": 1440, "height": 900, "mobile": false, "scale": 1 } }
//   { "reducedMotion": true|false }
//   { "nav": "http://localhost:5173/" }
//   { "reload": true }                           (recarga como F5: conserva el historial y history.state)
//   { "wait": 500 }                              (ms)
//   { "eval": "expresión JS", "label": "...", "expect"?: valor }
//        (await permitido; imprime el resultado; con `expect` compara por JSON y el plan falla si difiere)
//   { "shot": "ruta.png" }                       (captura del viewport)
//   { "wheel": { "x": 700, "y": 450, "dy": 120, "count": 1, "interval": 16 } }
//   { "key": "ArrowDown" }                       (ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Home, End, PageDown,
//                                                 PageUp, Space, Enter, Escape, Tab; "shift": true para Shift+Tecla)
//   { "atras": true } / { "adelante": true }      (botones atrás/adelante del navegador: entrada anterior/siguiente
//                                                 del historial, como los usa el usuario; no espera carga)
//   { "swipe": { "x": 200, "fromY": 600, "toY": 300, "steps": 8 } }
//   { "click": { "x": 100, "y": 100 } }  o  { "click": { "selector": "css" } }  (centro del elemento;
//                                                 con viewport mobile es un toque: touchStart + touchEnd)
//   { "move": { "x": 100, "y": 100 } }
//
// En cada página se inyectan ayudantes para los `eval` (así los planes no esperan con tiempos fijos):
//   __waitUntil(fn, pred, timeout = 8000)  → repite fn() cada 30 ms hasta que pred(valor); al vencer devuelve fn()
//   __frames(n = 2)                        → espera n frames
//   __sleep(ms)                            → solo para simular el ritmo de un input (no para esperar estados)
//   __auditar({ min = 44, encima })        → responsividad de la pantalla actual: { desborde (scrollWidth −
//        innerWidth), fuera (interactivos fuera del viewport o recortados, contando scrollers y fixed),
//        tapados (otro elemento encima del centro, salvo que un scroll lo saque o esté dentro de `encima`),
//        chicos (área < min, salvo links dentro de un párrafo), cortados (texto cortado), letraMin }.
//        Las listas con `data-desplegable` (se despliegan al enfocarlas) no cuentan como recortadas.
//        Lo usa qa/plans/responsive.json (generado por scripts/qa-responsive.mjs).
// En dev la app además expone `__qa` (src/motion/qa.ts): `reloj(escala)` enlentece GSAP para muestras
// a mitad de animación, `estable()` espera a que el escenario quede quieto.

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
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  Home: { key: 'Home', code: 'Home', keyCode: 36 },
  End: { key: 'End', code: 'End', keyCode: 35 },
}

const AYUDANTES = `
window.__sleep = (ms) => new Promise((r) => setTimeout(r, ms));
window.__frames = (n = 2) => new Promise((r) => { const paso = (k) => (k <= 0 ? r() : requestAnimationFrame(() => paso(k - 1))); paso(n); });
window.__waitUntil = async (fn, pred, timeout = 8000) => {
  const t0 = performance.now();
  while (performance.now() - t0 < timeout) {
    let v;
    try { v = await fn(); } catch { v = undefined; }
    if (pred(v)) return v;
    await new Promise((r) => setTimeout(r, 30));
  }
  return fn();
};
window.__auditar = (opts = {}) => {
  const min = opts.min ?? 44;
  const W = innerWidth, H = innerHeight;
  const de = document.documentElement;
  const nombre = (el) => {
    const d = [...el.attributes].find((a) => a.name.startsWith('data-'));
    const t = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').replace(/\\s+/g, ' ').trim().slice(0, 32);
    return el.tagName.toLowerCase() + (d ? '[' + d.name + (d.value ? '=' + d.value.slice(0, 24) : '') + ']' : '') + (t ? ' "' + t + '"' : '');
  };
  const visible = (el) =>
    !el.closest('[inert], [aria-hidden="true"]') &&
    el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true });
  const docScrollY = getComputedStyle(de).overflowY !== 'hidden' && getComputedStyle(document.body).overflowY !== 'hidden' && de.scrollHeight > H + 1;
  // Dónde queda una caja: 'ok', 'recortado' (oculta del todo por un ancestro que recorta y no scrollea),
  // 'cortado' (en parte), 'fuera' (sale del viewport y no hay scroll que la traiga).
  const ubicar = (r0, el) => {
    let L = r0.left, R = r0.right, T = r0.top, B = r0.bottom;
    let estado = 'ok';
    let fijo = false;
    for (let a = el.parentElement; a && a !== de && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      const ar = a.getBoundingClientRect();
      for (const eje of ['x', 'y']) {
        const o = eje === 'x' ? s.overflowX : s.overflowY;
        const [lo, hi, alo, ahi] = eje === 'x' ? [L, R, ar.left, ar.right] : [T, B, ar.top, ar.bottom];
        const scrollea = (o === 'auto' || o === 'scroll') && (eje === 'x' ? a.scrollWidth > a.clientWidth + 1 : a.scrollHeight > a.clientHeight + 1);
        if (scrollea) {
          const len = hi - lo;
          let n = lo;
          if (n < alo) n = alo;
          if (n + len > ahi) n = Math.max(alo, ahi - len);
          if (eje === 'x') { L = n; R = n + len; } else { T = n; B = n + len; }
        } else if (o !== 'visible') {
          if (hi <= alo + 1 || lo >= ahi - 1) return 'recortado';
          if (lo < alo - 1 || hi > ahi + 1) estado = 'cortado';
        }
      }
      if (s.position === 'fixed') { fijo = true; break; }
    }
    if (L < -1 || R > W + 1) return 'fuera';
    // Lo que cuelga de un fixed no baja con el scroll del documento.
    if ((fijo || !docScrollY) && (T < -1 || B > H + 1)) return 'fuera';
    return estado;
  };
  // Primer ancestro que scrollea en vertical (o el documento): si puede sacar al elemento de
  // abajo de lo que lo tapa, no cuenta como tapado (se alcanza scrolleando).
  const scrollerY = (el) => {
    for (let a = el.parentElement; a && a !== de && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a).overflowY;
      if ((o === 'auto' || o === 'scroll') && a.scrollHeight > a.clientHeight + 1) return a;
      if (getComputedStyle(a).position === 'fixed') return null;
    }
    return docScrollY ? de : null;
  };
  const libreConScroll = (el, r, hit) => {
    const sc = scrollerY(el);
    if (!sc || sc.contains(hit)) return false;
    const hr = hit.getBoundingClientRect();
    const abajo = sc.scrollHeight - sc.clientHeight - sc.scrollTop;
    return abajo >= r.bottom - hr.top || sc.scrollTop >= hr.bottom - r.top;
  };
  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link], [role=radio], [tabindex]:not([tabindex="-1"])';
  const fuera = [], tapados = [], chicos = [], cortados = [];
  for (const el of document.querySelectorAll(SEL)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const u = ubicar(r, el);
    // Listas que se despliegan al enfocarlas o tocarlas (números del modo cerrado): ocultas a propósito.
    if (u === 'recortado' && el.closest('[data-desplegable]')) continue;
    if (u !== 'ok') { fuera.push(u + ' ' + nombre(el)); continue; }
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx >= 0 && cx <= W && cy >= 0 && cy <= H && getComputedStyle(el).pointerEvents !== 'none') {
      const hit = document.elementFromPoint(cx, cy);
      // opts.encima: algo abierto a propósito encima de todo (la lámina del navbar).
      if (hit && !el.contains(hit) && !libreConScroll(el, r, hit) && !(opts.encima && hit.closest(opts.encima))) tapados.push(nombre(el) + ' ← ' + nombre(hit));
    }
    // Links dentro de un texto (excepción de WCAG 2.5.8): en línea y con más texto alrededor.
    const enLinea = getComputedStyle(el).display === 'inline' && (el.parentElement?.textContent.trim().length ?? 0) > el.textContent.trim().length;
    if (!enLinea && (r.width < min - 0.5 || r.height < min - 0.5)) chicos.push(nombre(el) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
  }
  let letraMin = Infinity;
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const rango = document.createRange();
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('script, style, noscript, .sr-only, [inert]') || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) continue;
    rango.selectNodeContents(n);
    const r0 = rango.getBoundingClientRect();
    if (r0.width < 1 || r0.height < 1) continue;
    // La caja del texto incluye el ascendente/descendente de la fuente: con interlineado ajustado
    // (títulos gigantes) sobresale de su línea sin que se corte ninguna letra. Se mira el 60 % central.
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const m = Math.min(r0.height * 0.2, fs * 0.2);
    const r = { left: r0.left + 1, right: r0.right - 1, top: r0.top + m, bottom: r0.bottom - m };
    const u = ubicar(r, el);
    if (u === 'recortado') continue;
    letraMin = Math.min(letraMin, parseFloat(getComputedStyle(el).fontSize));
    if (u !== 'ok') cortados.push(u + ' ' + nombre(el));
  }
  return {
    desborde: Math.max(0, Math.max(de.scrollWidth, document.body.scrollWidth) - W),
    fuera: [...new Set(fuera)], tapados: [...new Set(tapados)], chicos: [...new Set(chicos)], cortados: [...new Set(cortados)],
    letraMin: letraMin === Infinity ? null : letraMin,
  };
};
`

let viewport = { width: 1440, height: 900, mobile: false, scale: 1 }
let fallas = 0

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
  await send('Page.addScriptToEvaluateOnNewDocument', { source: AYUDANTES })

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
      // Se apaga al volver a escritorio: con la emulación del mouse encendida, el clic no vuelve nunca.
      await send('Emulation.setEmitTouchEventsForMouse', { enabled: !!viewport.mobile, configuration: 'mobile' })
    } else if ('reducedMotion' in step) {
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: step.reducedMotion ? 'reduce' : 'no-preference' }],
      })
    } else if (step.nav) {
      const loaded = waitEvent('Page.loadEventFired')
      await send('Page.navigate', { url: step.nav })
      await loaded
    } else if (step.reload) {
      const loaded = waitEvent('Page.loadEventFired')
      await send('Page.reload', {})
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
      const texto = typeof val === 'string' ? val : JSON.stringify(val)
      if ('expect' in step) {
        // Comparación exacta por JSON: el plan falla (exit 1) si algo cambió.
        const ok = JSON.stringify(val) === JSON.stringify(step.expect)
        if (!ok) fallas++
        console.log(`[${ok ? 'OK' : 'FALLA'}${step.label ? ` ${step.label}` : ''}]`, texto, ok ? '' : `≠ esperado ${JSON.stringify(step.expect)}`)
      } else {
        console.log(`[eval${step.label ? ` ${step.label}` : ''}]`, texto)
      }
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
      // modifiers: 8 = Shift (protocolo de DevTools).
      const base = {
        key: k.key,
        code: k.code,
        windowsVirtualKeyCode: k.keyCode,
        nativeVirtualKeyCode: k.keyCode,
        modifiers: step.shift ? 8 : 0,
      }
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
    } else if (step.atras || step.adelante) {
      const { currentIndex, entries } = await send('Page.getNavigationHistory')
      const destino = entries[currentIndex + (step.atras ? -1 : 1)]
      if (!destino) throw new Error(`No hay entrada ${step.atras ? 'anterior' : 'siguiente'} en el historial`)
      await send('Page.navigateToHistoryEntry', { entryId: destino.id })
    } else if (step.click) {
      let { x, y } = step.click
      if (step.click.selector) {
        const r = await send('Runtime.evaluate', {
          expression: `(() => { const el = document.querySelector(${JSON.stringify(step.click.selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`,
          returnByValue: true,
        })
        if (!r.result.value) throw new Error(`click: no encontré ${step.click.selector}`)
        ;[x, y] = r.result.value
      }
      if (viewport.mobile) {
        // Con táctil emulado, `dispatchMouseEvent` puede no volver nunca: en mobile es un toque.
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
        await sleep(30)
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        continue
      }
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
  if (fallas > 0) {
    console.log(`✗ ${fallas} chequeo(s) fallaron`)
    process.exitCode = 1
  }
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
