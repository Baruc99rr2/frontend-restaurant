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
  /**
   * Corte horizontal del media dentro del marco cerrado (ref. 07). Más suave en el medio
   * que `scene`: el media recorre toda la pantalla y el marco ve solo el tramo central.
   */
  slide: 'power2.inOut',
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
    /** Salida hacia abajo (mismo stagger que la entrada). */
    exit: 0.42,
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

  /** Escenario (§5) */
  stage: {
    intro: {
      /** Tope de espera del loader (póster + fuentes + canplay). */
      loaderMax: 3.5,
      /** Anillo que completa lo que falte al estar listo. */
      ringFinish: 0.35,
      loaderOut: 0.45,
      /** El marco crece de escala 0.25 a la forma cerrada. */
      frameGrow: 1.6,
      /** Zoom del media durante el crecimiento (1.15 → 1). */
      mediaZoom: 1.15,
      /** Momento del crecimiento (0–1) en que entran título, etiquetas y wordmark. */
      textsAt: 0.72,
      chromeFade: 0.6,
    },
    closedStep: 1.1,
    closed: {
      /** Demora de la entrada del título nuevo (sale el viejo primero). */
      titleInDelay: 0.38,
      labelsRoll: 0.85,
      labelsStagger: 0.07,
      /** Expandir/colapsar la lista de números laterales. */
      indexExpand: 0.4,
    },
    openClose: 1.4,
    /** Textos del modo cerrado al abrir/cerrar. */
    openCloseTexts: 0.4,
    open: {
      /** Al abrir: momento (s) en que entran los textos del panel. */
      textsAt: 0.55,
      /** Al cerrar: los textos del panel salen antes de que el marco se achique. */
      frameCloseDelay: 0.3,
      /** Salida de textos del panel: opacity + y, stagger corto (§5). */
      textOutY: -12,
      textOutStagger: 0.04,
      /** Panel saliente en el paso abierto: sube un 30% y se oscurece. */
      outgoingYPercent: 30,
      outgoingBrightness: 0.35,
      /** Velo sobre el media del modo abierto. */
      velo: 0.8,
    },
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
