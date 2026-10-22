# ESTADO

Última actualización: 2026-10-21 — **v1.0.1: medios versionados y responsividad de 240 a 2560** (tag `v1.0.1-demo`). Próxima: F12 (conexión al backend, cuando haya un local real).
Repo remoto: https://github.com/Baruc99rr2/frontend-restaurant (público).

## Sub-fases

| Fase | Estado | Commit |
|---|---|---|
| F0 — Andamiaje y documentación | ✅ hecha | `feat(web): andamiaje y tokens` |
| — Mantenimiento (repo remoto, .gitignore, ROADMAP) | ✅ hecha | `chore(web): repo remoto y ajustes de roadmap` |
| F1 — Assets, contrato y contenido | ✅ hecha | `feat(web): medios, contrato y contenido` |
| F2 — Primitivas de movimiento, Navbar y botón MENU | ✅ hecha (Gemini) + revisión | `feat(web): primitivas de movimiento, navbar y botón menu` · `fix(web): revision de F2` |
| F3 — Escenario I: intro y modo cerrado | ✅ hecha | `feat(web): escenario, intro y modo cerrado` |
| F4 — Escenario II: modo abierto, transiciones y HOME | ✅ hecha | `feat(web): modo abierto y home` |
| F5 — LA CASA | ✅ hecha | `feat(web): seccion la casa` |
| F6 — PLATOS | ✅ hecha | `feat(web): seccion platos` |
| F7 — EVENTOS | ✅ hecha | `feat(web): seccion eventos` · `fix(web): veta de eventos sin vino` |
| F8 — PREGUNTAS y CONTACTO | ✅ hecha | `feat(web): preguntas y contacto con mapa` |
| — Regresión estable (planes de F3/F4 sin esperas fijas) | ✅ hecha | `test(web): regresion estable` |
| — Revisión de F5–F8 (fondos en la capa del panel, CONTACTO, PLATOS, accesibilidad) | ✅ hecha | `fix(web): revision de F5 a F8` |
| F9 — Overlay de la carta (+ "Reglas aprendidas" en CLAUDE.md) | ✅ hecha | `feat(web): overlay de carta` |
| F10 — Página de categoría y polaroid | ✅ hecha | `feat(web): categoria y polaroid` |
| — Revisión de F10 (historial verificado, título gigante con tope, leyenda de alérgenos, contador de la polaroid) | ✅ hecha | `fix(web): revision de F10` |
| F11 — Pulido: rendimiento, accesibilidad, SEO, white-label | ✅ hecha | `chore(web): pulido y documentacion white-label` |
| — v1.0.1: medios al repo (Vercel desde GitHub) | ✅ hecha | `chore(web): versionar medios` |
| — v1.0.1: responsividad de 240×320 a 2560×1440 y celular acostado | ✅ hecha | `fix(web): responsividad de 240 a 2560` |
| F12 — Conexión al backend | pendiente (no ejecutar todavía) | — |

## Qué hay hoy

- **v1.0.1 (medios y responsividad):**
  - `public/media/` versionada: un clon limpio compila con fotos y video (despliegue en Vercel desde GitHub).
  - Áreas de toque de 44 px con puntero táctil (`area-tactil`, `toque-linea`, variante `tactil:`) y variantes de tamaño `angosto:` (< 360 px), `minimo:` (≤ 260 px), `bajo:` (≤ 480 px de alto) en `tokens.css`.
  - Modo cerrado vertical: el marco se calcula dentro de la banda libre (`filasVertical` en `geometry.ts`); en pantallas bajas sin frases laterales y con el título más chico; números laterales de 44 px táctil que, desplegados, se corren para entrar en la pantalla.
  - Navbar compacto debajo de 360 px; lámina con scroll en pantallas bajas; cartelitos, polaroid (controles al costado) y carta ajustados por alto en el celular acostado; tamaños sueltos de CONTACTO, EVENTOS, PLATOS, PREGUNTAS y los cartelitos pasados a la escala.
  - QA: `__auditar` en `qa-browser.mjs` y `qa/plans/responsive.json` (generado por `pnpm qa:responsive`).
- **F11 (rendimiento, SEO, white-label):**
  - Chunks: app ~148 kB (era 540), React y GSAP aparte, y por ruta: overlay de la carta y página de categoría (`src/carta/cargas.ts`, con Lenis y Flip — `src/motion/flip.ts`), mapa, y miniaturas borrosas (`media.placeholders.generated.ts`, resueltas con `usePlaceholder` de `src/content/placeholders.ts`; en el catálogo `placeholder` es una clave `f1/paisaje`).
  - `index.html` lo arma el plugin de `vite.config.ts`: title/description/Open Graph desde `site.config.ts → seo` (`src/config/seo.ts`), precarga de fuentes y el loader de la intro ya en el HTML (`src/config/loaderEstatico.ts`, con un script que precarga el póster en `/` y la portada + chunk en `/carta/:slug`). React renderiza después del primer pintado. JSON-LD `Restaurant` en runtime (`src/app/Seo.tsx`) con datos del repositorio.
  - Primera carga liviana: paneles del modo abierto montados de a uno en reposo (el activo al toque), inactivos con `content-visibility: hidden`; la carta se monta al terminar la intro; `StageMedia` pide primero el panel actual y sus vecinos; la intro no espera al video (`preload="none"`); `frameController` cachea medidas. Helper `cuandoEsteLibre` (`src/app/libre.ts`).
  - Anuncio `aria-live` del panel en `Stage` (modo cerrado y abierto). Token `text-micro`.
  - Despliegue: `vercel.json`, `public/_redirects` (Netlify/Cloudflare), `public/robots.txt`; nginx/Apache en el README. README con "Cómo adaptar a un cliente" y "Pendientes antes de vender".

- **Stack:** Vite 8 + React 19 + TS 6 strict + Tailwind v4 + ESLint 10 + GSAP 3.15 (`@gsap/react`) + `lenis` 1.3 + `leaflet` 1.9 + `lucide-react`. Alias `@/`.
- **Rutas** (`src/app/router.ts`, router propio con `popstate`): `/` escenario · `/carta` escenario + overlay de la carta (mismo `<Stage>`, no se desmonta) · `/carta/:slug` página de categoría · solo en dev: `/dev` (primitivas, navbar, MENU, reduced motion), `/dev/datos` (datos + editorial + medios), `/dev/tokens` (muestras).
- **Carta (`src/carta/`):**
  - `navegacion.ts`: abrir/cerrar la carta es navegar (`pushState('/carta')` / `history.back()` o `replaceState('/')`); guarda en el historial el escenario de abajo (`{ index, abierto }`) y la profundidad de pasos en categorías (`pasos` desde `/carta`) para que "← Categorías" y "Volver a la carta" regresen directo a `/carta` con `history.go(-pasos)` aunque se haya navegado entre varias categorías con anterior/siguiente (y con `replace: true` si se entró directo por URL).
  - `CartaOverlay.tsx`: diálogo modal `tizon` dentro del escenario (debajo del navbar: CERRAR es el mismo `MenuButton`); "Hoy: {plato} — {precio}" de `daily_menu` del repositorio con `Reveal`; 6 cartelitos de `categoriasCarta()` que caen en cascada y se van hacia abajo al cerrar; flip de a uno; pie con dirección/teléfono, "Reservar mesa", rubro/email; nombre gigante ajustado al ancho (`useAjusteAncho`). Mobile: carrusel con snap. Foco atrapado (`focusTrap.ts`) y cartelitos con `roving.ts`. Estado en `data-carta-estado`.
  - `CartaCard.tsx`: un botón por cartelito (frente número + nombre; dorso portada + "Ver categoría"); rotación y desplazamiento fijos por índice.
  - `WipeTransition.tsx`: barrido negro reutilizable `useWipeTransition().transicion(cambio)` (cubre desde abajo → `cambio()` → sigue subiendo). Estado en `data-barrido`.
  - `CategoryPage.tsx`: página de `/carta/:slug` con scroll suave de `Lenis` (se crea al montar y se destruye al desmontar, en pausa mientras la polaroid está abierta). Barra superior en píldora (`"← Categorías"` → `/carta`, wordmark en Caslon → `/#home`, `MenuButton` → `/carta`); portada ~60vh con `Picture` (`shape="banda"`), `velo`, número editorial y título gigante con `Reveal` (tope de ancho y 2 líneas con `useTopeTitulo`); cuerpo `monte` con el nombre de la categoría y horario semanal (`resumirHorario(local.weekly)`), grilla de 2 columnas en desktop y 1 en mobile (si la categoría tiene múltiples grupos como `Bodega`, cada grupo es una columna; si tiene 1 grupo, se reparten los platos en 2 columnas equilibradas), platos con nombre (botón si tiene foto, `<span>` sin cursor si no tiene), porción opcional (`(500 g)`), precio en `oro` con `formatPrecio(price_cents)`, plato sin stock hoy (`available: false`) atenuado (`opacity-60`, precio tachado, `"No hay hoy"` visible), marcas de alérgenos y leyenda al pie (`copy.alergenos`); navegación `"← Categoría anterior"` / `"Categoría siguiente →"`, `"Volver a la carta"` y `"Volver al inicio"` todo con `useWipeTransition()`. Si la categoría no existe o está vacía, muestra aviso (`copy.carta.noExiste`) y vuelve sola a `/carta` con el barrido.
  - `Polaroid.tsx`: modal de foto de plato tipo polaroid (`bg-champan text-noche`, bordes superiores/laterales de 14 px y pie ≥ 56 px con nombre en Caslon y precio con `WipeSwap`, foto con `BlurSwapImage`), que se abre con `Flip` de GSAP desde un ancla en las coordenadas del clic y se cierra hacia la misma ancla; rotación leve fija por plato (`[-2.5, 2, -1.5, 3, -2, 2.5]°` en capa interna separada de `Flip`); flechas `←` `→` y botones anterior/siguiente que recorren los platos con foto de la categoría (con vuelta), cierre con `✕`, clic afuera y `Esc`, foco atrapado (`focusTrap.ts`) y devuelto al botón del nombre del plato que la abrió.
  - Con la carta abierta el escenario queda quieto: input suspendido, video en pausa, `inert`, no escribe hash.
- **Escenario (`src/stage/`):**
  - `stageMachine.ts` (reducer: `loading → intro → closed ⇄ opening/closing → open`, `lock`, cola de 1; pasos en modo cerrado y abierto) + `StageProvider.tsx`.
  - `geometry.ts` + `frameController.ts` (tween de los 8 números, seguro ante resize) + `Frame.tsx` (clip-path, clic/Enter para abrir).
  - `useStepInput.ts` (Observer: wheel con un paso por gesto e inercia filtrada, swipe > 50 px, ↓/↑, PageDown/PageUp, Espacio; respeta scrollers internos; ignora los gestos que empiezan en `data-stage-gestos-propios`, p. ej. el mapa activo).
  - `Intro.tsx`, `ClosedView.tsx`, `StageMedia.tsx` (video de HOME + 5 fotos; en modo abierto cada capa suma velo + fondo propio de la sección, así el fondo entra y sale con su panel), `OpenView.tsx` (secciones del modo abierto, "Vista general"; CONTACTO deja pasar los clics a su mapa), `Stage.tsx` (orquesta los timelines: paso cerrado, paso abierto, abrir, cerrar).
  - Hash: `/#eventos` entra directo abierto; abrir y cada paso abierto escriben el hash; cerrar lo limpia; hash inválido → intro normal.
- **Secciones (`src/sections/`):**
  - `Home/HomePanel.tsx` (bloques, subtítulo, Ver la carta / Reservar mesa, Conocer la casa, columna de datos con CountUp).
  - `LaCasa/LaCasaPanel.tsx` (fondo radial `hoja → monte → noche` en `LaCasaFondo`, 6 ítems con íconos lucide y activo `champan` por clic, hover-intent 200 ms o teclado, foto `r2` fija en el marco inclinado con parallax leve, cita con `Reveal` y panel de título + texto con `WipeSwap`).
  - `Platos/PlatosPanel.tsx` (franja superior sobre la foto `f8` oscurecida del escenario con título y "Ver la carta completa"; fila inferior de 3 paneles: foto en marco 1px `champan` con `BlurSwapImage`, panel `monte` con origen en Caslon + región en `WipeSwap`, panel `tizon` con puntos de guía, descripción en cursiva, nombre en `oro`, categoría + precio del repositorio + porción en `WipeSwap`, y botones atrás/adelante con anillo SVG de 7 s que avanza solo y se pausa con hover/focus, pestaña oculta, reduced motion o fuera de `PLATOS`).
  - `Eventos/EventosPanel.tsx` (calculadora de catering sobre la foto `r3` oscurecida con veta cálida `oro` + `hoja` + `monte`: stepper de invitados 10–200 paso 5 inicial 40, chips de ocasión y formato, 6 tarjetas `champan` con `CountUp` en `monte` y etiquetas con `WipeSwap`, nota orientativa y CTA WhatsApp `wa.me` + alternativa `mailto:` desde `src/content/eventos.ts`).
  - `Preguntas/PreguntasPanel.tsx` (fondo diagonal `monte → noche`, título con `Reveal`, bajada con links reales `mailto:`/`tel:`/WhatsApp desde `site.config.ts`, buscador en píldora sin acentos/mayúsculas con reseteo de paginación a 1 y mensaje `sinResultados` con fundido, acordeón de 3 preguntas por página con paginación `1 / 4`, títulos con `WipeSwap`, una sola abierta a la vez con altura animada en GSAP, pregunta 12 con zonas de delivery del repositorio y scroll interno `data-stage-scroller`).
  - `Contacto/ContactoPanel.tsx` + `Contacto/ContactoMapa.tsx` (mapa Leaflet + OpenStreetMap en chunk diferido que solo carga cuando `CONTACTO` está por mostrarse, filtro oscuro exclusivo en `.leaflet-tile-pane`, marcador SVG dorado con la forma del marco inclinado `--marco-rotacion`, zoom con rueda deshabilitado hasta clic o `Ctrl + rueda`, arrastre táctil deshabilitado hasta tocar `"Tocá para mover el mapa"` para que el swipe cambie de sección, atribución OSM visible, etiqueta `"Te esperamos. Desde 2011."`, tarjeta `champan` con datos de `site.config.ts` y horarios/estado/cocina/próximo día distinto del repositorio, redes con `src/components/icons/social.tsx` y botón `"Volver al inicio"` → `HOME`).
- **Fondos de sección:** `LaCasaFondo`, `EventosFondo`, `PreguntasFondo`, `ContactoFondo` (mapa) se exportan desde cada sección y los monta `StageMedia`. Sección nueva con fondo propio → exportar `XFondo` y sumarlo a `FONDOS` en `StageMedia`, nunca dentro de `[data-open-text]`.
- **Accesibilidad:** foco itinerante compartido en `src/components/roving.ts` (pestañas de LA CASA, chips de EVENTOS, cartelitos de la carta); foco atrapado en `src/components/focusTrap.ts`; texto gigante al ancho en `src/components/useAjusteAncho.ts`.
- **Movimiento (`src/motion/`):** `gsap.ts`, `tokens.ts` (intro, paso cerrado, paso abierto, abrir/cerrar), `useReducedMotion` (+ snapshot), primitivas `Reveal` (entrada y salida), `SlideIn`, `WipeSwap`, `BlurSwapImage`, `CountUp`.
- **Componentes:** `Picture`, `Navbar` (links con fundido según modo, píldora ≥ 75rem, barra dorada, lámina mobile), `MenuButton`, `icons/social.tsx`.
- **Datos y contenido:** igual que F1 (`src/data/`, `src/content/`, mock).
- **QA:** `pnpm qa <plan.json>` y `pnpm qa:regresion` (todos los planes de `qa/plans/`, con resultados esperados). Capturas en `qa/shots/` (ignorada). Requiere `pnpm dev`.
  - Planes sin esperas fijas: `__waitUntil` / `__frames` / `__sleep` (los inyecta `qa-browser.mjs`) y, en dev, `window.__qa` (`src/motion/qa.ts`): `reloj(escala)` enlentece GSAP para muestras a mitad de animación, `estable()` espera el escenario quieto (también carta y barrido), `reposo()` además sin animaciones (capturas), `cartaEstable()` carta y barrido quietos sin mirar el escenario (página de categoría). Planes nuevos: no usar `{ "wait": N }` para esperar estados.
  - Pasos del plan: además de los anteriores, teclas ←/→/Inicio/Fin y `"shift": true`, `{ "atras": true }` / `{ "adelante": true }` (botones del navegador) y `{ "click": { "selector": "…" } }`; en viewport mobile el `click` es un toque.
  - No editar archivos del proyecto mientras corre la regresión: Tailwind vigila todo el repo y Vite recarga la página a mitad del plan.

## Verificación v1.0.1

- `pnpm build` ✅ sin avisos · `pnpm lint` ✅ · `pnpm check:content` ✅.
- **Medios:** clon limpio (`git clone` → `pnpm install --frozen-lockfile` → `pnpm build`): `dist/media` con 188 archivos (fotos AVIF/WebP, 2 videos y pósters); las 186 rutas de `media.generated.ts` existen en `dist/`.
- `pnpm qa:regresion` ✅ **25/25 planes, 640 chequeos, sin errores de consola**, en una sola corrida secuencial (24 anteriores + `responsive.json`). `f3-4` con la posición nueva del número 05 (slot más alto). `f9-1` falló una vez al correr dos Chrome en paralelo y pasó solo y en la corrida completa.
- `qa/plans/responsive.json`: 164 auditorías (14 tamaños × cerrado, 6 secciones, lámina debajo de 1200 px, carta frente y dorso, categoría y polaroid) todas limpias: sin scroll horizontal, sin interactivos fuera de pantalla, recortados ni tapados, áreas táctiles ≥ 44 px (40 en 240, 24 con mouse), sin texto cortado, letra ≥ 10 px. Capturas en `qa/shots/responsive/{ancho}x{alto}-{pantalla}.png` (más intro y pie de la categoría).
- Antes de los arreglos, la misma auditoría marcaba problemas en todos los tamaños táctiles (detalle por tamaño en el reporte de la sesión y en `DECISIONES.md` → v1.0.1).

## Verificación F11

- `pnpm build` ✅ sin avisos (sin el de 500 kB ni el del cargador nativo de Vite) · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **24/24 planes, 312 chequeos, sin errores de consola** (F3–F10 + `f10-3-historial`, `f10-4-revision`, `f11-1-pulido`).
- Lighthouse móvil (simulado, Moto G Power / Slow 4G, `pnpm preview` local, mejor de 2 corridas):

  | Página | Performance | Accesibilidad | Buenas prácticas | SEO |
  |---|---|---|---|---|
  | `/` (inicio, intro) | **92** (antes 49) | **100** | 100 | 100 |
  | `/carta/fuegos` | **88** | **100** (antes 96) | 100 | 100 |
  | `/carta` (entrada directa) | 75 | 100 | 100 | 100 |
  | `/#eventos` (entrada por hash) | 70 | 100 | 100 | 100 |

  Inicio: FCP 2,0 s · LCP 2,9 s · TBT 100 ms · CLS 0. Las entradas directas a `/carta` y por hash montan su panel con todo el escenario en el primer render (TBT 490–650 ms): ver pendientes.
- Pasada en 375 / 768 / 1280 / 1920 (cerrado, HOME, EVENTOS, CONTACTO, carta, categoría): sin desborde horizontal.

## Verificación F10

- `pnpm build` ✅ (sin `__qa` en el build; aviso de chunk > 500 kB, ver pendientes) · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **21/21 planes en corrida completa de punta a punta** (F3–F9 sin cambios + 2 planes nuevos de F10, sin fallos intermitentes).
  - `f10-1-categoria-polaroid.json` (1440×900): entrada desde `/carta` con el barrido hacia `/carta/fuegos`; `Lenis` montado (`data-lenis-activo="true"`), portada `f6` (`shape="banda"`) con número `02` y título gigante con `Reveal`, horario semanal del repositorio (`resumirHorario`), 2 columnas en desktop, porción `(500 g)` solo cuando existe, precio formateado desde centavos (`$ 32.000`), plato sin stock hoy (`Vacío al gancho`, `available: false`) atenuado (`opacity: 0.6`), precio tachado y `"No hay hoy"` visible, alérgenos (`G`, `L`, `H`) con leyenda al pie; plato sin foto (`Asado de tira`) en `<span>` sin cursor de link y clic no abre nada; clic en `"Bife de chorizo grueso"` abre la polaroid con `Flip` desde el punto del clic (verificado en estado `"abriendo"` y luego `"abierta"`), rotación fija `-1.5°`, bordes de 14 px, pie ≥ 56 px con nombre en Caslon y precio, contador `1 / 3`, foco en cerrar y `Lenis` en pausa; `Tab` y `Shift+Tab` atrapados en la polaroid; `→` y `←` recorren los 3 platos con foto de `Fuegos` con vuelta (`Bife de chorizo grueso` `-1.5°` → `Ojo de bife` `3°` → `Hamburguesa de la casa` `-2°` → `Bife`); cierre con `Esc`, con botón `✕` y con clic afuera devolviendo siempre el foco al nombre del plato que la abrió y reanudando `Lenis`; rueda con `Lenis` desplaza suavemente; `"Categoría siguiente →"` lleva con barrido a `/carta/pastas` arriba de todo (`scrollY === 0`); `"← Categoría anterior"` vuelve a `/carta/fuegos`; atrás del navegador vuelve a `/carta/pastas`; `"Volver a la carta"` regresa directo a `/carta` (saltando el historial de categorías) y destruye `Lenis` al desmontar; `/carta/bodega` muestra sus 3 grupos editoriales (`Tintos`, `Blancos y rosados`, `Tu botella`), `Pinot Noir` sin stock y 0 platos clickeables; `"← Categorías"` vuelve a `/carta`; wordmark lleva a `HOME` abierto (`/#home`) con barrido y sin `Lenis`; `/carta/no-existe` muestra el aviso y vuelve sola a `/carta` con el barrido.
  - `f10-2-categoria-mobile.json` (390×844 táctil): `/carta/entradas` sin desborde horizontal (`scrollWidth === 390`), 1 columna, `Mollejas al limón` sin stock con `"No hay hoy"`; toque en `"Matambrito a la brasa"` abre la polaroid sin desborde en 390 px; toque en `✕` cierra y devuelve el foco; toque en `"Categoría siguiente →"` lleva a `/carta/fuegos` con el barrido; toque en flecha siguiente de la polaroid pasa a `"Ojo de bife"` (`2 / 3`); toque afuera cierra y devuelve el foco; atrás del navegador vuelve a `/carta/entradas`; toque en `"Volver al inicio"` del pie lleva a `HOME` abierto con el barrido.
- Capturas en `qa/shots/f10-*.png` (categoría fuegos, polaroid abriendo, polaroid abierta, mobile entradas, mobile polaroid).

## Verificación F9

- `pnpm build` ✅ (sin `__qa` en el build; aviso de chunk > 500 kB, ver pendientes) · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **19/19 planes** (F3–F8 sin cambios + 4 de F9). Una segunda corrida la cortó Claude Code por falta de memoria en la máquina cuando iba por `f7-1` (todo OK hasta ahí, 110 chequeos).
  - `f9-1-carta.json` (1440×900): "Ver la carta" → `/carta`; a mitad, el líquido sube mientras los cartelitos caen; abierta: CERRAR lleno, video en pausa, "Hoy: Carbonada en zapallo — $ 16.500", 6 cartelitos, foco en el primero, escenario `inert`; rotaciones `-3/2.5/-1.5/4/-4/5°` y 6 desplazamientos distintos; nombre gigante al ancho exacto; todo entra en 1440×900; →/Fin/Inicio/← recorren los cartelitos con vuelta; Tab atrapado (cartelito → reservar → tel → mail → CERRAR → cartelito) y Shift+Tab; rueda/PageDown/↓ no mueven el escenario; flip a mitad (rotateY 40–140°) y uno solo dado vuelta; Enter da vuelta; Esc a mitad (cartelitos bajando + líquido bajando, URL ya en `/`); al cerrar HOME abierto con video corriendo y foco en "Ver la carta"; MENU abre; atrás cierra; adelante reabre; CERRAR cierra; ↓↓ a PLATOS; "Ver la carta completa" abre y Esc vuelve a PLATOS; MENU en modo cerrado, Enter da vuelta sin abrir el panel, Esc vuelve al modo cerrado y ↓ sigue andando.
  - `f9-2-barrido.json`: barrido a mitad cubriendo (aún en `/carta`) y descubriendo (ya en `/carta/bodega`, escenario desmontado); atrás vuelve a la carta con el escenario re-montado en modo cerrado en EVENTOS; otra vez atrás → `/` en EVENTOS cerrado; "← Categorías" y "Volver al inicio" con el mismo barrido; recargar en `/carta` deja LA CASA abierta debajo y Esc → `/#la-casa`; categoría inexistente → aviso.
  - `f9-3-carta-mobile.json` (390×844 táctil): sin desborde horizontal, carrusel `x mandatory` con el primero centrado, swipe vertical no mueve el escenario, el snap centra FUEGOS, toque da vuelta (uno solo), atrás cierra con el video corriendo, al reabrir todo vuelve a cero, CERRAR cierra, 2º toque entra con barrido y atrás vuelve.
  - `f9-4-carta-reduced.json`: abre y cierra en < 0,7 s sin caída ni giro; flip sin ángulos intermedios; barrido como fundido sin desplazamiento.
- Capturas en `qa/shots/f9-*.png` (abriendo, abierta, flip a mitad, flip, cerrando, barrido cubriendo/descubriendo, categoría, mobile abierta/flip/categoría).

## Verificación de la revisión de F5–F8

- `pnpm build` ✅ · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **15/15 planes tres veces seguidas** (`f8-2-contacto.json` reescrito y ampliado; `f6-1-platos.json` ajustado a `aria-current`).
- Capturas de las 5 secciones en 1440×900 y 390×844 y de cada paso abierto a mitad (reloj de GSAP lento): el fondo de cada sección entra desde abajo con su panel.
- Reproducidos en el código anterior y corregidos: Ctrl+rueda sin `preventDefault` (zoom de página), swipe con el mapa activo que pasaba de sección, ↓ sobre un chip de EVENTOS que pasaba de sección.
- Detalle y gravedad de cada problema: `DECISIONES.md` → "Revisión de F5 a F8".

## Verificación de la regresión estable

- `pnpm qa:regresion` ✅ **15/15 planes tres veces seguidas** (después del arreglo de `useStepInput`; antes, una corrida falló en `f8-2` por un ↓ perdido al entrar por hash).
- `pnpm build` ✅ (sin `__qa` en el build) · `pnpm lint` ✅.

## Verificación F8

- `pnpm build` ✅ · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **15/15 planes** (F3 + F4 + F5 + F6 + F7 + `f8-1-preguntas.json` + `f8-2-contacto.json` en desktop 1440×900 y mobile 390×844 táctil):
  - `f8-1-preguntas.json`: entrada directa a `/#preguntas` con página `1 / 4` y 3 ítems cerrados; acordeón con una sola pregunta abierta a la vez y altura animada (al abrir la 2ª la 1ª colapsa a `0px`); paginación hasta `4 / 4` y apertura de la pregunta 12 (`¿Hacen delivery?`) mostrando las 6 zonas del repositorio (`GET /delivery-zones`); scroll interno en viewport bajo (`440px`) con rueda sin saltar a `CONTACTO`; búsqueda con y sin acentos/mayúsculas (`"ANTICIPACION"` / `"anticipación"`) y por zona (`"bajo la vina"`) volviendo a página `1 / 1`; estado sin resultados con fundido y restauración al limpiar; mobile `390×844` sin desborde horizontal.
  - `f8-2-contacto.json`: en `/#preguntas` el mapa de `CONTACTO` no se carga (`[data-contacto-mapa] === null`); al avanzar a `CONTACTO` carga diferidamente Leaflet + OSM con filtro oscuro solo en `.leaflet-tile-pane` (marcador y atribución sin filtro), atribución `© OpenStreetMap` visible y datos de repositorio + `site.config.ts`; rueda sobre el mapa no hace zoom (`zoom === "16"`) ni rompe el paso de sección hacia `PREGUNTAS`; clic en el mapa habilita la interacción; `"Volver al inicio"` lleva a `HOME` (`/#home`); mobile `390×844` sin desborde horizontal, con leyenda `"Tocá para mover el mapa"` y swipe sobre el mapa cambiando de sección a `PREGUNTAS`.

## Verificación F7

- `pnpm build` ✅ · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **13/13 planes** (F3 + F4 + F5 + F6 + `f7-1-eventos.json` en desktop 1440×900 y mobile 390×844 táctil):
  - Entrada directa a `/#eventos` entrando en `100svh` en desktop sin scroll (`scrollHeight <= clientHeight`) con la selección inicial (`40` invitados · `Día de la Madre` · `Cóctel`).
  - Límites del stepper verificados en `10` (`disabled` en `-`) y `200` (`disabled` en `+`), con paso de `5`.
  - 4 combinaciones de invitados, ocasión y formato verificadas contra las fórmulas de `src/content/eventos.ts` (incluyendo el cambio de etiqueta `"bocados"` ↔ `"pasos de menú"` con `WipeSwap`).
  - Ráfaga rápida de 9 clics seguidos en `+` (`10 → 55`): `CountUp` retoma en cada interrupción y converge al valor final exacto (`24,8` kg, `22` botellas, `$ 41.800`) sin quedar en un valor intermedio.
  - Botón `"Pedir presupuesto"` con URL `https://wa.me/5493880000000?text=...` URL-encoded con el resumen exacto y alternativa `mailto:`.
  - Mobile 390×844: sin desborde horizontal (`scrollWidth === 390`) y cambio de chips con actualización animada de las 6 tarjetas.

## Verificación F6

- `pnpm build` ✅ · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **12/12 planes** (F3 + F4 + F5 + `f6-1-platos.json` en desktop 1440×900 y mobile 390×844 táctil):
  - Entrada directa a `/#platos` mostrando el plato 0 (`Bife de chorizo grueso`, `"A la parrilla"`, `"Pampa húmeda"`, `"Fuegos · $ 32.000 · 500 g"`), imagen nítida y contenida dentro del marco 1px `champan`.
  - Pausa con hover sobre la fila inferior (durante 650 ms el anillo de progreso permanece congelado y al salir se reanuda).
  - Avance automático al completar el anillo de 7 s (pasa de `Bife de chorizo grueso` a `Sorrentinos gratinados` y reinicia el anillo).
  - Controles atrás / adelante y los 5 puntos guía sincronizados entre sí.
  - Clic rápido en ráfaga (4 clics seguidos en adelante a 105 ms): `BlurSwapImage` y `WipeSwap` retoman sin dejar la imagen desenfocada ni desbordada fuera del marco.
  - Botón `"Ver la carta completa"` dispara la misma acción que `"Ver la carta"` de HOME.
  - Mobile 390×844: sin desborde horizontal (`scrollWidth === 390`), entra en pantalla sin scroll vertical y avanza de plato con imagen nítida.

## Verificación F5

- `pnpm build` ✅ · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **11/11 planes** (F3 + F4 + `f5-1-la-casa.json` en desktop 1440×900 y mobile 390×844 táctil):
  - Entrada directa a `/#la-casa` mostrando ítem inicial (`Fuego`), foto `r2` en el marco inclinado y cita + textos.
  - Cambio de ítem con clic (`Bodega`) y con hover-intent de 200 ms (un hover de 70 ms se cancela sin cambiar; ≥ 200 ms activa `Masa`).
  - Cambio rápido en ráfaga (4 ítems en 330 ms): interrumpe y retoma con `WipeSwap` sin cortes ni texto mezclado.
  - Navegación con teclado (`ArrowDown` / `ArrowUp` dentro del `tablist`): cicla entre los 6 ítems moviendo el foco sin disparar el paso de sección del escenario.
  - Mobile 390×844: grilla 3×2 de ítems sin truncado ni desborde horizontal (`scrollWidth === 390`), entra en pantalla sin scroll vertical y cambia de ítem al tocar.

## Verificación F4

- `pnpm build` ✅ · `pnpm lint` ✅ · `pnpm check:content` ✅.
- `pnpm qa:regresion` ✅ **10/10 planes** (desktop 1440×900 y mobile 390×844 táctil):
  - F3 sin cambios: intro, wheel/trackpad/cola, teclado, resize, números laterales, abrir/Esc/Enter, clic fuera del marco, mobile, reduced motion.
  - F4: abrir HOME (hash `#home`, video corre, links visibles) → recorrer las 6 secciones (hash en cada paso, video pausado fuera de HOME, ↓ en la última no hace nada) → navbar "Nuestros servicios" salta directo a EVENTOS → wordmark vuelve a HOME (video corre) → "Conocer la casa" → "Vista general" cierra (URL limpia, sin links) → el modo cerrado sigue andando → Enter/Esc.
  - `/#eventos` entra directo abierto con navbar; subir a HOME arranca el video; hash inválido → intro normal y URL limpia.
  - Mobile: HOME entra en 390×844 sin scroll; lámina de links salta a PREGUNTAS y se cierra; en 390×600 el swipe scrollea HOME y recién en el borde pasa de panel.
  - Reduced motion: abre en ~0,2 s, el video no corre, paso con fundido sin desplazamiento, Esc cierra.
- `/dev` sigue pasando (barra deslizante, líquido).

## Pendientes / para la próxima sesión

- **Sub-fase restante:** F12 (conexión al backend). Antes de vender: ver "Pendientes antes de vender" en el README.
- **Rendimiento de entradas directas:** `/carta` (75) y `/#eventos` (70) en Lighthouse móvil: el primer render monta el escenario + el panel o la carta de una. Opciones: partir el escenario en un chunk propio y dividir el montaje del panel inicial.
- Lighthouse medido en local (`pnpm preview`, HTTP/1.1 sin compresión Brotli); en el hosting real hay que volver a medir.
- **Polaroid:** el atrás del navegador sale de la categoría en vez de cerrar la foto (decisión de producto: ¿la foto tiene URL?).
- **SEO:** sin `sitemap.xml` (las categorías salen del backend: generarlo en F12).
- **Menú del día:** si el backend manda más de un plato del día, hoy se muestra el primero disponible.
- Responsividad verificada con emulación (Chrome headless, táctil emulado): falta mirarla en teléfonos reales chicos y acostados (barra del navegador, zona segura del notch).
- Celular acostado: las secciones del modo abierto usan el layout vertical con scroll interno; un layout propio en dos columnas para 667–844 × 375–390 mejoraría LA CASA y EVENTOS (hoy hay que scrollear).
- Probar en un teléfono real el carrusel con snap, el flip 3D de los cartelitos y la polaroid (en QA el toque está emulado).
- **Medios:** `public/media/` ya se versiona (demo personal). Antes de usar el template para un cliente, reemplazarlos. Ojo: el video (HOME, ahora a pantalla completa) muestra el cartel de otro negocio ("Historia Meze & Grill"), `restaurant5` el nombre "Gustav", `food2` una botella de Guinness.
- **Medios en baja resolución:** fuentes de 495–1280 px y video 852×480; a pantalla completa se notan.
- **Datos de HOME** (140 etiquetas, 12 h, 38 cubiertos, 4,8) son placeholder en `site.config.ts → home`.
- **Sin fotos de postres.**
- **Pedir al backend:** teléfono y email, slug y orden de categorías, coordenadas, horario de cocina, porción, foto por ítem/categoría, etiquetas dietarias, catálogo de alérgenos.
- Probar en un trackpad y un teléfono reales (inercia y touch están simulados).
- `useGSAP` con dependencias acumula animaciones en su contexto hasta desmontar (menor).
- **Mapa en producción:** las teselas salen de `tile.openstreetmap.org`, cuya política no admite uso comercial intensivo; antes de publicar un cliente, pasar a un proveedor de teselas (con su atribución).
- Probar CONTACTO en un teléfono real: arrastre del mapa activo y swipe con el mapa bloqueado (en QA el toque está emulado).
- La extensión de Chrome conecta pero, con la ventana tapada, Chrome le da ~2 frames por segundo: para revisar movimiento usar `pnpm qa`.
- Subir TypeScript a 7 cuando `typescript-eslint` lo soporte.
