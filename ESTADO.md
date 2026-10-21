# ESTADO

Última actualización: 2026-10-21 — **F3 completa**.
Repo remoto: https://github.com/Baruc99rr2/frontend-restaurant (público).

## Sub-fases

| Fase | Estado | Commit |
|---|---|---|
| F0 — Andamiaje y documentación | ✅ hecha | `feat(web): andamiaje y tokens` |
| — Mantenimiento (repo remoto, .gitignore, ROADMAP) | ✅ hecha | `chore(web): repo remoto y ajustes de roadmap` |
| F1 — Assets, contrato y contenido | ✅ hecha | `feat(web): medios, contrato y contenido` |
| F2 — Primitivas de movimiento, Navbar y botón MENU | ✅ hecha (Gemini) + revisión | `feat(web): primitivas de movimiento, navbar y botón menu` · `fix(web): revision de F2` |
| F3 — Escenario I: intro y modo cerrado | ✅ hecha | `feat(web): escenario, intro y modo cerrado` |
| F4 — Escenario II: modo abierto, transiciones y HOME | ⏭ siguiente | — |
| F5–F12 | pendiente | — |

## Qué hay hoy

- **Stack:** Vite 8 + React 19 + TS 6 strict + Tailwind v4 + ESLint 10 + GSAP 3.15 (`@gsap/react`) + `lucide-react`. Alias `@/`.
- **Rutas:** `/` escenario · solo en dev: `/dev` (primitivas, navbar, MENU, reduced motion), `/dev/datos` (datos + editorial + medios), `/dev/tokens` (muestras).
- **Escenario (`src/stage/`):**
  - `stageMachine.ts` (reducer: `loading → intro → closed ⇄ opening/closing → open`, `lock`, cola de 1) + `StageProvider.tsx`.
  - `geometry.ts` (polígono por forma y viewport) + `frameController.ts` (tween de los 8 números, seguro ante resize) + `Frame.tsx` (clip-path, clic/Enter para abrir).
  - `useStepInput.ts` (Observer: wheel con un paso por gesto e inercia filtrada, swipe > 50 px, ↓/↑, PageDown/PageUp, Espacio; soporte de scroller interno).
  - `Intro.tsx` (loader con anillo dorado → marco a escala 0.25 que crece → textos), `ClosedView.tsx` (título gigante ajustado al ancho, etiquetas que ruedan, números laterales desplegables, "Hacé clic / Tocá para entrar"), `StageMedia.tsx` (video de HOME + 5 fotos), `OpenPlaceholder.tsx` (modo abierto provisorio con "Vista general" y Esc), `Stage.tsx` (orquesta los timelines).
  - Hash: `/#eventos` entra directo abierto; abrir escribe el hash, cerrar lo limpia.
- **Movimiento (`src/motion/`):** `gsap.ts`, `tokens.ts` (incluye intro y paso cerrado), `useReducedMotion` (+ `getReducedMotionSnapshot`), primitivas `Reveal` (entrada y salida enmascaradas), `SlideIn`, `WipeSwap`, `BlurSwapImage`, `CountUp`.
- **Componentes:** `Picture` (AVIF + WebP + placeholder, `fetchPriority`), `Navbar` (píldora por container query ≥ 75rem, barra dorada deslizante, lámina mobile), `MenuButton` (líquido con doble ola).
- **Datos y contenido:** igual que F1 (`src/data/`, `src/content/`, mock). `copy.es.ts` suma `escenario` (textos accesibles y del placeholder).
- **QA:** `pnpm qa <plan.json>` (`scripts/qa-browser.mjs`): Chrome headless por DevTools con emulación táctil, reduced motion, wheel/teclado/swipe y capturas.

## Verificación F3

- `pnpm build` ✅ · `pnpm lint` ✅ · `pnpm check:content` ✅.
- Probado en Chrome (desktop 1440×900 y mobile 390×844 táctil):
  - Intro completa: loader → marco crece → HOME + etiquetas + wordmark/MENU → modo cerrado.
  - Wheel: 6 notches seguidos → 1 paso; trackpad con inercia → 1 paso; 2.º swipe sobre la inercia → encolado (2 pasos); 3 notches durante una transición → 2 pasos (cola de 1).
  - Teclado: 3× ↓ rápido → 2 pasos; PageUp/Espacio ok; Enter abre; Esc cierra.
  - Swipe 240 px → paso; 20 px → nada; hacia abajo → panel anterior; tap en el marco → abre.
  - Clic fuera del polígono no abre; clic en un número lateral salta directo.
  - Resize a mitad de paso y después: el polígono queda centrado y con la forma del nuevo tamaño.
  - `/#eventos` → abierto en EVENTOS; Esc → cerrado y URL limpia.
  - Reduced motion: intro con fades, paso con fundido de 200 ms sin desplazamiento, video pausado.
- `/dev` (revisión de F2): barra del navbar se desliza, líquido parejo, táctil sin vino trabado, Reveal sale y re-entra a mitad sin saltos.

## Pendientes / para la próxima sesión

- **F4:** `OpenView` real (apertura con textos de panel, paso entre secciones abiertas, links del navbar, "Vista general" definitivo), panel HOME completo.
- **Licencias:** confirmar si fotos y video son de licencia libre → recién ahí versionar `public/media/`. Ojo: el video (HOME) muestra el cartel de otro negocio ("Historia… Turkish cuisine"), `restaurant5` el nombre "Gustav", `food2` una botella de Guinness.
- **Medios en baja resolución:** fuentes de 495–1280 px y video 852×480; a pantalla completa se notan.
- **Sin fotos de postres.**
- **Pedir al backend:** teléfono y email, slug y orden de categorías, coordenadas, horario de cocina, porción, foto por ítem/categoría, etiquetas dietarias, catálogo de alérgenos.
- Probar en un trackpad y un teléfono reales (las pruebas de inercia y touch son simuladas).
- `useGSAP` con dependencias acumula animaciones en su contexto hasta desmontar (menor).
- Subir TypeScript a 7 cuando `typescript-eslint` lo soporte.
