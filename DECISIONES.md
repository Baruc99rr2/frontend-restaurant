# DECISIONES

Una línea por decisión + motivo. Lo más nuevo abajo.

## F0 — Andamiaje y documentación (2026-10-21)

- Andamiaje escrito a mano (sin `create-vite`) → control total de versiones y archivos, sin plantilla que borrar.
- Versiones: Vite 8, React 19.3, Tailwind 4.3, ESLint 10 (flat config), typescript-eslint 8.72 → últimas estables al momento.
- TypeScript fijado en `~6.0` (no 7.0) → typescript-eslint 8.72 solo soporta TS `<6.1`; subir cuando lo soporte.
- `tsconfig` sin `baseUrl`, alias solo con `paths` + `resolve.alias` en Vite → `baseUrl` está deprecado en TS 6.
- TS con `noUncheckedIndexedAccess` además de `strict` → evita accesos a arrays/records sin chequear (datos del backend).
- Colores en dos capas: `--brand-*` en `:root` + `@theme inline` → el template se re-marca por cliente pisando variables en runtime (desde `site.config.ts` en F1) sin recompilar.
- Colores por defecto de Tailwind desactivados (`--color-*: initial`) → obliga a usar solo tokens de marca; se conservan `transparent` y `current`.
- El segundo tono de vino (`#7A1C2C`) se llama `vino-luz` → el ROADMAP lo lista como "+" de `vino` sin nombre propio.
- Overlay `rgba(0,0,0,.55)` + viñeta radial como token `velo` (color) y utilidad `velo` (fondo completo) → se repite en hero, fotos y video.
- Utilidades `font-gigante` / `font-ui` con `font-stretch` + `font-variation-settings 'wdth'` → el ancho 125/100 de §1 queda en un solo lugar.
- Archivo se importa desde `@fontsource-variable/archivo/wdth.css` (ejes peso + ancho); Caslon solo 400, 400 itálica y 700 → son los únicos usos previstos.
- Escala tipográfica fluida con `clamp()` como tokens `--text-*` de Tailwind (con line-height y tracking asociados) → `text-gigante` es solo un piso; el ajuste al ancho por JS llega en F3+.
- Rotación del marco como token `--marco-rotacion: -16deg` → motivo repetido en varias piezas.
- Página de prueba en `src/app/TokensPage.tsx`, sin router → el router llega con el escenario; la página puede quedar como ruta interna de QA.
- No se renombró `references/imagenN.png` a `reference/NN` como dice §3 → es material del usuario; el mapeo queda documentado en `CLAUDE.md`.
- `ROADMAP-FRONTEND.md` se copió tal cual a `ROADMAP.md` (canónico); el original no se commitea.
- `content/` y `api/` no se commitean en F0 → no se abrieron (regla de F0); se decide en F1 si van al repo o al `.gitignore`.
- `public/media/` todavía no está en `.gitignore` → se decide en F1 junto con el pipeline de assets.
