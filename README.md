# Quebracho — web pública de restaurante (template)

Web pública de un restaurante (lo que ve el comensal), pensada como template
white-label. Demo: **QUEBRACHO — cocina de fuego y bodega**.
Stack: Vite + React 19 + TypeScript strict + Tailwind v4.

Plan completo en [`ROADMAP.md`](ROADMAP.md) · estado en [`ESTADO.md`](ESTADO.md) · decisiones en [`DECISIONES.md`](DECISIONES.md).

## Arranque

```sh
pnpm install
pnpm dev          # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo. `/` = escenario · solo en dev: `/dev` primitivas y navbar, `/dev/datos` datos y medios, `/dev/tokens` muestras |
| `pnpm qa <plan.json>` | QA en Chrome headless por DevTools (viewport/táctil, reduced motion, wheel, teclado, capturas). Ver `scripts/qa-browser.mjs` |
| `pnpm qa:regresion` | Corre todos los planes de `qa/plans/` con sus resultados esperados (necesita `pnpm dev`). Capturas en `qa/shots/` |
| `pnpm qa:responsive` | Regenera `qa/plans/responsive.json` (14 tamaños de 240×320 a 2560×1440, más celular acostado). Correrlo solo: `pnpm qa qa/plans/responsive.json` (capturas en `qa/shots/responsive/`) |
| `pnpm build` | Typecheck + build de producción |
| `pnpm preview` | Sirve `dist/` en http://localhost:4173 (con el fallback de SPA de `/carta`) |
| `pnpm lint` | ESLint |
| `pnpm media` | Procesa `content/` → `public/media/` y `src/content/media*.generated.ts` |
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

`public/media/` (salida de `pnpm media`: fotos AVIF/WebP y video) **sí** se versiona, junto con
`src/content/media.generated.ts` (rutas y tamaños) y `media.placeholders.generated.ts` (miniaturas
borrosas de 16 px, en un chunk aparte): un clon limpio hace `pnpm install && pnpm build` y el
resultado ya tiene fotos y video (así se despliega en Vercel desde GitHub). `pnpm media` solo hace
falta para regenerarlos desde `content/`.

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

## Cómo adaptar a un cliente

La regla: **lo que existe en el backend no se escribe a mano.** Nombre del local, dirección,
horarios, carta, precios (en centavos), stock, menú del día y zonas de delivery salen del
repositorio (hoy el mock; en F12, la API). Todo lo demás es editorial y vive en estos archivos:

| Qué | Archivo | Notas |
|---|---|---|
| Marca: wordmark, colores, contacto, mapa, redes, textos de botones, cifras del HOME | `src/config/site.config.ts` | Los colores se aplican como variables `--brand-*` al arrancar: cambiar un valor re-colorea todo (incluidas las utilidades `bg-oro`, `text-champan`…). Lo marcado `PLACEHOLDER` es de ejemplo. |
| SEO: dominio, título, descripción, cocina, rango de precios | `site.config.ts` → `seo` | El build escribe `<title>`, description y Open Graph en `index.html`; el JSON-LD `Restaurant` se arma en el navegador con los datos del repositorio. **Cambiar `seo.url` por el dominio real.** |
| Textos del sitio | `src/content/copy.es.ts` | Un texto visible = una entrada; nada de textos de marca en componentes. |
| Preguntas frecuentes | `src/content/faq.ts` | |
| Calculadora de eventos (fórmulas, ocasiones, formatos, mensaje de WhatsApp) | `src/content/eventos.ts` | |
| Fotos ↔ escenario, categorías y platos | `src/content/editorial.json` | Se une al backend **por id**: `categorias[id] = { slug, portada }`, `platos[id] = { foto, porcion }`, `insignia` (platos del carrusel de PLATOS con origen y región), `medios` (fotos de cada panel y la de Open Graph). |
| Fotos y video | `content/` → `pnpm media` | Nombres `restaurantN.*` / `foodN.*` (ids `rN` / `fN`) y un video. |
| Datos operativos | backend (hoy `mocks/public-local.json`) | `slug` del local en `site.config.ts`. |

Pasos para un cliente nuevo:

1. Copiar el repo y cambiar `site.config.ts` (marca, colores, contacto, coordenadas, redes, `seo`).
2. Poner sus fotos y video en `content/` y correr `pnpm media` (genera `public/media/` y los dos
   `media*.generated.ts`). Ver [Medios](#medios-pnpm-media).
3. Ajustar `editorial.json` a los ids de **su** carta en el backend (categorías, platos, insignia).
4. Revisar `copy.es.ts`, `faq.ts` y `eventos.ts`.
5. `pnpm check:content` (ids de `editorial.json` ↔ mock ↔ medios), `pnpm build` y `pnpm qa:regresion`.
6. Si el backend cambió: copiar su contrato a `api/openapi.json` y correr `pnpm api:check`
   (ver [Contrato con el backend](#contrato-con-el-backend-tipos)).

## Despliegue (fallback de SPA)

`pnpm build` deja todo en `dist/`. Las rutas `/carta` y `/carta/:slug` las resuelve la app: el
hosting tiene que responder `index.html` para ellas (y servir el resto de los archivos tal cual).
El escenario usa el hash (`/#eventos`), que no llega al servidor.

| Hosting | Configuración |
|---|---|
| Vercel | `vercel.json` (ya en el repo) |
| Netlify, Cloudflare Pages | `public/_redirects` (ya en el repo; se copia a `dist/`) |
| nginx | `location ~ ^/carta(/[^/]+)?/?$ { try_files /index.html =404; }` |
| Apache | `.htaccess`: `RewriteEngine On` + `RewriteRule ^carta(/[^/]+)?/?$ /index.html [L]` |
| Otro estático (S3, GitHub Pages…) | Servir `index.html` como respuesta para esas dos rutas; si el hosting solo permite una página de error, usar `index.html` como 404 (funciona, pero responde con estado 404). |
| `pnpm preview` | Ya hace el fallback (sirve para probar el build). |

Los assets de `dist/assets/` llevan hash en el nombre: se pueden cachear para siempre.

## Rendimiento

- Chunks: la app (~148 kB), React y GSAP aparte (caché), y por ruta: overlay de la carta,
  página de categoría (con Lenis y Flip), mapa (Leaflet) y miniaturas borrosas. `/dev` no entra al build.
- `index.html` ya trae el loader de la intro (se pinta antes del JS), precarga el póster del
  video y las fuentes de la intro.
- Primera carga liviana: los paneles del modo abierto se montan de a uno cuando el navegador
  queda libre (o al toque si se entra por hash), la carta se monta al terminar la intro y el
  escenario pide primero las fotos del panel actual y sus vecinos.
- Lighthouse móvil (build local, `pnpm preview`): ver `ESTADO.md`.

## Pendientes antes de vender

- **Mapa:** las teselas salen de `tile.openstreetmap.org`, cuya política no admite uso comercial
  intensivo. Pasar a un proveedor con uso comercial (MapTiler, Stadia, Carto, Mapbox…) en
  `src/sections/Contacto/ContactoMapa.tsx`, con su atribución. Ojo: la mayoría pide una API key
  (hoy el sitio no usa ninguna cuenta).
- **Licencias de fotos y video:** `public/media/` se versiona para la demo personal; antes de
  usar el template para un cliente, reemplazar los medios por los suyos. El video de HOME muestra el cartel de otro negocio ("Historia Meze & Grill"),
  `restaurant5` el nombre "Gustav" y `food2` una botella de Guinness: reemplazarlos. Fuentes de
  495–1280 px y video 852×480: a pantalla completa se notan.
- **Placeholders de `site.config.ts`:** teléfono, WhatsApp, email, coordenadas, redes, cifras del HOME y `seo.url`.
- **Pedir al backend** (hoy viven en `site.config.ts` / `editorial.json` o faltan): teléfono y
  email del local, slug y orden de categorías, coordenadas, horario de cocina, porción por ítem,
  foto por ítem y por categoría, etiquetas dietarias y catálogo de alérgenos.
- **F12 — conexión al backend** (ver `ROADMAP.md`): tipos desde `api/openapi.json`, mapper,
  `ApiPublicRepository` en `src/data/repository.ts`, URL por variable de entorno, dominio en el
  CORS del backend, estados de carga y error con el estilo del sitio, prueba contra `restaurante-demo`.
- Probar en teléfono y trackpad reales (carrusel con snap, flip, polaroid, mapa, inercia): en QA el toque está emulado.
