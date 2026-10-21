# ESTADO

Última actualización: 2026-10-21 — **F1 completa**.
Repo remoto: https://github.com/Baruc99rr2/frontend-restaurant (público).

## Sub-fases

| Fase | Estado | Commit |
|---|---|---|
| F0 — Andamiaje y documentación | ✅ hecha | `feat(web): andamiaje y tokens` |
| — Mantenimiento (repo remoto, .gitignore, ROADMAP) | ✅ hecha | `chore(web): repo remoto y ajustes de roadmap` |
| F1 — Assets, contrato y contenido | ✅ hecha | `feat(web): medios, contrato y contenido` |
| F2 — Primitivas de movimiento, Navbar y botón MENU | ⏭ siguiente | — |
| F3–F12 | pendiente | — |

## Qué hay hoy

- **Stack:** Vite 8 + React 19 + TS 6 strict + Tailwind v4 + ESLint 10. Alias `@/`.
- **Tokens:** `src/styles/tokens.css`. `site.config.ts` → `applyBrandTheme()` escribe las `--brand-*` al arrancar.
- **Datos (`src/data/`):** `types.ts` (forma exacta de los 3 endpoints públicos), `PublicLocalRepository` + `MockPublicRepository` (lee `mocks/public-local.json`), `repository.ts`, `useLocal()` (cacheado), `format.ts` (precios, horas en zona del local), `estado.ts` ("Abierto ahora, cierra a las 00:30", horario agrupado, día distinto, cocina).
- **Mock:** 6 categorías con 31 platos (4–6 c/u) + 2 sin categoría, 4 sin stock, menú del día, promoción, 2 días distintos, 6 zonas de delivery.
- **Contenido (`src/content/`):** `editorial.json` (+ `editorial.ts` con uniones), `copy.es.ts`, `faq.ts`, `eventos.ts`, `media.generated.ts`, `media.types.ts`.
- **Medios:** `pnpm media` → 15 fotos × 3 formas × 2 tamaños × AVIF/WebP + video (2 versiones + póster). Idempotente. Total ~14 MB en `public/media/` (ignorada).
- **Chequeos:** `pnpm check:content` (ids editorial ↔ mock ↔ medios) y `pnpm api:check` (tipos propios = contrato).
- **QA:** `/` muestras de tokens · `/dev/datos` datos + editorial + medios (solo dev).
- **Componentes:** `Picture` (AVIF + WebP + placeholder).

## Verificación F1

- `pnpm media` ✅ genera todo; la 2.ª corrida no re-codifica nada (~3 s).
- `pnpm build` ✅ · `pnpm lint` ✅ · `pnpm check:content` ✅ · `pnpm api:check` ✅.
- Pruebas negativas: renombrar un campo en el mock rompe `tsc`; cambiar un tipo en `types.ts` rompe `api:check`.
- Capturas con Chrome headless (la extensión no estaba conectada): tokens y `/dev/datos` en desktop. Mobile no se pudo (headless no baja de ~500px).

## Pendientes / para la próxima sesión

- **Licencias:** confirmar si las fotos y el video son de licencia libre → recién ahí versionar `public/media/`. Ojo: `restaurant5` muestra el nombre "Gustav" en una vidriera, el póster del video un cartel de otro negocio y `food2` una botella de Guinness.
- **Medios en baja resolución:** fuentes de 495–1280 px y video 852×480; para un sitio a pantalla completa hacen falta fotos ≥ 1920 px y video 1080p.
- **Sin fotos de postres:** la categoría Postres no está en la demo.
- **Pedir al backend** (en el endpoint público): teléfono y email del local, slug y orden de categorías, coordenadas, horario de la cocina, porción por plato, foto/portada (o URL) por ítem y categoría, etiquetas dietarias (vegetariano, sin TACC), catálogo cerrado de alérgenos.
- F2: primitivas de movimiento, Navbar, botón MENU; página `/dev` (puede absorber `/dev/datos`).
- Subir TypeScript a 7 cuando `typescript-eslint` lo soporte.
