import { useEffect } from 'react'
import { Picture } from '@/components/Picture'
import { paneles } from '@/content/copy.es'
import { useReducedMotion } from '@/motion/useReducedMotion'
import { fotoEscenario, videoInfo } from '@/stage/assets'

/**
 * Media de los 6 paneles, apilado a pantalla completa dentro del marco.
 * Cada capa la mueve el escenario con GSAP (corte horizontal, zoom de la intro);
 * React no vuelve a tocar sus estilos después de montar.
 */

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
}

export function StageMedia({ layerRefs, videoRef, videoPlaying, initialIndex }: StageMediaProps) {
  return (
    <>
      {paneles.map((panel, i) => {
        const foto = fotoEscenario(i)
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
          </div>
        )
      })}
    </>
  )
}
