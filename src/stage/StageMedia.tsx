import { useEffect, useRef, type ComponentType } from 'react'
import { Picture } from '@/components/Picture'
import { paneles } from '@/content/copy.es'
import type { PanelKey } from '@/content/editorial'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'
import { ContactoFondo } from '@/sections/Contacto/ContactoPanel'
import { EventosFondo } from '@/sections/Eventos/EventosPanel'
import { LaCasaFondo } from '@/sections/LaCasa/LaCasaPanel'
import { PreguntasFondo } from '@/sections/Preguntas/PreguntasPanel'
import { fotoEscenario, videoInfo } from '@/stage/assets'

/**
 * Media de los 6 paneles, apilado a pantalla completa dentro del marco.
 * Cada capa la mueve el escenario con GSAP (corte horizontal, zoom de la intro, paso abierto);
 * React no vuelve a tocar sus estilos después de montar.
 *
 * En modo abierto cada capa suma, encima de su foto o video, el velo y el fondo propio de
 * la sección (gradiente, veta, mapa). Viven en la capa y no en el texto del panel: así en el
 * paso entre secciones (§5) el fondo entra y sale con su panel, igual en todas las secciones.
 */

/** Fondo propio de cada sección en modo abierto (las que no tienen, muestran su foto o video). */
const FONDOS: Partial<Record<PanelKey, ComponentType>> = {
  'la-casa': LaCasaFondo,
  eventos: EventosFondo,
  preguntas: PreguntasFondo,
  contacto: ContactoFondo,
}

type StageVideoProps = {
  playing: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
}

/**
 * Video de HOME (§5 Video): `muted playsinline loop preload="metadata"` con póster.
 * Corre solo con `playing` (HOME abierto), la pestaña visible y sin reduced motion
 * (con reduced motion queda el póster).
 */
function StageVideo({ playing, videoRef }: StageVideoProps) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const sync = () => {
      if (playing && !reduced && !document.hidden) {
        void video.play().catch(() => {
          // Autoplay bloqueado: queda el primer frame.
        })
      } else {
        video.pause()
      }
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [playing, reduced, videoRef])

  if (!videoInfo) return <div className="size-full bg-tizon" />

  return (
    <video
      ref={videoRef}
      className="size-full bg-cover bg-center object-cover"
      style={{ backgroundImage: `url(${videoInfo.placeholder})` }}
      src={videoInfo.src}
      poster={videoInfo.poster}
      muted
      playsInline
      loop
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    />
  )
}

type StageMediaProps = {
  /** Capas por índice de panel (las mueve el escenario). */
  layerRefs: React.RefObject<(HTMLDivElement | null)[]>
  videoRef: React.RefObject<HTMLVideoElement | null>
  videoPlaying: boolean
  /** Panel visible al montar: su foto carga con prioridad alta, el resto después. */
  initialIndex: number
  /** Abriendo o abierto: velo y fondos de sección visibles (fundido al abrir y cerrar). */
  abierto: boolean
}

export function StageMedia({ layerRefs, videoRef, videoPlaying, initialIndex, abierto }: StageMediaProps) {
  const reduced = useReducedMotion()
  const capasRef = useRef<(HTMLDivElement | null)[]>([])

  // Velo + fondo de sección: fundido al abrir (con una demora corta) y al cerrar.
  useGSAP(
    () => {
      gsap.to(capasRef.current, {
        autoAlpha: abierto ? 1 : 0,
        duration: reduced ? motionDuration.reduced : motionDuration.stage.open.velo,
        delay: abierto && !reduced ? 0.3 : 0,
        ease: motionEase.ui,
        overwrite: true,
      })
    },
    { dependencies: [abierto, reduced] },
  )

  return (
    <>
      {paneles.map((panel, i) => {
        const foto = fotoEscenario(i)
        const Fondo = FONDOS[panel.key]
        return (
          <div
            key={panel.key}
            ref={(el) => {
              layerRefs.current[i] = el
            }}
            data-panel={panel.key}
            className="absolute inset-0 overflow-hidden will-change-transform"
            style={{ visibility: i === initialIndex ? 'visible' : 'hidden' }}
          >
            {panel.key === 'home' ? (
              <StageVideo playing={videoPlaying} videoRef={videoRef} />
            ) : foto ? (
              <Picture
                image={foto}
                shape="paisaje"
                alt=""
                loading="eager"
                fetchPriority={i === initialIndex ? 'high' : 'low'}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full bg-tizon" />
            )}
            {/* Velo suave: título y etiquetas se leen sobre cualquier foto. */}
            <div className="pointer-events-none absolute inset-0 bg-noche/25" />
            {/* Modo abierto: velo + fondo propio de la sección. */}
            <div
              ref={(el) => {
                capasRef.current[i] = el
              }}
              data-open-capa={panel.key}
              className="pointer-events-none invisible absolute inset-0 opacity-0"
            >
              <div className="velo absolute inset-0" />
              {Fondo ? <Fondo /> : null}
            </div>
          </div>
        )
      })}
    </>
  )
}
