import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { siteConfig } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

/**
 * Mapa Leaflet diferido de CONTACTO (§8, ref. 05). Es el fondo de la sección: vive en la capa
 * de CONTACTO del escenario (a pantalla completa, recortado por el marco).
 * - Teselas OpenStreetMap con filtro oscuro `invert(1) hue-rotate(180deg) grayscale(.6) brightness(.85)`
 *   aplicado SOLO sobre `.leaflet-tile-pane` (nunca sobre el marcador ni los controles).
 * - Marcador SVG dorado con la forma del marco inclinado (`--marco-rotacion`).
 * - Zoom con rueda y arrastre deshabilitados al entrar para no robar el paso de sección del
 *   escenario; se habilitan con clic/toque en el mapa (o en el aviso) o con `Ctrl + rueda`.
 *   Activo, el mapa se queda con sus gestos (`data-stage-gestos-propios`). Al salir de
 *   CONTACTO vuelve a bloquearse.
 * - Atribución OSM visible en todo momento.
 */

type Props = {
  /** CONTACTO abierto y quieto: al dejar de serlo, el mapa se vuelve a bloquear. */
  active: boolean
}

/** Margen del marco abierto: los avisos se ubican dentro de lo que se ve. */
const INSET = 'clamp(12px,1.6vw,28px)'

export default function ContactoMapa({ active }: Props) {
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const escudoRef = useRef<HTMLDivElement | null>(null)
  const badgeRef = useRef<HTMLButtonElement | null>(null)
  const touchMovedRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const interactivoRef = useRef(false)
  const encuadrarRef = useRef<() => void>(() => {})

  const reduced = useReducedMotion()
  const [interactive, setInteractive] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<number>(siteConfig.mapa.zoom)
  const [isCoarse] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false,
  )

  const enableMap = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.dragging.enable()
    map.scrollWheelZoom.enable()
    map.touchZoom.enable()
    map.doubleClickZoom.enable()
    interactivoRef.current = true
    setInteractive(true)
  }, [])

  const disableMap = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.dragging.disable()
    map.scrollWheelZoom.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
    interactivoRef.current = false
    // Al volver a bloquearse, el mapa vuelve al encuadre inicial.
    encuadrarRef.current()
    setInteractive(false)
  }, [])

  // Si se sale de CONTACTO, el mapa vuelve a quedar bloqueado para la próxima entrada.
  useEffect(() => {
    if (!active && interactive) {
      disableMap()
    }
  }, [active, interactive, disableMap])

  useEffect(() => {
    const el = mapElRef.current
    if (!el || mapRef.current) return

    const { lat, lng, zoom } = siteConfig.mapa

    const map = L.map(el, {
      center: [lat, lng],
      zoom,
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'quebracho-osm-tile',
    }).addTo(map)

    const markerIcon = L.divIcon({
      className: 'quebracho-marker-icon',
      iconSize: [44, 54],
      iconAnchor: [22, 27],
      html: `
        <div data-contacto-marcador style="width:44px;height:54px;display:grid;place-items:center;transform:rotate(var(--marco-rotacion,-16deg));filter:drop-shadow(0 6px 14px color-mix(in srgb, var(--color-noche) 75%, transparent));">
          <svg viewBox="0 0 44 54" width="44" height="54" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="4" y="4" width="36" height="46" fill="var(--color-tizon)" fill-opacity="0.9" stroke="var(--color-oro)" stroke-width="2.5" />
            <circle cx="22" cy="27" r="6" fill="var(--color-oro)" />
          </svg>
        </div>
      `,
    })

    L.marker([lat, lng], {
      icon: markerIcon,
      interactive: false,
      keyboard: false,
    }).addTo(map)

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom())
    })

    mapRef.current = map

    // El mapa ocupa la pantalla y la tarjeta tapa el centro: el marcador va a la zona libre
    // (a la derecha en horizontal, arriba a la izquierda en vertical). Mientras el mapa está
    // activo no se reencuadra (es del usuario).
    const encuadrar = () => {
      if (interactivoRef.current) return
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      const horizontal = w >= 1024 && w > h
      const [px, py] = horizontal ? [w * 0.72, h * 0.5] : [w * 0.22, h * 0.16]
      map.setView([lat, lng], zoom, { animate: false })
      map.panBy([w / 2 - px, h / 2 - py], { animate: false })
    }
    encuadrarRef.current = encuadrar
    encuadrar()

    const raf = requestAnimationFrame(() => {
      map.invalidateSize()
      encuadrar()
    })

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            map.invalidateSize()
            encuadrar()
          })
        : null
    ro?.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Ctrl + rueda sobre el mapa bloqueado: activa y hace zoom. El listener es nativo y no
  // pasivo: con el de React (pasivo) `preventDefault` no frena el zoom de la página.
  useEffect(() => {
    const escudo = escudoRef.current
    if (!escudo || interactive) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      e.stopPropagation()
      enableMap()
      const map = mapRef.current
      if (!map) return
      if (e.deltaY < 0) map.zoomIn()
      else if (e.deltaY > 0) map.zoomOut()
    }
    escudo.addEventListener('wheel', onWheel, { passive: false })
    return () => escudo.removeEventListener('wheel', onWheel)
  }, [interactive, enableMap])

  // Aparición/ocultación del aviso de clic/toque en el mapa.
  useGSAP(
    () => {
      const badge = badgeRef.current
      if (!badge) return
      gsap.killTweensOf(badge)
      gsap.to(badge, {
        autoAlpha: interactive ? 0 : 1,
        y: interactive ? -6 : 0,
        duration: reduced ? motionDuration.reduced : 0.25,
        ease: motionEase.ui,
      })
    },
    { dependencies: [interactive, reduced] },
  )

  const avisoTexto = isCoarse ? copy.contacto.moverMapa.tocar : copy.contacto.moverMapa.clic

  return (
    <div
      data-contacto-mapa
      data-contacto-interactivo={interactive ? 'true' : 'false'}
      data-contacto-zoom={zoomLevel}
      // Activo, el mapa se queda con sus gestos: el escenario no los cuenta como pasos.
      data-stage-gestos-propios={interactive ? '' : undefined}
      className="pointer-events-auto relative isolate z-0 size-full overflow-hidden bg-tizon"
    >
      {/* Contenedor Leaflet: el filtro oscuro va SOLO en .leaflet-tile-pane */}
      <div
        ref={mapElRef}
        className={`isolate z-0 size-full !bg-tizon [&_.leaflet-tile]:!mix-blend-normal [&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_grayscale(0.6)_brightness(0.85)] ${
          interactive ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      />

      {/* Escudo transparente mientras el mapa no fue activado: deja pasar la rueda y el swipe
          al escenario (`useStepInput`) y activa el mapa con clic/tap. */}
      {!interactive && (
        <div
          ref={escudoRef}
          data-contacto-mapa-escudo
          aria-hidden="true"
          onTouchStart={(e) => {
            const t = e.touches[0]
            touchMovedRef.current = false
            touchStartRef.current = t ? { x: t.clientX, y: t.clientY } : null
          }}
          onTouchMove={(e) => {
            const t = e.touches[0]
            const s = touchStartRef.current
            if (t && s && Math.hypot(t.clientX - s.x, t.clientY - s.y) > 10) {
              touchMovedRef.current = true
            }
          }}
          onClick={() => {
            if (touchMovedRef.current) {
              touchMovedRef.current = false
              return
            }
            enableMap()
          }}
          className="absolute inset-0 z-[400] cursor-pointer [touch-action:pan-y]"
        />
      )}

      {/* Avisos dentro del marco abierto (el mapa ocupa la pantalla completa). */}
      <div className="pointer-events-none absolute z-[450]" style={{ inset: INSET }}>
        <button
          ref={badgeRef}
          type="button"
          data-contacto-mapa-activar
          onClick={enableMap}
          className="pointer-events-auto absolute top-20 right-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-champan/25 bg-noche/70 px-4 py-2 font-ui text-etiqueta font-semibold uppercase tracking-[0.12em] text-champan backdrop-blur-md transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:right-6 landscape:lg:top-24"
        >
          {avisoTexto}
        </button>

        {/* Atribución obligatoria de OpenStreetMap, siempre visible y sin filtro oscuro */}
        <a
          data-contacto-atribucion
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto absolute top-34 right-4 rounded-full border border-champan/20 bg-noche/70 px-3 py-1 font-ui text-[0.6875rem] tracking-wide text-champan/80 backdrop-blur-md transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:right-6 landscape:lg:top-auto landscape:lg:right-auto landscape:lg:bottom-5 landscape:lg:left-[44%]"
        >
          {copy.contacto.atribucionMapa}
        </a>
      </div>
    </div>
  )
}
