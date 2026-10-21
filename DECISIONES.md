# DECISIONES

Una línea por decisión + motivo. Lo más nuevo abajo.

## F0 — Andamiaje y documentación (2026-10-21)

- Andamiaje escrito a mano (sin `create-vite`) → control total de versiones y archivos, sin plantilla que borrar.
- Versiones: Vite 8, React 19.3, Tailwind 4.3, ESLint 10 (flat config), typescript-eslint 8.72 → últimas estables al momento.
- TypeScript fijado en `~6.0` (no 7.0) → typescript-eslint 8.72 solo soporta TS `<6.1`; subir cuando lo soporte.
- `tsconfig` sin `baseUrl`, alias solo con `paths` + `resolve.alias` en Vite → `baseUrl` está deprecado en TS 6.
- TS con `noUncheckedIndexedAccess` además de `strict` → evita accesos a arrays/records sin chequear (datos del backend).
- Colores en dos capas: `--brand-*` en `:root` + `@theme inline` → el template se re-marca por cliente pisando variables en runtime sin recompilar.
- Colores por defecto de Tailwind desactivados (`--color-*: initial`) → obliga a usar solo tokens de marca; se conservan `transparent` y `current`.
- El segundo tono de vino (`#7A1C2C`) se llama `vino-luz` → el ROADMAP lo lista como "+" de `vino` sin nombre propio.
- Overlay `rgba(0,0,0,.55)` + viñeta radial como token `velo` (color) y utilidad `velo` (fondo completo) → se repite en hero, fotos y video.
- Utilidades `font-gigante` / `font-ui` con `font-stretch` + `font-variation-settings 'wdth'` → el ancho 125/100 de §1 queda en un solo lugar.
- Archivo se importa desde `@fontsource-variable/archivo/wdth.css` (ejes peso + ancho); Caslon solo 400, 400 itálica y 700 → son los únicos usos previstos.
- Escala tipográfica fluida con `clamp()` como tokens `--text-*` de Tailwind → `text-gigante` es solo un piso; el ajuste al ancho por JS llega en F3+.
- Rotación del marco como token `--marco-rotacion: -16deg` → motivo repetido en varias piezas.
- Página de prueba en `src/app/TokensPage.tsx`, sin router → el router llega con el escenario.

## Mantenimiento previo a F1 (2026-10-21)

- `api/`, `references/`, `content/` y `public/media/` en `.gitignore` → contrato privado del backend, material del cliente y fotos de licencia sin confirmar.
- El commit de F0 se reescribió (antes del primer push) para sacar `references/` → si no, las capturas quedaban en el historial del repo público.
- ROADMAP corregido: `references/imagenN.png`, contrato local en `api/openapi.json`, repo remoto público → que otro agente no se confunda.

## F1 — Assets, contrato y contenido (2026-10-21)

**Contrato y datos**
- La API pública real son 3 endpoints (`/v1/public/{slug}`, `/menu`, `/delivery-zones`), no uno → el mock guarda las tres respuestas con una clave por endpoint (`local`, `menu`, `delivery_zones`) y el ROADMAP §4 se actualizó.
- `src/data/types.ts` replica la respuesta 200 de cada endpoint campo por campo (snake_case incluido) → así no hace falta mapper; `pnpm api:check` exige igualdad estricta contra los tipos generados.
- Chequeo de contrato en `contract/check.ts` + `tsconfig.contract.json`, fuera de `src/` → el build no depende de `api/` (ignorada); el chequeo corre solo donde está el contrato.
- Tipos generados con `openapi-typescript` en `api/schema.d.ts` → desde el archivo local en vez de la URL del backend (el backend no tiene por qué estar levantado).
- Mock tipado con `satisfies Widen<PublicLocalData>` + validación de `vertical` → un JSON importado no conserva uniones de literales; así igual falla en compilación si falta o sobra un campo.
- Interfaz con `getZonasDelivery()` además de las 3 del ROADMAP → la FAQ de delivery necesita las zonas del backend.
- `getMenuDelDia()` sale del mismo pedido que `getCarta()` → el backend lo trae dentro de `/menu`.
- `useLocal()` con `useSyncExternalStore` y caché de módulo, sin Suspense → un pedido por endpoint por carga; los componentes eligen cómo mostrar carga/error.
- Mock con 150 ms de demora → para que los estados de carga se diseñen desde ya.
- Valores dinámicos del mock (`open_now`, `open_until`, `date`) fijos al 2026-10-21 → el mock no recalcula horarios; eso lo hace el backend.
- Horario semanal y días distintos se muestran tal cual ("HH:MM" ya en hora local); solo los instantes ISO (`open_until`, `next_opening`, `resumes_at`) se convierten a la zona del local → así lo define el contrato.
- Precios: sin decimales si son enteros ("$ 18.500") → como el ejemplo del propio backend ("180000 son $1.800").
- Alérgenos: el backend manda texto libre; la leyenda (marca + nombre) vive en `copy.es.ts` y lo desconocido se muestra tal cual.

**Editorial y config**
- `site.config.ts` maneja las `--brand-*`: `applyBrandTheme()` las escribe en `:root` antes del primer render; tokens.css guarda los mismos valores como respaldo → re-marcar = cambiar el config.
- Sin horarios en `site.config.ts` (aunque §3 los menciona) → §12: horarios y precios solo del backend.
- Teléfono y email en `site.config.ts` como placeholders evidentes (388 000-0000, `@quebracho.example`) → el endpoint público no los trae, y un número plausible podría ser de alguien real.
- Coordenadas del mapa: centro de San Salvador de Jujuy (placeholder) → no existen en el backend.
- Cifras del HOME en `site.config.home` con `placeholder: true` → como pide §8.
- Slug de categoría en `editorial.json` (con respaldo derivado del nombre) → el backend no tiene slug.
- Grupos dentro de categoría en `editorial.json` (solo Bodega: Tintos / Blancos y rosados / Tu botella); lo que no esté en un grupo igual aparece → el backend no tiene grupos.
- Porción en `editorial.json` → el backend no la tiene.
- Etiquetas laterales del modo cerrado (2 líneas por lado) escritas en `copy.es.ts` → el ROADMAP no las define.
- Ícono de cada ítem de LA CASA como nombre de lucide en string → los íconos se renderizan en F5.
- `faq.ts` marca la pregunta de delivery como `dinamica: 'zonas-delivery'` → la lista de barrios sale del backend.
- `eventos.ts`: fórmulas puras en `calcularEvento()`; presupuesto en centavos (placeholder) redondeado a $100.

**Categorías y fotos**
- Categorías adaptadas a las fotos: Entradas, Fuegos, Pastas, Del horno, **Del mar y la huerta** (en lugar de Postres), Bodega → no hay ninguna foto de postre y cada categoría pide portada propia.
- Bodega usa `r3` (copas de tinto frente al fuego) como portada → no hay foto de vino; §9 lo permite.
- `r1` (terraza con pileta) queda para Open Graph → no encaja con "cocina de fuego"; es la única sin uso en el sitio.
- Platos nombrados según lo que muestra cada foto, adaptados a cocina argentina: el plato de `f10` pasa a "matambrito sobre crema de queso de cabra", y la hamburguesa (`f2`) entra en Fuegos.

**Pipeline de medios**
- Nunca agrandar: cada variante sale como mucho al tamaño de la fuente y se registra el tamaño real → las fuentes son chicas (495–1280 px, video 852×480); agrandar solo engorda archivos borrosos.
- Variantes nombradas por rol (`lg`/`sm`, `hero-lg.mp4`) y no por píxeles (`hero-1080`) → con fuentes chicas, el nombre en píxeles mentiría.
- Las 15 fotos salen en las 3 formas (paisaje, retrato, banda) → cualquier foto puede ir a escenario, marco inclinado o portada sin tocar el script.
- Un manifiesto por script (`public/media/*.manifest.json`) y un módulo compartido que escribe `media.generated.ts` → el orden en que corren los scripts no importa.
- `media.generated.ts` se versiona → el proyecto compila en un clon limpio aunque `public/media/` esté ignorada (incluye placeholders de 16px derivados de las fotos).
- Póster del video en dos tamaños (lg/sm) → uno por fuente de video.
- `ffmpeg-static` habilitado en `pnpm-workspace.yaml` (`allowBuilds`) → pnpm 11 bloquea su descarga del binario por defecto.
- Página de QA `/dev/datos` (solo en dev, con `lazy`): no entra al build de producción → para revisar las uniones datos + editorial + medios antes de las secciones.
- Componente `Picture` (AVIF + WebP + placeholder de fondo) → lo van a usar todas las secciones.

### Foto → uso

| Id | Archivo | Fuente | Qué muestra | Uso |
|---|---|---|---|---|
| r1 | restaurant1 | 1280×720 | Terraza con pileta y chefs | Open Graph (F11) |
| r2 | restaurant2 | 1280×720 | Mesa con bife, papas y tintos | Escenario LA CASA + foto del marco inclinado |
| r3 | restaurant3 | 1280×720 | Cena con tinto frente al fuego | Escenario y fondo de EVENTOS · portada de Bodega |
| r4 | restaurant4 | 1280×720 | Deck al atardecer frente al mar | Escenario PREGUNTAS |
| r5 | restaurant5 | 1280×878 | Salón gris con sillas amarillas | Escenario CONTACTO |
| f1 | food1 | 1280×853 | Pasta rellena gratinada en sartén | Sorrentinos gratinados · insignia (Mar del Plata) |
| f2 | food2 | 547×365 | Hamburguesa con papas | Hamburguesa de la casa |
| f3 | food3 | 1280×854 | Spaghetti con langostinos | Spaghetti con langostinos · insignia (Rawson) · portada de Pastas |
| f4 | food4 | 678×452 | Tres platos caseros (rigatoni con albóndigas) | Rigatoni con albóndigas |
| f5 | food5 | 554×554 | Lomo asado con vegetales | Lomo al horno de barro · insignia (Quebrada) · portada de Del horno |
| f6 | food6 | 739×415 | Bife grueso a la brasa | Bife de chorizo grueso · insignia (Pampa húmeda) · portada de Fuegos |
| f7 | food7 | 853×1280 | Bowls de langostinos y pescado con cuscús | Langostinos a la plancha · portada de Del mar y la huerta |
| f8 | food8 | 640×479 | Ojo de bife en tabla de hierro | Ojo de bife · escenario y franja de PLATOS |
| f9 | food9 | 853×1280 | Pollo al horno con salsa | Pollo de campo al horno · insignia (Entre Ríos) |
| f10 | food10 | 495×619 | Carne en fetas sobre crema, cherrys | Matambrito a la brasa · portada de Entradas |
| video | video.mp4 | 852×480, 31 s | — | HOME (escenario e intro) |

## F2 — Primitivas de movimiento, Navbar y botón MENU (2026-10-21)

- Las "6 primitivas" de §6 son los 5 componentes (`Reveal`, `SlideIn`, `WipeSwap`, `BlurSwapImage`, `CountUp`) + el hook `useReducedMotion` (los 6 ítems listados en §6) → se re-exportan todos desde `src/motion/primitives/index.ts` y `src/motion/index.ts`.
- `useReducedMotion` implementado con `useSyncExternalStore` + `setReducedMotionOverride()` → evita `setState` en `useEffect` (reglas de React 19) y permite que el switch de `/dev` fuerce u omita reduced motion en tiempo real sobre toda la app sin recargar.
- `Reveal` con `SplitText` de GSAP 3.15 usando `mask: mode` nativo y `type: 'words,chars'` cuando `mode === 'chars'` → evita que una palabra se corte a mitad de renglón al envolver líneas.
- `WipeSwap` con doble capa en grilla (`inline-grid`, `outgoing` + `incoming` en la misma celda) controlada por GSAP sin `setState` intermedio → el contenedor mantiene su tamaño natural sin colapsar y, si se interrumpe a mitad en ráfaga, retoma desde el `clip-path` actual sin parpadeo ni apilar timelines.
- `BlurSwapImage` asigna `img.src` recién cuando terminan en paralelo el desenfoque de salida (`blur(14px)` + `scale(1.08)`) y `new Image().decode()`, con contador de petición (`reqId`) → evita que React pise el `src` antes de desenfocar y descarta precargas viejas si se interrumpe.
- `CountUp` interpola sobre un objeto mutable en ref y escribe `textContent` en `onUpdate` → si se interrumpe a mitad, el nuevo tween arranca exactamente desde el número intermedio alcanzado.
- Píldora de vidrio del `Navbar` con `bg-champan/10 border-champan/15 backdrop-blur-md` en lugar de `rgba(255,255,255,.08)` → los colores por defecto de Tailwind (`white`) están desactivados en `tokens.css` y la regla exige usar únicamente tokens de marca (`--brand-*`).
- Cuando el panel activo es `platos` (`navbar: null` en `copy.es.ts`), la barra dorada del `Navbar` se desvanece (`opacity: 0`) y reaparece deslizándose al volver a cualquiera de los 5 paneles con link.
- `MenuButton` mueve el nivel vertical del líquido con `yPercent` (`106` vacío → `82` hover ~15% → `0` lleno) y dos SVG de `width="200%"` con período exacto de 100 unidades que ciclan a `xPercent: -50` en sentidos/velocidades desfasadas (`fill-vino` y `fill-vino-luz`) → loop horizontal continuo sin costuras y subida/bajada interrumpible sin saltos.
- `/dev` se mantiene junto a `/dev/datos` (ambas con `import.meta.env.DEV ? lazy(...) : null`, fuera del bundle de producción) y enlaza a `/` y `/dev/datos` en su cabecera.

