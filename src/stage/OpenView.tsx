import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Frame as FrameIcon } from 'lucide-react'
import { cuandoEsteLibre } from '@/app/libre'
import { siteConfig } from '@/config/site.config'
import { copy, paneles, type Panel } from '@/content/copy.es'
import type { PanelKey } from '@/content/editorial'
import { gsap, useGSAP } from '@/motion/gsap'
import { Reveal } from '@/motion/primitives'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'
import { HomePanel } from '@/sections/Home/HomePanel'
import { LaCasaPanel } from '@/sections/LaCasa/LaCasaPanel'
import { PlatosPanel } from '@/sections/Platos/PlatosPanel'
import { EventosPanel } from '@/sections/Eventos/EventosPanel'
import { PreguntasPanel } from '@/sections/Preguntas/PreguntasPanel'
import { ContactoPanel } from '@/sections/Contacto/ContactoPanel'

/**
 * Modo abierto (§5, §8): una sección por panel, apiladas encima del marco.
 * Los textos de un panel están activos (entran con sus reveals) solo cuando
 * `textsPanel` es ese panel; el escenario decide cuándo (abrir, paso, cerrar) y
 * desvanece los `[data-open-text]` del panel saliente antes de cambiarlo.
 */

type Props = {
  rootRef: RefObject<HTMLDivElement | null>
  /** Panel cuyos textos se muestran (null = ninguno). */
  textsPanel: number | null
  /** Abriendo o abierto: "Vista general" visible (el velo y los fondos van en `StageMedia`). */
  visible: boolean
  onClose: () => void
  onVerCarta: () => void
  onGoTo: (index: number) => void
  /**
   * Terminada la intro y con el navegador libre: se montan los paneles que faltan, de a uno
   * por rato libre (el primer render queda liviano y no hay una sola tarea larga).
   */
  montarTodo: boolean
}

/**
 * Secciones cuyo fondo (en la capa del escenario, debajo) se usa con el mouse: la sección
 * deja pasar los clics y solo sus bloques los toman (`pointer-events-auto`). CONTACTO → mapa.
 */
const FONDO_INTERACTIVO: readonly PanelKey[] = ['contacto']

/** Placeholder simple para los paneles que llegan en F5–F8. */
function PanelPlaceholder({ panel, active }: { panel: Panel; active: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div data-open-text>
        <Reveal as="h2" mode="chars" active={active} className="font-gigante text-display uppercase text-champan">
          {panel.titulo}
        </Reveal>
      </div>
      <div data-open-text>
        <Reveal as="p" mode="words" active={active} delay={0.2} className="max-w-md font-serif text-subtitulo text-champan/85">
          {`${panel.izquierda.join(' ')} ${panel.derecha.join(' ')}`}
        </Reveal>
      </div>
      <div data-open-text>
        <Reveal as="p" mode="words" active={active} delay={0.35} className="font-ui text-etiqueta uppercase text-ceniza">
          {copy.escenario.enPreparacion}
        </Reveal>
      </div>
    </div>
  )
}

export function OpenView({ rootRef, textsPanel, visible, onClose, onVerCarta, onGoTo, montarTodo }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const reduced = useReducedMotion()

  // Paneles montados: el activo siempre (también si se entra por hash), los ya vistos, y en
  // reposo el resto de a uno. Montado no se desmonta (conserva su estado).
  const [vistos, setVistos] = useState<ReadonlySet<number>>(() => new Set(textsPanel === null ? [] : [textsPanel]))
  const [enReposo, setEnReposo] = useState(0)
  // Estado derivado durante el render (patrón de React), sin efecto: el panel nuevo se monta ya.
  if (textsPanel !== null && !vistos.has(textsPanel)) setVistos(new Set(vistos).add(textsPanel))
  useEffect(() => {
    if (!montarTodo || enReposo >= paneles.length) return
    return cuandoEsteLibre(() => setEnReposo((n) => n + 1), 1000)
  }, [montarTodo, enReposo])

  // Botón "Vista general": fundido al abrir/cerrar (mismo ritmo que el velo de `StageMedia`).
  useGSAP(
    () => {
      gsap.to(closeRef.current, {
        autoAlpha: visible ? 1 : 0,
        duration: reduced ? motionDuration.reduced : motionDuration.stage.open.velo,
        delay: visible && !reduced ? 0.3 : 0,
        ease: motionEase.ui,
      })
    },
    { dependencies: [visible, reduced] },
  )

  // El panel que pasa a mostrar sus textos arranca limpio (el escenario lo había desvanecido).
  useLayoutEffect(() => {
    if (textsPanel === null) return
    const key = paneles[textsPanel]?.key
    const items = rootRef.current?.querySelectorAll(`[data-open-panel="${key}"] [data-open-text]`)
    if (items?.length) gsap.set(items, { clearProps: 'opacity,transform' })
  }, [textsPanel, rootRef])

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-20">
      {paneles.map((panel, i) => {
        const active = textsPanel === i
        const montado = active || vistos.has(i) || i < enReposo
        return (
          <section
            key={panel.key}
            data-open-panel={panel.key}
            aria-label={panel.navbar ?? panel.titulo}
            aria-hidden={!active}
            inert={!active}
            // Inactivo: sus textos ya están ocultos (el escenario los desvanece antes de cambiar
            // `textsPanel`), así que no se maqueta ni se pinta (`content-visibility: hidden`):
            // menos trabajo al cargar y sin saltos de layout cuando llegan los datos.
            className={`absolute inset-0 ${active ? '' : '[content-visibility:hidden]'} ${active && !FONDO_INTERACTIVO.includes(panel.key) ? 'pointer-events-auto' : ''}`}
          >
            {!montado ? null : panel.key === 'home' ? (
              <HomePanel active={active} onVerCarta={onVerCarta} onConocerLaCasa={() => onGoTo(1)} />
            ) : panel.key === 'la-casa' ? (
              <LaCasaPanel active={active} />
            ) : panel.key === 'platos' ? (
              <PlatosPanel active={active} onVerCarta={onVerCarta} />
            ) : panel.key === 'eventos' ? (
              <EventosPanel active={active} />
            ) : panel.key === 'preguntas' ? (
              <PreguntasPanel active={active} />
            ) : panel.key === 'contacto' ? (
              <ContactoPanel active={active} onVolverAlInicio={() => onGoTo(0)} />
            ) : (
              <PanelPlaceholder panel={panel} active={active} />
            )}
          </section>
        )
      })}

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        tabIndex={visible ? 0 : -1}
        className="pointer-events-auto invisible absolute right-[max(1.5rem,env(safe-area-inset-right))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-10 area-tactil inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-champan/25 bg-noche/60 px-5 py-3 font-ui text-etiqueta font-semibold uppercase text-champan opacity-0 backdrop-blur-md transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro"
      >
        <FrameIcon className="size-4" aria-hidden="true" />
        {siteConfig.botones.vistaGeneral}
      </button>
    </div>
  )
}
