# ESTADO

Última actualización: 2026-10-21 — **F5 completa**.
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
| F6 — PLATOS | ⏭ siguiente | — |
| F7–F12 | pendiente | — |

## Qué hay hoy

- **Stack:** Vite 8 + React 19 + TS 6 strict + Tailwind v4 + ESLint 10 + GSAP 3.15 (`@gsap/react`) + `lucide-react`. Alias `@/`.
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
  - Los otros 4 paneles: placeholder simple en `OpenView`.
- **Movimiento (`src/motion/`):** `gsap.ts`, `tokens.ts` (intro, paso cerrado, paso abierto, abrir/cerrar), `useReducedMotion` (+ snapshot), primitivas `Reveal` (entrada y salida), `SlideIn`, `WipeSwap`, `BlurSwapImage`, `CountUp`.
- **Componentes:** `Picture`, `Navbar` (links con fundido según modo, píldora ≥ 75rem, barra dorada, lámina mobile), `MenuButton`.
- **Datos y contenido:** igual que F1 (`src/data/`, `src/content/`, mock).
- **QA:** `pnpm qa <plan.json>` y `pnpm qa:regresion` (todos los planes de `qa/plans/`, con resultados esperados). Capturas en `qa/shots/` (ignorada). Requiere `pnpm dev`.

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

- **F6 — PLATOS** (ref. 03): franja superior con foto oscurecida y fila inferior de tres paneles (`BlurSwapImage`, origen en Caslon con `WipeSwap`, carrusel con anillo de progreso de 7 s).
- **"Ver la carta"** hoy solo cambia el botón MENU a CERRAR: el overlay de la carta es F9.
- **Licencias:** confirmar si fotos y video son de licencia libre → recién ahí versionar `public/media/`. Ojo: el video (HOME, ahora a pantalla completa) muestra el cartel de otro negocio ("Historia Meze & Grill"), `restaurant5` el nombre "Gustav", `food2` una botella de Guinness.
- **Medios en baja resolución:** fuentes de 495–1280 px y video 852×480; a pantalla completa se notan.
- **Datos de HOME** (140 etiquetas, 12 h, 38 cubiertos, 4,8) son placeholder en `site.config.ts → home`.
- **Sin fotos de postres.**
- **Pedir al backend:** teléfono y email, slug y orden de categorías, coordenadas, horario de cocina, porción, foto por ítem/categoría, etiquetas dietarias, catálogo de alérgenos.
- Probar en un trackpad y un teléfono reales (inercia y touch están simulados).
- `useGSAP` con dependencias acumula animaciones en su contexto hasta desmontar (menor).
- `WipeSwap` (`src/motion/primitives/WipeSwap.tsx`): al ocultar la capa saliente (`display: 'none'`) conserva `outgoing.innerHTML`; vaciarlo al ocultar evitaría que `.textContent` del contenedor incluya el texto anterior oculto (menor).
- Subir TypeScript a 7 cuando `typescript-eslint` lo soporte.
