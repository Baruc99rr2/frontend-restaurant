# ESTADO

Última actualización: 2026-10-21 — **regresión estable** (revisión de F5–F8 en curso).
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
| F9–F12 | pendiente | — |

## Qué hay hoy

- **Stack:** Vite 8 + React 19 + TS 6 strict + Tailwind v4 + ESLint 10 + GSAP 3.15 (`@gsap/react`) + `leaflet` 1.9 + `lucide-react`. Alias `@/`.
- **Rutas:** `/` escenario · solo en dev: `/dev` (primitivas, navbar, MENU, reduced motion), `/dev/datos` (datos + editorial + medios), `/dev/tokens` (muestras).
- **Escenario (`src/stage/`):**
  - `stageMachine.ts` (reducer: `loading → intro → closed ⇄ opening/closing → open`, `lock`, cola de 1; pasos en modo cerrado y abierto) + `StageProvider.tsx`.
  - `geometry.ts` + `frameController.ts` (tween de los 8 números, seguro ante resize) + `Frame.tsx` (clip-path, clic/Enter para abrir).
  - `useStepInput.ts` (Observer: wheel con un paso por gesto e inercia filtrada, swipe > 50 px, ↓/↑, PageDown/PageUp, Espacio; respeta scrollers internos).
  - `Intro.tsx`, `ClosedView.tsx`, `StageMedia.tsx` (video de HOME + 5 fotos), `OpenView.tsx` (secciones del modo abierto, velo, "Vista general"), `Stage.tsx` (orquesta los timelines: paso cerrado, paso abierto, abrir, cerrar).
  - Hash: `/#eventos` entra directo abierto; abrir y cada paso abierto escriben el hash; cerrar lo limpia; hash inválido → intro normal.
- **Secciones (`src/sections/`):**
  - `Home/HomePanel.tsx` (bloques, subtítulo, Ver la carta / Reservar mesa, Conocer la casa, columna de datos con CountUp).
  - `LaCasa/LaCasaPanel.tsx` (fondo radial `hoja → monte → noche`, 6 ítems con íconos lucide y activo `champan` por clic, hover-intent 200 ms o teclado, foto `r2` fija en el marco inclinado con parallax leve, cita con `Reveal` y panel de título + texto con `WipeSwap`).
  - `Platos/PlatosPanel.tsx` (franja superior sobre la foto `f8` oscurecida del escenario con título y "Ver la carta completa"; fila inferior de 3 paneles: foto en marco 1px `champan` con `BlurSwapImage`, panel `monte` con origen en Caslon + región en `WipeSwap`, panel `tizon` con puntos de guía, descripción en cursiva, nombre en `oro`, categoría + precio del repositorio + porción en `WipeSwap`, y botones atrás/adelante con anillo SVG de 7 s que avanza solo y se pausa con hover/focus, pestaña oculta, reduced motion o fuera de `PLATOS`).
  - `Eventos/EventosPanel.tsx` (calculadora de catering sobre la foto `r3` oscurecida con veta cálida `oro` + `hoja` + `monte`: stepper de invitados 10–200 paso 5 inicial 40, chips de ocasión y formato, 6 tarjetas `champan` con `CountUp` en `monte` y etiquetas con `WipeSwap`, nota orientativa y CTA WhatsApp `wa.me` + alternativa `mailto:` desde `src/content/eventos.ts`).
  - `Preguntas/PreguntasPanel.tsx` (fondo diagonal `monte → noche`, título con `Reveal`, bajada con links reales `mailto:`/`tel:`/WhatsApp desde `site.config.ts`, buscador en píldora sin acentos/mayúsculas con reseteo de paginación a 1 y mensaje `sinResultados` con fundido, acordeón de 3 preguntas por página con paginación `1 / 4`, títulos con `WipeSwap`, una sola abierta a la vez con altura animada en GSAP, pregunta 12 con zonas de delivery del repositorio y scroll interno `data-stage-scroller`).
  - `Contacto/ContactoPanel.tsx` + `Contacto/ContactoMapa.tsx` (mapa Leaflet + OpenStreetMap en chunk diferido que solo carga cuando `CONTACTO` está por mostrarse, filtro oscuro exclusivo en `.leaflet-tile-pane`, marcador SVG dorado con la forma del marco inclinado `--marco-rotacion`, zoom con rueda deshabilitado hasta clic o `Ctrl + rueda`, arrastre táctil deshabilitado hasta tocar `"Tocá para mover el mapa"` para que el swipe cambie de sección, atribución OSM visible, etiqueta `"Te esperamos. Desde 2011."`, tarjeta `champan` con datos de `site.config.ts` y horarios/estado/cocina/próximo día distinto del repositorio, redes con `src/components/icons/social.tsx` y botón `"Volver al inicio"` → `HOME`).
- **Movimiento (`src/motion/`):** `gsap.ts`, `tokens.ts` (intro, paso cerrado, paso abierto, abrir/cerrar), `useReducedMotion` (+ snapshot), primitivas `Reveal` (entrada y salida), `SlideIn`, `WipeSwap`, `BlurSwapImage`, `CountUp`.
- **Componentes:** `Picture`, `Navbar` (links con fundido según modo, píldora ≥ 75rem, barra dorada, lámina mobile), `MenuButton`, `icons/social.tsx`.
- **Datos y contenido:** igual que F1 (`src/data/`, `src/content/`, mock).
- **QA:** `pnpm qa <plan.json>` y `pnpm qa:regresion` (todos los planes de `qa/plans/`, con resultados esperados). Capturas en `qa/shots/` (ignorada). Requiere `pnpm dev`.
  - Planes sin esperas fijas: `__waitUntil` / `__frames` / `__sleep` (los inyecta `qa-browser.mjs`) y, en dev, `window.__qa` (`src/motion/qa.ts`): `reloj(escala)` enlentece GSAP para muestras a mitad de animación, `estable()` espera el escenario quieto, `reposo()` además sin animaciones (capturas). Planes nuevos: no usar `{ "wait": N }` para esperar estados.
  - No editar archivos del proyecto mientras corre la regresión: Tailwind vigila todo el repo y Vite recarga la página a mitad del plan.

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

- **Sub-fases restantes:** F9, F10, F11, F12.
- **Licencias:** confirmar si fotos y video son de licencia libre → recién ahí versionar `public/media/`. Ojo: el video (HOME, ahora a pantalla completa) muestra el cartel de otro negocio ("Historia Meze & Grill"), `restaurant5` el nombre "Gustav", `food2` una botella de Guinness.
- **Medios en baja resolución:** fuentes de 495–1280 px y video 852×480; a pantalla completa se notan.
- **Datos de HOME** (140 etiquetas, 12 h, 38 cubiertos, 4,8) son placeholder en `site.config.ts → home`.
- **Sin fotos de postres.**
- **Pedir al backend:** teléfono y email, slug y orden de categorías, coordenadas, horario de cocina, porción, foto por ítem/categoría, etiquetas dietarias, catálogo de alérgenos.
- Probar en un trackpad y un teléfono reales (inercia y touch están simulados).
- `useGSAP` con dependencias acumula animaciones en su contexto hasta desmontar (menor).
- `WipeSwap` (`src/motion/primitives/WipeSwap.tsx`): al ocultar la capa saliente (`display: 'none'`) conserva `outgoing.innerHTML`; vaciarlo al ocultar evitaría que `.textContent` del contenedor incluya el texto anterior oculto (menor).
- Subir TypeScript a 7 cuando `typescript-eslint` lo soporte.
