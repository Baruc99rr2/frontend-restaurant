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
- QA de datos: `pnpm dev` → http://localhost:5173/dev/datos
- Capturas y QA de movimiento: si la extensión de Chrome no está conectada, `pnpm qa <plan.json>`
  (`scripts/qa-browser.mjs`: Chrome headless por DevTools, sin dependencias). El plan (JSON, fuera del repo)
  admite viewport con emulación táctil (sirve para mobile real a 390 px), reduced motion, wheel, teclado,
  swipe, clic, `eval` y capturas. Ver el encabezado del script.

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
