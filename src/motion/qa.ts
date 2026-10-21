// Gancho de QA (solo en dev, lo instala `main.tsx`): lo usan los planes de `qa/plans/`
// para esperar estados y tomar muestras a mitad de una animación sin depender del reloj.

import { gsap } from './gsap'

declare global {
  interface Window {
    __qa?: GanchoQa
  }
}

type GanchoQa = {
  /**
   * Escala del reloj global de GSAP: 1 = normal, 0.02 = 50 veces más lento.
   * Con el reloj lento, una muestra "a mitad de transición" queda quieta el tiempo
   * suficiente para leerla aunque el protocolo de DevTools tarde. No usar 0: GSAP no
   * aplica los `set()` inmediatos con un ancestro en pausa.
   */
  reloj: (escala: number) => number
  /**
   * Escenario quieto: modo cerrado o abierto, sin transición ni bloqueo, y además la carta
   * sin abrirse ni cerrarse y el barrido negro sin correr.
   */
  quieto: () => boolean
  /** Espera (dos frames y después) a que el escenario quede quieto. Devuelve si lo logró. */
  estable: (timeout?: number) => Promise<boolean>
  /**
   * Carta y barrido quietos (sin mirar el escenario: sirve también en `/carta/:slug`).
   * Carta quieta = `abierta` o `cerrada` (o no montada); barrido = `quieto`.
   */
  cartaQuieta: () => boolean
  cartaEstable: (timeout?: number) => Promise<boolean>
  /**
   * Como `estable` y además sin animaciones finitas de GSAP en curso (reveals, conteos).
   * Para capturas: los bucles infinitos (ondas del MENU) no cuentan.
   */
  reposo: (timeout?: number) => Promise<boolean>
  gsap: typeof gsap
}

const raiz = () => document.querySelector<HTMLElement>('[data-mode]')

const frames = (n: number) =>
  new Promise<void>((resolve) => {
    const paso = (k: number) => (k <= 0 ? resolve() : requestAnimationFrame(() => paso(k - 1)))
    paso(n)
  })

export function instalarGanchoQa() {
  const cartaQuieta = () => {
    const carta = document.querySelector<HTMLElement>('[data-carta-estado]')?.dataset.cartaEstado
    const barrido = document.querySelector<HTMLElement>('[data-barrido]')?.dataset.barrido
    return (!carta || carta === 'abierta' || carta === 'cerrada') && (!barrido || barrido === 'quieto')
  }
  const quieto = () => {
    const r = raiz()
    return (
      !!r &&
      (r.dataset.mode === 'closed' || r.dataset.mode === 'open') &&
      r.dataset.lock === undefined &&
      cartaQuieta()
    )
  }
  const animando = () =>
    gsap.globalTimeline
      .getChildren(true, true, false)
      .some((t) => t.isActive() && t.repeat() !== -1 && t.totalDuration() < 5)
  const esperar = async (cond: () => boolean, timeout: number) => {
    // Dos frames primero: un paso recién despachado ya marcó el bloqueo.
    await frames(2)
    const t0 = performance.now()
    while (performance.now() - t0 < timeout) {
      if (cond()) return true
      await new Promise((r) => setTimeout(r, 30))
    }
    return cond()
  }
  window.__qa = {
    reloj(escala) {
      gsap.globalTimeline.timeScale(Math.max(escala, 0.001))
      return gsap.globalTimeline.timeScale()
    },
    quieto,
    estable: (timeout = 8000) => esperar(quieto, timeout),
    cartaQuieta,
    cartaEstable: (timeout = 8000) => esperar(cartaQuieta, timeout),
    reposo: (timeout = 8000) => esperar(() => quieto() && !animando(), timeout),
    gsap,
  }
}
