# ESTADO

Última actualización: 2026-10-21 — **F0 completa**.

## Sub-fases

| Fase | Estado | Commit |
|---|---|---|
| F0 — Andamiaje y documentación | ✅ hecha | `feat(web): andamiaje y tokens` |
| F1 — Assets, contrato y contenido | ⏭ siguiente | — |
| F2–F12 | pendiente | — |

## Qué hay hoy

- Vite 8 + React 19 + TypeScript 6 (strict + `noUncheckedIndexedAccess`) + Tailwind v4 + ESLint 10. Alias `@/` → `src/`.
- `src/styles/tokens.css`: colores de marca (`--brand-*` → `@theme inline`), familias, escala tipográfica fluida, `--marco-rotacion`, utilidades `font-gigante`, `font-ui`, `velo`.
- `src/styles/globals.css`: Tailwind + tokens + fuentes autohospedadas (Archivo variable con eje `wdth`, Libre Caslon Text 400/400i/700) + base.
- `src/app/TokensPage.tsx`: página de prueba con muestras de color, tipografía (incluido eje de ancho), escala fluida y acentos.
- Docs: `CLAUDE.md`, `ROADMAP.md`, `ESTADO.md`, `DECISIONES.md`.

## Verificación F0

- `pnpm build` ✅ sin errores (typecheck + build).
- `pnpm lint` ✅ sin errores.
- `pnpm dev` ✅ levanta en :5173 y sirve todos los módulos; el CSS incluye las utilidades de marca y ningún color por defecto de Tailwind.
- Capturas: no se pudieron tomar (extensión de Chrome no conectada en la sesión).

## Pendientes / para la próxima sesión

- F1: abrir `content/` y `api/`; decidir si van al repo o al `.gitignore` (hoy quedan sin trackear).
- F1: decidir si `public/media/` se versiona o se ignora.
- F1: `site.config.ts` debe poder pisar las variables `--brand-*` (white-label).
- `ROADMAP-FRONTEND.md` quedó sin trackear (duplicado de `ROADMAP.md`); el usuario puede borrarlo.
- Revisar visualmente `TokensPage` en el navegador (no hubo capturas en F0).
- Subir TypeScript a 7 cuando `typescript-eslint` lo soporte.
