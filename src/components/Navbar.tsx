import { useCallback, useEffect, useRef, useState } from 'react'
import { ListFilter, X } from 'lucide-react'
import { siteConfig } from '@/config/site.config'
import { paneles, type Panel } from '@/content/copy.es'
import type { PanelKey } from '@/content/editorial'
import { MenuButton } from '@/components/MenuButton'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

type NavItem = Panel & { navbar: string }

const NAV_ITEMS: NavItem[] = paneles.filter((p): p is NavItem => p.navbar !== null)

export type NavbarProps = {
  activeKey: PanelKey
  onSelect: (key: PanelKey) => void
  menuOpen: boolean
  onToggleMenu: () => void
  /** Si es `false` (ej.: modo cerrado), oculta la píldora central y deja wordmark + MENU. */
  showLinks?: boolean
  /** Con la carta abierta: el wordmark se va (fundido) y queda solo el botón CERRAR. */
  ocultarMarca?: boolean
  className?: string
}

/**
 * Navbar (§7, refs 01–02 y 06):
 * - Transparente.
 * - Izquierda: wordmark Caslon de dos líneas (`siteConfig.marca.wordmark`).
 * - Centro (desktop): píldora de vidrio (`backdrop-blur`) con los 5 links de `copy.es.ts`
 *   y barra dorada (`bg-oro`) sobre el ítem activo que se desliza con GSAP.
 * - Mobile: wordmark + botón de links (abre lámina simple con los 5 links) + botón MENU.
 * - Derecha: `MenuButton` siempre visible.
 */
export function Navbar({
  activeKey,
  onSelect,
  menuOpen,
  onToggleMenu,
  showLinks = true,
  ocultarMarca = false,
  className = '',
}: NavbarProps) {
  const navRef = useRef<HTMLElement | null>(null)
  const pillRef = useRef<HTMLUListElement | null>(null)
  const indicatorRef = useRef<HTMLSpanElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const indicatorTlRef = useRef<gsap.core.Timeline | null>(null)
  const sheetTlRef = useRef<gsap.core.Timeline | null>(null)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const hasMeasuredRef = useRef(false)

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const reduced = useReducedMotion()
  // Sin links (modo cerrado) la lámina queda cerrada aunque estuviera abierta.
  const sheetOpen = mobileSheetOpen && showLinks
  const linksRef = useRef<HTMLElement | null>(null)
  const sheetButtonRef = useRef<HTMLButtonElement | null>(null)
  const linksFirstRef = useRef(true)
  const marcaRef = useRef<HTMLButtonElement | null>(null)
  const marcaFirstRef = useRef(true)

  // Wordmark: fundido al abrir/cerrar la carta (su lugar lo toma el menú del día).
  useGSAP(
    () => {
      const vars = { autoAlpha: ocultarMarca ? 0 : 1 }
      if (marcaFirstRef.current) {
        marcaFirstRef.current = false
        gsap.set(marcaRef.current, vars)
        return
      }
      // Se escalona con el menú del día de la carta, que ocupa el mismo lugar: al abrir el
      // wordmark se va antes de que entre; al cerrar vuelve cuando el texto ya salió.
      gsap.to(marcaRef.current, {
        ...vars,
        duration: reduced ? motionDuration.reduced : ocultarMarca ? 0.25 : motionDuration.navbarIndicator,
        delay: reduced || ocultarMarca ? 0 : motionDuration.reveal.exit,
        ease: motionEase.ui,
        overwrite: true,
      })
    },
    { dependencies: [ocultarMarca, reduced] },
  )

  // Píldora y botón de links: fundido + leve desplazamiento al mostrarse/ocultarse.
  useGSAP(
    () => {
      const targets = [linksRef.current, sheetButtonRef.current].filter(Boolean)
      const vars = { autoAlpha: showLinks ? 1 : 0, y: showLinks || reduced ? 0 : -8 }
      if (linksFirstRef.current) {
        linksFirstRef.current = false
        gsap.set(targets, vars)
        return
      }
      gsap.to(targets, {
        ...vars,
        duration: reduced ? motionDuration.reduced : motionDuration.navbarIndicator,
        delay: showLinks && !reduced ? 0.15 : 0,
        ease: motionEase.ui,
      })
    },
    { dependencies: [showLinks, reduced] },
  )

  const syncIndicator = useCallback(
    (animate: boolean) => {
      const pill = pillRef.current
      const indicator = indicatorRef.current
      if (!pill || !indicator) return

      indicatorTlRef.current?.kill()
      indicatorTlRef.current = null

      const activeBtn = itemRefs.current[activeKey]
      if (!activeBtn || !showLinks) {
        if (!animate) {
          gsap.set(indicator, { opacity: 0 })
        } else {
          const tl = gsap.timeline()
          tl.to(indicator, {
            opacity: 0,
            duration: reduced ? motionDuration.reduced : motionDuration.navbarIndicator * 0.6,
            ease: motionEase.ui,
          })
          indicatorTlRef.current = tl
        }
        return
      }

      const pillRect = pill.getBoundingClientRect()
      const btnRect = activeBtn.getBoundingClientRect()
      const padX = 14
      const x = btnRect.left - pillRect.left + padX
      const width = Math.max(16, btnRect.width - padX * 2)

      if (!animate || !hasMeasuredRef.current) {
        hasMeasuredRef.current = true
        gsap.set(indicator, { x, width, opacity: 1 })
        return
      }

      const tl = gsap.timeline()
      if (reduced) {
        tl.to(indicator, {
          opacity: 0,
          duration: motionDuration.reduced * 0.4,
          ease: motionEase.ui,
        })
        tl.set(indicator, { x, width })
        tl.to(indicator, {
          opacity: 1,
          duration: motionDuration.reduced,
          ease: motionEase.ui,
        })
      } else {
        tl.to(indicator, {
          x,
          width,
          opacity: 1,
          duration: motionDuration.navbarIndicator,
          ease: motionEase.enter,
        })
      }
      indicatorTlRef.current = tl
    },
    [activeKey, reduced, showLinks],
  )

  useGSAP(
    () => {
      syncIndicator(true)
      return () => {
        indicatorTlRef.current?.kill()
      }
    },
    { dependencies: [syncIndicator], scope: navRef },
  )

  // Mantener alineada la barra dorada al redimensionar (sin animar).
  // El observer se crea una sola vez: si se recreara al cambiar de ítem, su primera
  // notificación reposicionaría la barra de golpe y mataría el deslizamiento.
  const syncRef = useRef(syncIndicator)
  useEffect(() => {
    syncRef.current = syncIndicator
  }, [syncIndicator])
  useEffect(() => {
    const pill = pillRef.current
    if (!pill || typeof ResizeObserver === 'undefined') return
    let first = true
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false
        return
      }
      syncRef.current(false)
    })
    ro.observe(pill)
    return () => ro.disconnect()
  }, [showLinks])

  // Cerrar lámina mobile con Escape.
  useEffect(() => {
    if (!mobileSheetOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileSheetOpen])

  // Animar apertura/cierre de la lámina mobile.
  useGSAP(
    () => {
      const sheet = sheetRef.current
      if (!sheet) return

      sheetTlRef.current?.kill()
      sheetTlRef.current = null

      const tl = gsap.timeline()
      sheetTlRef.current = tl

      if (sheetOpen) {
        gsap.set(sheet, { display: 'block' })
        tl.fromTo(
          sheet,
          { opacity: 0, y: reduced ? 0 : -10 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? motionDuration.reduced : 0.3,
            ease: motionEase.ui,
          },
        )
      } else {
        tl.to(sheet, {
          opacity: 0,
          y: reduced ? 0 : -8,
          duration: reduced ? motionDuration.reduced : 0.22,
          ease: motionEase.ui,
        })
        tl.set(sheet, { display: 'none' })
      }

      return () => {
        tl.kill()
      }
    },
    { dependencies: [sheetOpen, reduced], scope: navRef },
  )

  const [linea1, linea2] = siteConfig.marca.wordmark

  const handleSelect = (key: PanelKey) => {
    setMobileSheetOpen(false)
    onSelect(key)
  }

  return (
    <header
      ref={navRef}
      className={`@container relative z-30 flex w-full items-center justify-between gap-3 bg-transparent px-4 py-4 sm:gap-4 sm:px-8 ${className}`}
    >
      {/* Izquierda: Wordmark Caslon de dos líneas (ref. 06) */}
      <button
        ref={marcaRef}
        type="button"
        onClick={() => handleSelect('home')}
        className="group shrink-0 cursor-pointer text-left font-serif text-champan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-oro"
      >
        <span className="block text-subtitulo leading-[0.92] tracking-[0.06em] uppercase transition-colors group-hover:text-oro">
          {linea1}
        </span>
        <span className="mt-0.5 block text-etiqueta leading-none tracking-[0.16em] uppercase text-champan/85">
          {linea2}
        </span>
      </button>

      {/* Centro (Desktop): Píldora de vidrio con barra dorada deslizante (refs 01–02) */}
      {/* Siempre montada: con `showLinks` cambia con fundido, nunca aparece de golpe. */}
      <nav
        ref={linksRef}
        aria-label="Secciones principales"
        aria-hidden={!showLinks}
        className="hidden @min-[75rem]:block"
      >
          <ul
            ref={pillRef}
            className="relative flex items-center gap-1 rounded-full border border-champan/15 bg-champan/10 px-3 py-1.5 backdrop-blur-md"
          >
            {/* Barra dorada superior que se desliza entre ítems */}
            <span
              ref={indicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 h-[3px] rounded-full bg-oro opacity-0 will-change-[transform,width]"
            />
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeKey
              return (
                <li key={item.key}>
                  <button
                    ref={(el) => {
                      itemRefs.current[item.key] = el
                    }}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleSelect(item.key)}
                    className={`relative cursor-pointer whitespace-nowrap rounded-full px-3.5 py-2 font-ui text-etiqueta font-semibold uppercase tracking-[0.15em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro ${
                      isActive ? 'text-champan' : 'text-champan/70 hover:text-champan'
                    }`}
                  >
                    {item.navbar}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

      {/* Derecha: Botón de links (mobile) + Botón MENU */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <button
            ref={sheetButtonRef}
            type="button"
            aria-hidden={!showLinks}
            aria-expanded={sheetOpen}
            aria-controls="navbar-mobile-sheet"
            aria-label={sheetOpen ? siteConfig.botones.cerrar : 'Secciones'}
            onClick={() => setMobileSheetOpen((v) => !v)}
            className="relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-champan/20 bg-champan/10 text-champan backdrop-blur-md transition-colors hover:border-oro hover:text-oro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro @min-[75rem]:hidden"
          >
            {/* Los dos íconos quedan montados y se cruzan (nada aparece sin transición). */}
            <ListFilter
              aria-hidden="true"
              className={`absolute size-5 transition-[opacity,transform] duration-300 ${
                sheetOpen ? 'scale-75 rotate-90 opacity-0' : 'opacity-100'
              }`}
            />
            <X
              aria-hidden="true"
              className={`absolute size-5 transition-[opacity,transform] duration-300 ${
                sheetOpen ? 'opacity-100' : 'scale-75 -rotate-90 opacity-0'
              }`}
            />
          </button>

        <MenuButton open={menuOpen} onToggle={onToggleMenu} />
      </div>

      {/* Lámina simple con los 5 links para mobile */}
        <div
          id="navbar-mobile-sheet"
          ref={sheetRef}
          style={{ display: 'none' }}
          className="absolute top-full right-4 left-4 mt-2 overflow-hidden rounded-2xl border border-champan/15 bg-tizon/95 p-3 backdrop-blur-md @min-[75rem]:hidden"
        >
          <ul className="divide-y divide-champan/10">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeKey
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleSelect(item.key)}
                    className={`flex w-full cursor-pointer items-center justify-between px-3 py-3 text-left font-ui text-ui font-semibold uppercase tracking-[0.12em] transition-colors ${
                      isActive ? 'text-oro' : 'text-champan hover:text-oro'
                    }`}
                  >
                    <span>{item.navbar}</span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-6 rounded-full transition-opacity ${
                        isActive ? 'bg-oro opacity-100' : 'bg-oro opacity-0'
                      }`}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
    </header>
  )
}
