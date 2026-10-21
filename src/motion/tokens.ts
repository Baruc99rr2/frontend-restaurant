// Tokens de movimiento: duraciones (en segundos, convención GSAP) y easings.
// Todas las primitivas y transiciones del escenario leen de acá.

export const motionEase = {
  /** Entradas de texto, bloques y elementos que se acomodan. */
  enter: 'expo.out',
  /** Salidas cortas antes de un reemplazo (barridos, desenfoque inicial). */
  exit: 'power2.in',
  /** Transiciones de escena, polígono del marco y barridos completos. */
  scene: 'power4.inOut',
  /** Interacciones de UI (barra activa del navbar, acordeón, controles). */
  ui: 'power2.out',
  /** Ondas continuas del líquido del botón MENU. */
  linear: 'none',
} as const

export const motionDuration = {
  /** Degradación única cuando `prefers-reduced-motion` está activo (200 ms). */
  reduced: 0.2,

  /** Primitivas (§6) */
  reveal: {
    chars: 0.7,
    words: 0.75,
    lines: 0.85,
    stagger: {
      chars: 0.018,
      words: 0.035,
      lines: 0.08,
    },
  },
  slideIn: 0.85,
  wipeSwap: {
    out: 0.26,
    in: 0.36,
  },
  blurSwap: {
    out: 0.3,
    in: 0.45,
    blurPx: 14,
    scale: 1.08,
  },
  countUp: 0.65,

  /** Navbar y botón MENU (§7) */
  navbarIndicator: 0.45,
  menuHover: 0.35,
  menuFill: 0.9,
  menuWaveLoop: 2.4,

  /** Escenario (§5, listo para F3–F4) */
  stage: {
    closedStep: 1.1,
    openClose: 1.4,
    openStepLock: 2.0,
    openStep: {
      textOut: 0.45,
      frameExpandDelay: 0.2,
      frameExpand: 0.5,
      panelSwapDelay: 0.6,
      panelSwap: 0.8,
      frameInsetDelay: 1.4,
      frameInset: 0.5,
      textInDelay: 1.8,
      textIn: 0.8,
    },
  },
} as const

export const motionTokens = {
  ease: motionEase,
  duration: motionDuration,
} as const
