# CLAUDE.md — Frontend QUEBRACHO (template de restaurante)

Web pública de un restaurante (lo que ve el comensal). No es el panel del dueño (`proyecto-ia-panel`).
Plan completo: `ROADMAP.md`. Estado actual: `ESTADO.md`. Decisiones: `DECISIONES.md`.

## Reglas de trabajo

- Una sub-fase por sesión, un commit por sub-fase. Trabajo autónomo dentro de la sub-fase, sin pedir aprobación a mitad.
  Al terminar: actualizar `ESTADO.md` y reportar (qué se hizo, decisiones tomadas, pendientes, capturas si se pudo).
- Leer solo los archivos indicados en cada sub-fase + `CLAUDE.md` + `ESTADO.md`.
- Windows/PowerShell: todo script va a un archivo (`scripts/*.mjs`), nunca inline ni en heredoc.
- Paquetes con `pnpm`. Repo independiente: no leer ni tocar nada de `proyecto-ia`.
- Plata en **centavos enteros** y horarios en **UTC**, convertidos a `America/Argentina/Jujuy` solo al mostrarlos (mismas reglas que el backend).
- Las imágenes de referencia se miran con la herramienta de visión cuando la sub-fase lo indique. Son referencia de layout y movimiento, **no de colores**.
- Decisiones nuevas → `DECISIONES.md` (una línea por decisión + motivo).

## Regla de oro de movimiento

Ningún cambio de estado es brusco.
- Texto que cambia → barrido (sale enmascarado, entra enmascarado).
- Imagen que cambia → desenfoque + leve zoom → cambio → enfoque.
- Nada aparece ni desaparece sin transición.

Motivo visual único: el **marco inclinado** (cuadrilátero rotado ~-16°, token `--marco-rotacion`). Se repite con intención (marco del modo cerrado, imagen central de LA CASA, cartelitos de la carta, polaroids). Todo lo demás es sobrio.

## Repo y carpetas fuera del repo

- Remoto **público**: https://github.com/Baruc99rr2/frontend-restaurant. Nada privado del backend entra al repo.
- Fuera del repo (`.gitignore`), solo lectura:
  - `api/` — `openapi.json` del backend + tipos generados. Local a propósito: **nunca se sube**.
  - `references/` — capturas `imagenN.png` (N = ref. del mapa de §0; `imagen6.png` = ref. 06).
  - `content/` — material crudo del usuario.
- `public/media/` también está ignorada hasta confirmar que las fotos son de licencia libre.

## Comandos

- `pnpm dev` — servidor de desarrollo (http://localhost:5173)
- `pnpm build` — typecheck (`tsc -b`) + build de producción
- `pnpm lint` — ESLint
- `pnpm media` — procesa `content/` → `public/media/` + `src/content/media.generated.ts`
- `pnpm check:content` — ids de `editorial.json` ↔ mock ↔ medios
- `pnpm api:check` — genera tipos desde `api/openapi.json` y verifica que `src/data/types.ts` sea idéntico (solo local)
- `pnpm preview` — sirve `dist/` (con fallback de SPA); Lighthouse se mide contra esto
- Rutas (`src/app/router.ts`, sin dependencias): `/` escenario · `/carta` escenario + overlay de la carta (el mismo `<Stage>`,
  no se desmonta) · `/carta/:slug` categoría · solo dev: `/dev` (primitivas, navbar, MENU), `/dev/datos` (datos y medios), `/dev/tokens` (muestras).
- Escenario (`src/stage/`): estado en `stageMachine.ts` (reducer puro); los timelines viven en `Stage.tsx`/`Intro.tsx`
  y al terminar despachan el evento siguiente. Movimiento nuevo → usar/extender las primitivas de `src/motion/`, no duplicarlas.
- Capturas y QA de movimiento: si la extensión de Chrome no está conectada, `pnpm qa <plan.json>`
  (`scripts/qa-browser.mjs`: Chrome headless por DevTools, sin dependencias). El plan (JSON) admite viewport
  con emulación táctil (sirve para mobile real a 390 px), reduced motion, wheel, teclado, swipe, clic,
  `eval` (con `expect` opcional: falla si el resultado difiere) y capturas. Ver el encabezado del script.
- **Regresión:** `pnpm qa:regresion` corre todos los planes de `qa/plans/` (con `pnpm dev` levantado).
  Cada fase suma sus planes (`fN-*.json`) y antes de cerrar corre la regresión completa. Capturas en `qa/shots/` (ignorada).

## Datos

- Operativo (backend): `src/data/` — tipos con forma exacta de la API, `PublicLocalRepository`, `MockPublicRepository` (lee `mocks/public-local.json`), `useLocal()` (un pedido por endpoint por carga, cacheado).
- Editorial (por cliente): `src/config/site.config.ts`, `src/content/*`. Se une al operativo por id del backend.
- Nunca escribir precios ni horarios a mano en editorial.

## Convenciones técnicas

- Alias `@/` → `src/`.
- Colores: solo los tokens de marca (`bg-oro`, `text-champan`, …). Los colores por defecto de Tailwind están desactivados.
  Los valores viven en `src/styles/tokens.css` como `--brand-*` en `:root` (lo que se re-marca por cliente) y se exponen con `@theme inline`.
- Tipografía: `font-gigante` (Archivo ancho 125 / 800), `font-ui` (Archivo ancho 100), `font-serif` (Libre Caslon Text).
  Escala fluida: `text-gigante`, `text-display`, `text-titulo`, `text-subtitulo`, `text-cuerpo`, `text-ui`, `text-etiqueta`.
- Overlay oscuro sobre fotos/video: utilidad `velo`.
- TypeScript fijado en `~6.0` hasta que `typescript-eslint` soporte TS 7.
- pnpm 11 bloquea scripts de instalación: los permitidos van en `pnpm-workspace.yaml` → `allowBuilds` (hoy solo `ffmpeg-static`).

## Reglas aprendidas (errores de F5–F11 que no se repiten)

- **Fondos de sección:** van en la capa del panel (`FONDOS` en `src/stage/StageMedia.tsx`, cada sección exporta su `XFondo`),
  nunca dentro de `[data-open-text]`. Esa capa es lo que el escenario mueve en el paso abierto; lo que está en el texto se desvanece.
- **QA:** los planes nuevos no usan `{ "wait": N }` para esperar estados: usan `__waitUntil(fn, pred)` y `window.__qa`
  (`estable()`, `reposo()`, `cartaEstable()`, `reloj(escala)` para muestras a mitad de animación). `__sleep` solo marca el ritmo de un input.
  En viewport mobile el paso `click` es un toque (el clic de mouse con táctil emulado cuelga el protocolo).
- **Teclado en grupos:** todo grupo navegable con flechas usa `src/components/roving.ts` (foco itinerante, `tabIndex` 0 solo el actual,
  consume la tecla para que el escenario no pase de sección). No escribir manejadores de flechas a mano.
- **Gestos que chocan con el escenario:** contenido que scrollea → `data-stage-scroller`; zona con gestos propios (mapa activo) →
  `data-stage-gestos-propios`; tecla que la sección usa (↑ ↓ Espacio PageUp/PageDown) → `preventDefault` + `stopPropagation`.
  Algo modal encima del escenario → `useStepInput({ enabled: false })` + `inert` en lo de abajo (como la carta).
- **`preventDefault` de rueda o toque:** listener nativo `{ passive: false }`; el `onWheel` de React es pasivo y no frena nada.
- **Estado que lee un listener global** (refs de `enabled`, callbacks): sincronizarlo en `useLayoutEffect`, no en `useEffect`
  (si se habilita desde un tick de GSAP, el primer input se perdía).
- **Datos:** nada inventado en pantalla mientras carga (sin respaldos con datos falsos); la unión editorial + repositorio vive en
  `src/content/editorial.ts` (`categoriasCarta`, `platosInsignia`), no se repite en componentes.
- **Copy:** cada texto visible sale de `copy.es.ts` o `site.config.ts`, entero; no armar textos con `replace` sobre otro copy.
- **Colores:** ni `rgb()`/`rgba()` sueltos (tampoco en sombras): tokens, con `color-mix` si hace falta transparencia. `vino` solo en el MENU.
- **Transformaciones:** un elemento, un dueño. Si GSAP anima el `transform`, la posición base fija (rotación, desplazamiento) va en
  otra capa o con `rotate`/`translate` de CSS (ver `CartaCard`). GSAP no recibe listas vacías (avisa): chequear antes.
- **Navegación:** abrir/cerrar algo que tiene URL es navegar (`src/app/router.ts`; carta en `src/carta/navegacion.ts`), así
  botones, `Esc` y atrás del navegador comparten un solo estado. Cambio de página con barrido: `useWipeTransition().transicion(cambio)`
  (`src/carta/WipeTransition.tsx`), no otro barrido.
- **Montaje diferido (F11):** los paneles del modo abierto se montan al activarse o en reposo, y la carta al terminar la intro.
  Un plan no puede consultar un panel antes de que esté activo (esperar `data-texts`); `content-visibility: hidden` en los inactivos.
- **Archivos que lee `vite.config.ts`** (`src/config/seo.ts`, `loaderEstatico.ts` y lo que importan): imports relativos con extensión `.ts`
  y JSON con `with { type: 'json' }`, o Vite avisa (cargador nativo).
- **Fotos:** `placeholder` del catálogo es una clave; usar `Picture`/`BlurSwapImage` (resuelven con `usePlaceholder`), nunca `url(${placeholder})` a mano.
- **Antes de corregir un error, reproducirlo** con un plan sobre el código anterior; el arreglo queda cubierto por ese plan.
