import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { siteConfig, whatsappUrl } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { categoriasCarta } from '@/content/editorial'
import { atraparFoco, tabulables } from '@/components/focusTrap'
import { teclaRoving } from '@/components/roving'
import { useAjusteAncho } from '@/components/useAjusteAncho'
import { CartaCard } from '@/carta/CartaCard'
import { navegarACategoria } from '@/carta/navegacion'
import { useWipeTransition } from '@/carta/WipeTransition'
import { formatPrecio } from '@/data/format'
import { retryLocal, useLocal } from '@/data/useLocal'
import { gsap, useGSAP } from '@/motion/gsap'
import { Reveal } from '@/motion/primitives'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

/**
 * Overlay `/carta` (§9, refs. 08–09). Vive dentro del escenario, encima de todo menos del
 * navbar (el botón MENU, ya convertido en CERRAR, sigue siendo el del navbar: un solo
 * líquido, sincronizado con la ruta en todos los caminos).
 *
 * - Fondo `tizon`. Arriba izq.: menú del día del repositorio ("Hoy: … — $") o "Carta de temporada".
 * - 6 cartelitos (categorías del repositorio + editorial) que caen en cascada con rotación.
 *   1er clic: se da vuelta (y el que estaba dado vuelta vuelve). 2do clic: barrido negro → `/carta/:slug`.
 * - Abajo: dirección + teléfono, "Reservar mesa", rubro + email; y el nombre gigante ajustado al ancho.
 * - Mobile: cartelitos en carrusel horizontal con snap.
 * - Diálogo modal: foco atrapado (CERRAR + overlay), cartelitos con foco itinerante (roving.ts),
 *   y al cerrar el foco vuelve a quien abrió.
 * Estado para QA en `data-carta-estado` (`cerrada | abriendo | abierta | cerrando`).
 */

type Props = {
  /** Ruta `/carta`. */
  abierta: boolean
  /** El escenario terminó de cargar (en una entrada directa a `/carta`, el loader va primero). */
  listo: boolean
}

type Estado = 'cerrada' | 'abriendo' | 'abierta' | 'cerrando'

export function CartaOverlay({ abierta, listo }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const nombreRef = useRef<HTMLSpanElement | null>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotion()
  const { transicion } = useWipeTransition()
  const local = useLocal()

  const visible = abierta && listo
  const [volteado, setVolteado] = useState<number | null>(null)
  const [focoElegido, setFoco] = useState(0)

  const categorias = local.data ? categoriasCarta(local.data.menu) : []
  const n = categorias.length
  /** Parada de Tab de los cartelitos (si cambia la cantidad, no queda fuera de rango). */
  const foco = focoElegido < n ? focoElegido : 0

  const diario = local.data?.menu.daily_menu.find((d) => d.available) ?? null
  const hoy =
    local.status === 'loading'
      ? null
      : diario
        ? `${copy.carta.hoy} ${diario.name} — ${formatPrecio(diario.price_cents)}`
        : copy.carta.temporada

  useAjusteAncho(nombreRef)

  const marcar = (estado: Estado) => {
    if (rootRef.current) rootRef.current.dataset.cartaEstado = estado
  }

  // Abrir / cerrar: fondo, cascada de cartelitos, pie y nombre gigante.
  // Interrumpible: cada cambio mata el timeline y sigue desde donde están las piezas.
  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const cartas = Array.from(root.querySelectorAll<HTMLElement>('[data-carta-caida]'))
      const pie = Array.from(root.querySelectorAll<HTMLElement>('[data-carta-pie]'))
      const nombre = root.querySelector<HTMLElement>('[data-carta-nombre]')
      const C = motionDuration.carta
      const d = motionDuration.reduced
      // Mientras carga la carta no hay cartelitos (GSAP avisa si se le pasa una lista vacía).
      const hay = cartas.length > 0

      tlRef.current?.kill()

      // Cerrada y ya oculta (montaje, o llegan los datos con la carta cerrada): sin animar.
      if (!visible && Number(gsap.getProperty(root, 'opacity')) === 0) {
        gsap.set(root, { autoAlpha: 0 })
        if (hay) gsap.set(cartas, { opacity: 0 })
        gsap.set(pie, { opacity: 0, y: reduced ? 0 : 16 })
        if (nombre) gsap.set(nombre, { yPercent: reduced ? 0 : 105, opacity: reduced ? 0 : 1 })
        marcar('cerrada')
        return
      }

      const tl = gsap.timeline()
      tlRef.current = tl

      if (visible) {
        marcar('abriendo')
        // Las que no están a la vista arrancan arriba, giradas: "caen" (las que estaban
        // saliendo siguen desde donde iban).
        const fuera = cartas.filter((c) => Number(gsap.getProperty(c, 'opacity')) === 0)
        if (fuera.length) {
          gsap.set(fuera, {
            y: reduced ? 0 : () => -window.innerHeight * 0.7,
            rotation: reduced ? 0 : (i: number) => (i % 2 ? 14 : -12),
          })
        }
        if (reduced) {
          tl.to(root, { autoAlpha: 1, duration: d, ease: motionEase.ui }, 0)
          if (hay) tl.to(cartas, { opacity: 1, y: 0, rotation: 0, duration: d, ease: motionEase.ui }, 0)
          tl.to(pie, { opacity: 1, y: 0, duration: d, ease: motionEase.ui }, 0)
          if (nombre) tl.to(nombre, { opacity: 1, yPercent: 0, duration: d, ease: motionEase.ui }, 0)
        } else {
          tl.to(root, { autoAlpha: 1, duration: C.fondo, ease: motionEase.ui }, 0)
          if (hay) {
            tl.to(
              cartas,
              { opacity: 1, y: 0, rotation: 0, duration: C.caida, stagger: C.caidaStagger, ease: motionEase.enter },
              C.caidaDemora,
            )
          }
          tl.to(pie, { opacity: 1, y: 0, duration: C.pie, stagger: 0.06, ease: motionEase.enter }, C.pieDemora)
          if (nombre) tl.to(nombre, { opacity: 1, yPercent: 0, duration: C.nombre, ease: motionEase.enter }, C.nombreDemora)
        }
        tl.call(() => marcar('abierta'))
      } else {
        marcar('cerrando')
        if (reduced) {
          tl.to([...cartas, ...pie], { opacity: 0, duration: d, ease: motionEase.ui }, 0)
          if (nombre) tl.to(nombre, { opacity: 0, duration: d, ease: motionEase.ui }, 0)
          tl.to(root, { autoAlpha: 0, duration: d, ease: motionEase.ui }, 0)
        } else {
          if (hay) {
            tl.to(
              cartas,
              {
                opacity: 0,
                y: () => window.innerHeight * 0.55,
                rotation: (i: number) => (i % 2 ? 9 : -9),
                duration: C.salida,
                stagger: C.salidaStagger,
                ease: motionEase.exit,
              },
              0,
            )
          }
          tl.to(pie, { opacity: 0, y: 12, duration: 0.3, ease: motionEase.exit }, 0)
          if (nombre) tl.to(nombre, { yPercent: 105, duration: 0.5, ease: motionEase.exit }, 0.05)
          tl.to(root, { autoAlpha: 0, duration: C.fondo, ease: motionEase.ui }, C.fondoSalidaDemora)
        }
        tl.call(() => {
          marcar('cerrada')
          // Cerrada del todo: la próxima vez arranca de cero (todos de frente, foco en el
          // primero y el carrusel al principio).
          setVolteado(null)
          setFoco(0)
          root.querySelector('[data-carta-lista]')?.scrollTo({ left: 0 })
          const flips = root.querySelectorAll('[data-carta-flip]')
          if (flips.length) gsap.set(flips, { rotationY: 0, opacity: 1 })
        })
      }
    },
    // `n`: si la carta llega con el overlay ya abierto, los cartelitos caen al llegar.
    { dependencies: [visible, reduced, n] },
  )

  // Un solo cartelito dado vuelta: el elegido gira a 180° y el resto vuelve a su frente.
  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const flips = root.querySelectorAll<HTMLElement>('[data-carta-flip]')
      flips.forEach((el, i) => {
        const destino = i === volteado ? 180 : 0
        if (Number(gsap.getProperty(el, 'rotationY')) === destino) return
        if (reduced) {
          gsap
            .timeline()
            .to(el, { opacity: 0, duration: motionDuration.reduced / 2, ease: motionEase.ui, overwrite: true })
            .set(el, { rotationY: destino })
            .to(el, { opacity: 1, duration: motionDuration.reduced / 2, ease: motionEase.ui })
        } else {
          gsap.to(el, { rotationY: destino, duration: motionDuration.carta.flip, ease: motionEase.scene, overwrite: true })
        }
      })
    },
    { dependencies: [volteado, reduced] },
  )

  // Foco: al abrir entra al overlay (cartelito actual o el diálogo); queda atrapado entre
  // CERRAR y el overlay; al cerrar vuelve a quien abrió (si sigue a la vista) o a CERRAR/MENU.
  useEffect(() => {
    const root = rootRef.current
    if (!root || !visible) return
    const previo = document.activeElement
    openerRef.current = previo instanceof HTMLElement && !root.contains(previo) ? previo : null
    const raf = requestAnimationFrame(() => {
      const actual = root.querySelector<HTMLElement>('[data-roving][tabindex="0"]')
      ;(actual ?? root).focus({ preventScroll: true })
    })
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const menu = document.querySelector<HTMLElement>('[data-menu-button]')
      atraparFoco(e, [...(menu ? [menu] : []), ...tabulables(root)])
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown, true)
      // El escenario saca el `inert` en el mismo commit: el que abrió ya es enfocable.
      requestAnimationFrame(() => {
        const opener = openerRef.current
        const destino =
          opener && opener.isConnected && !opener.closest('[inert]') && opener.getClientRects().length > 0
            ? opener
            : document.querySelector<HTMLElement>('[data-menu-button]')
        if (root.contains(document.activeElement) || document.activeElement === document.body) {
          destino?.focus({ preventScroll: true })
        }
      })
    }
  }, [visible])

  const activar = (i: number) => {
    const cat = categorias[i]
    if (!cat) return
    setFoco(i)
    if (volteado !== i) {
      setVolteado(i)
      return
    }
    void transicion(() => navegarACategoria(cat.slug))
  }

  const { contacto, marca, botones } = siteConfig
  const pieClase = 'font-ui text-etiqueta leading-relaxed uppercase text-champan'

  return (
    <div
      ref={rootRef}
      id="carta"
      role="dialog"
      aria-modal="true"
      aria-label={copy.carta.titulo}
      tabIndex={-1}
      data-carta-estado="cerrada"
      inert={!abierta}
      className="invisible fixed inset-0 z-[25] bg-tizon text-champan opacity-0 outline-none"
    >
      <div className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain [touch-action:pan-y]">
        <div className="flex min-h-full flex-col">
          {/* Arriba izq.: menú del día (a la derecha queda el botón CERRAR del navbar). */}
          <header className="flex min-h-[4.75rem] items-center px-4 pt-[env(safe-area-inset-top)] pr-36 sm:px-8 sm:pr-48">
            {hoy ? (
              <Reveal
                as="p"
                mode="words"
                active={visible}
                // Después de que se va el wordmark del navbar (mismo lugar).
                delay={0.3}
                className="font-ui text-etiqueta leading-snug font-semibold uppercase text-champan"
              >
                {hoy}
              </Reveal>
            ) : null}
          </header>

          {/* Cartelitos: fila en desktop, carrusel con snap en mobile. */}
          <div className="flex flex-1 items-center">
            {local.status === 'error' ? (
              <div data-carta-pie className="mx-auto flex flex-col items-center gap-4 px-6 text-center">
                <p className="font-serif text-subtitulo text-champan">{copy.carta.error}</p>
                <button
                  type="button"
                  onClick={retryLocal}
                  className="cursor-pointer rounded-full border border-champan/30 px-5 py-2.5 font-ui text-etiqueta font-semibold uppercase text-champan transition-colors hover:border-oro hover:text-oro"
                >
                  {copy.carta.reintentar}
                </button>
              </div>
            ) : (
              <ul
                aria-label={copy.carta.listaCategorias}
                data-carta-lista
                onKeyDown={(e) => teclaRoving(e, foco, n, setFoco)}
                className="flex w-full snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[calc(50%-min(31vw,8.5rem))] py-14 [scrollbar-width:none] [touch-action:pan-x_pan-y] lg:justify-center lg:gap-[clamp(1rem,2.2vw,2.5rem)] lg:overflow-visible lg:px-8 lg:py-10 [&::-webkit-scrollbar]:hidden"
              >
                {categorias.map((cat, i) => (
                  <CartaCard
                    key={cat.id}
                    categoria={cat}
                    index={i}
                    volteado={volteado === i}
                    tabStop={foco === i}
                    onActivar={activar}
                    onFoco={setFoco}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Pie: datos de contacto, reservar, rubro. */}
          <footer className="grid grid-cols-2 items-end gap-x-4 gap-y-6 px-4 pb-6 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
            <div data-carta-pie className="col-span-2 justify-self-center lg:order-2 lg:col-span-1">
              <a
                href={whatsappUrl(copy.reservar.mensaje)}
                target="_blank"
                rel="noreferrer"
                data-carta-reservar
                className="inline-flex items-center gap-6 rounded-xl border border-champan/40 px-6 py-3.5 font-ui text-ui font-semibold uppercase text-champan transition-colors duration-300 hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
              >
                {botones.reservar}
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
            <address data-carta-pie className={`not-italic lg:order-1 ${pieClase}`}>
              <span data-carta-direccion className="block">
                {local.data?.local.address ?? ' '}
              </span>
              <a href={`tel:${contacto.telefono.tel}`} className="hover:text-oro">
                {contacto.telefono.mostrar}
              </a>
            </address>
            <p data-carta-pie className={`text-right lg:order-3 ${pieClase}`}>
              <span className="block">{marca.rubro}</span>
              {/* En mobile el email corta después de la @, no a mitad de palabra. */}
              <a href={`mailto:${contacto.email}`} className="hover:text-oro">
                {contacto.email.split('@')[0]}@<wbr />
                {contacto.email.split('@')[1]}
              </a>
            </p>
          </footer>

          {/* Nombre gigante, ajustado al ancho exacto (entra con barrido desde abajo). */}
          <div aria-hidden="true" className="overflow-hidden px-4 sm:px-8">
            <div className="overflow-hidden">
              <span
                ref={nombreRef}
                data-carta-nombre
                // `pb`: la cola de la Q baja de la línea de base y la máscara la cortaba.
                className="inline-block pb-[0.07em] font-gigante leading-[0.8] whitespace-nowrap text-champan will-change-transform"
              >
                {marca.nombreGigante}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
