import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { siteConfig } from '@/config/site.config'
import { copy } from '@/content/copy.es'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

/**
 * Mapa Leaflet diferido de CONTACTO (§8, ref. 05).
 * - Teselas OpenStreetMap con filtro oscuro `invert(1) hue-rotate(180deg) grayscale(.6) brightness(.85)`
 *   aplicado SOLO sobre `.leaflet-tile-pane` (nunca sobre el marcador ni los controles).
 * - Marcador SVG dorado con la forma del marco inclinado (`--marco-rotacion`).
 * - Zoom con rueda y arrastre táctil deshabilitados inicialmente para no robar el paso de sección
 *   del escenario; se habilitan al hacer clic/tocar el mapa (o el aviso) o con `Ctrl + rueda`.
 * - Atribución OSM visible en todo momento.
 */

type Props = {
  active: boolean
}

export default function ContactoMapa({ active }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const badgeRef = useRef<HTMLButtonElement | null>(null)
  const touchMovedRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

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
    setInteractive(true)
  }, [])

  const disableMap = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.dragging.disable()
    map.scrollWheelZoom.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
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
      fadeAnimation: false,
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
        <div data-contacto-marcador style="width:44px;height:54px;display:grid;place-items:center;transform:rotate(var(--marco-rotacion,-16deg));filter:drop-shadow(0 6px 14px rgba(0,0,0,0.75));">
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

    const raf = requestAnimationFrame(() => {
      map.invalidateSize()
    })

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            map.invalidateSize()
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

  // Animar aparición/ocultación del aviso de clic/toque en el mapa.
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

  const avisoTexto = isCoarse
    ? copy.contacto.zoomMapa.replace('Hacé clic', 'Tocá')
    : copy.contacto.zoomMapa

  return (
    <div
      ref={wrapRef}
      data-contacto-mapa
      data-contacto-interactivo={interactive ? 'true' : 'false'}
      data-contacto-zoom={zoomLevel}
      className="relative isolate z-0 size-full overflow-hidden bg-tizon"
    >
      {/* Contenedor Leaflet: el filtro oscuro va SOLO en .leaflet-tile-pane */}
      <div
        ref={mapElRef}
        className={`isolate z-0 size-full !bg-tizon [&_.leaflet-tile]:!mix-blend-normal [&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_grayscale(0.6)_brightness(0.85)] ${
          interactive ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      />

      {/* Escudo transparente mientras el mapa no fue activado:
          - Deja pasar el swipe táctil y la rueda normal al escenario (`useStepInput`).
          - Con clic/tap activa el mapa (`enableMap`).
          - Con Ctrl + rueda habilita y aplica zoom al mapa. */}
      {!interactive && (
        <div
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
          onWheel={(e) => {
            if (!e.ctrlKey) return
            e.preventDefault()
            e.stopPropagation()
            enableMap()
            const map = mapRef.current
            if (!map) return
            if (e.deltaY < 0) map.zoomIn()
            else if (e.deltaY > 0) map.zoomOut()
          }}
          className="absolute inset-0 z-[400] cursor-pointer [touch-action:pan-y]"
        />
      )}

      {/* Aviso discreto para activar el movimiento/zoom del mapa */}
      <button
        ref={badgeRef}
        type="button"
        data-contacto-mapa-activar
        onClick={enableMap}
        className="pointer-events-auto absolute top-20 right-4 z-[450] inline-flex cursor-pointer items-center gap-2 rounded-full border border-champan/25 bg-noche/70 px-4 py-2 font-ui text-etiqueta font-semibold uppercase tracking-[0.12em] text-champan backdrop-blur-md transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro sm:right-6 landscape:lg:top-24"
      >
        {avisoTexto}
      </button>

      {/* Atribución obligatoria de OpenStreetMap siempre visible y sin filtro oscuro */}
      <a
        data-contacto-atribucion
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto absolute top-20 left-4 z-[450] rounded-full border border-champan/20 bg-noche/70 px-3 py-1 font-ui text-[0.6875rem] tracking-wide text-champan/80 backdrop-blur-md transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro landscape:lg:top-auto landscape:lg:bottom-5 landscape:lg:left-[44%]"
      >
        {copy.contacto.atribucionMapa}
      </a>
    </div>
  )
}
