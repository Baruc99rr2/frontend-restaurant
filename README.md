# Quebracho — web pública de restaurante (template)

Web pública de un restaurante (lo que ve el comensal), pensada como template
white-label. Demo: **QUEBRACHO — cocina de fuego y bodega**.
Stack: Vite + React 19 + TypeScript strict + Tailwind v4.

Plan completo en [`ROADMAP.md`](ROADMAP.md) · estado en [`ESTADO.md`](ESTADO.md) · decisiones en [`DECISIONES.md`](DECISIONES.md).

## Arranque

```sh
pnpm install
pnpm media        # genera public/media/ desde content/ (ver abajo)
pnpm dev          # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo. `/` = muestras de tokens · `/dev/datos` = QA de datos y medios (solo en dev) |
| `pnpm build` | Typecheck + build de producción |
| `pnpm lint` | ESLint |
| `pnpm media` | Procesa `content/` → `public/media/` y `src/content/media.generated.ts` |
| `pnpm check:content` | Verifica que `editorial.json`, el mock y los medios encajen (ids, fotos, slugs) |
| `pnpm api:types` | Genera los tipos del backend desde `api/openapi.json` → `api/schema.d.ts` |
| `pnpm api:check` | `api:types` + verifica que `src/data/types.ts` sea idéntico al contrato |

## Carpetas fuera del repo

Estas carpetas están en `.gitignore` a propósito y viven solo en tu máquina:

| Carpeta | Qué va | Por qué no se sube |
|---|---|---|
| `api/` | `openapi.json` del backend + tipos generados | El contrato es privado del backend. **Nunca se sube.** |
| `content/` | Material crudo: `video.mp4`, `restaurant1..5.*`, `food1..10.*` | Material del cliente |
| `references/` | Capturas de referencia `imagen1..14.png` | Solo para diseñar |
| `public/media/` | Salida de `pnpm media` | Hasta confirmar que las fotos son de licencia libre |

`src/content/media.generated.ts` **sí** se versiona (rutas, tamaños y placeholders de 16px),
así el proyecto compila en un clon limpio aunque las fotos no estén.

## Contrato con el backend (tipos)

Los componentes usan tipos propios (`src/data/types.ts`, versionados) con la forma exacta
de la API pública. Para verificarlos contra el contrato real, en local:

1. Copiá el contrato del backend a `api/openapi.json`
   (sale de `/docs/json` del backend levantado; **no lo subas**: `api/` está ignorada).
2. Generá los tipos y verificá:

   ```sh
   pnpm api:types   # api/openapi.json → api/schema.d.ts (openapi-typescript)
   pnpm api:check   # falla si src/data/types.ts difiere del contrato
   ```

El chequeo está en `contract/check.ts` con su propio `tsconfig.contract.json`, fuera de
`src/`: por eso `pnpm build` funciona sin `api/`, y `pnpm api:check` solo corre donde está el contrato.
Si `api:check` falla, el backend cambió: actualizá `src/data/types.ts` (y el mock) hasta que pase.

Endpoints que usa la web: `GET /v1/public/{slug}`, `GET /v1/public/{slug}/menu`,
`GET /v1/public/{slug}/delivery-zones`. Hoy los responde `MockPublicRepository` desde
`mocks/public-local.json`; en F12 se cambia por `ApiPublicRepository` en `src/data/repository.ts`.
Para conectar hará falta cargar el dominio de la web en la variable de CORS del backend.

## Medios (`pnpm media`)

Entrada en `content/`: un video y fotos con nombre `restaurantN.*` / `foodN.*`
(ids estables `rN` / `fN`). Usa `sharp` y `ffmpeg-static` (no hace falta instalar ffmpeg).

- Fotos → AVIF + WebP en tres formas: `paisaje` 16:9, `retrato` 4:5, `banda` 12:5; tamaños `lg` y `sm`; placeholder de 16px.
- Video → `hero-lg.mp4` (CRF 24) y `hero-sm.mp4` (CRF 26), H.264, sin audio, `+faststart`, más póster AVIF/WebP.
- Nunca agranda: si la fuente es chica, sale a su tamaño máximo y el script avisa.
- Idempotente: solo re-codifica lo que cambió.

## Re-marcar para otro cliente

| Qué | Dónde |
|---|---|
| Colores, wordmark, contacto, mapa, redes, botones | `src/config/site.config.ts` (los colores se aplican como variables `--brand-*`) |
| Textos | `src/content/copy.es.ts`, `faq.ts`, `eventos.ts` |
| Fotos ↔ platos y categorías, slugs, platos insignia | `src/content/editorial.json` |
| Fotos y video | `content/` + `pnpm media` |
| Datos operativos (carta, precios, horarios, stock) | El backend (hoy, `mocks/public-local.json`) |
