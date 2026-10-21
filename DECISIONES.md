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


## Revisión de F2 (2026-10-21) — `fix(web): revision de F2`

Probado en Chrome (headless por DevTools, con emulación táctil a 390 px) con `scripts/qa-browser.mjs`.

- Navbar: la barra dorada no se deslizaba, saltaba → el `ResizeObserver` se recreaba en cada cambio de ítem y su primera notificación la reposicionaba sin animar. Ahora se crea una vez y lee la función de sincronización por ref.
- Navbar: "Sobre nosotros", "Preguntas frecuentes" partían en dos líneas y la píldora se encimaba al wordmark en anchos medios → `whitespace-nowrap` y la píldora aparece por container query cuando el header mide ≥ 75rem (debajo, botón de links + lámina). Motivo: lo que importa es el ancho del navbar, no el del viewport.
- Navbar: el ícono de links ↔ X cambiaba de golpe → los dos íconos quedan montados y se cruzan (opacidad + giro, 300 ms).
- MenuButton: en táctil, después de abrir y cerrar el vino quedaba asomado ~15% (el tap dispara `mouseenter` sin `mouseleave`) → hover solo con `pointerType === 'mouse'` o foco visible de teclado.
- MenuButton: el llenado usaba `expo.out` y llegaba arriba en ~0,25 s (se sentía un salto) → llenar y vaciar con `power4.inOut` en 0,9 s; asomar/retirar el hover sigue en 0,35 s.
- MenuButton: en 390 px el botón quedaba cortado → padding y tracking más chicos debajo de `sm`.
- Reveal: tenía `children` como dependencia, así que cualquier render del padre con JSX nuevo re-disparaba el reveal → depende del texto (`contentKey`) o de `triggerKey`.
- Reveal: si cambiaba el texto, `SplitText.revert()` restauraba el HTML viejo sobre el mismo nodo → el elemento se remonta por texto (`key`).
- Reveal: las líneas enmascaradas quedaban fijas y se recortaban al cambiar el ancho → al terminar la entrada se revierte el split (vuelve a texto plano que re-fluye).
- WipeSwap: interrumpido durante la entrada, el texto a medio barrer aparecía entero y recién ahí salía → la salida arranca desde el recorte visible.
- BlurSwapImage: A → B → A rápido terminaba mostrando B (la precarga de B seguía viva) → al volver a la imagen actual se descarta la precarga y se re-enfoca.
- CountUp: un `format` inline reiniciaba el conteo en cada render del padre → el formateador va por ref, no como dependencia.
- `/dev`: la caja del navbar ocupa casi todo el ancho (como el navbar real) para que se vea la píldora.
- `scripts/qa-browser.mjs`: QA con Chrome por el protocolo de DevTools sin dependencias (viewport/táctil, reduced motion, wheel, teclado, swipe, capturas). Motivo: la extensión de Chrome no conecta y el headless común no baja de ~500 px.
- Pendiente menor (sin cambiar): `useGSAP` con dependencias acumula en su contexto las animaciones de cada disparo hasta el desmontaje; no se nota en una sesión normal.

## F3 — Escenario I: intro y modo cerrado (2026-10-21)

- `/` pasa a ser el escenario; las muestras de tokens se mudan a `/dev/tokens` (solo dev, como `/dev` y `/dev/datos`).
- Máquina de estados en `stage/stageMachine.ts` (reducer puro) y `StageProvider` (contexto). La cola de 1 vive en el reducer: lo que llega con `lock` se encola una sola vez, contando desde el destino de la transición en curso. Motivo: un solo lugar decide; el input solo emite pasos.
- Marco (`stage/frameController.ts`): GSAP tween de un progreso 0 → 1 y en cada `onUpdate` se mezclan las 8 coordenadas de partida con las de destino recalculadas con el tamaño de ese momento. Motivo: un resize a mitad de animación converge a la forma correcta sin matar el timeline; sin animación se recalcula sin animar.
- Geometría (`stage/geometry.ts`): desktop 34vw × 72vh (limitado a que el cuadrilátero rotado ocupe ≤ 86% del alto), centro al 48%; vertical (ancho < alto) alto 54% y ancho mín(64vw, 0,62 × alto), centro al 47%. Ángulo = `--marco-rotacion` (leído de CSS, white-label) + variación por panel `[0, 1.6, -1.4, 2, -1.8, 1.1]°`.
- El tamaño del escenario se mide del elemento (`100svh`), no de `innerHeight`. Motivo: en mobile la barra del navegador cambia `innerHeight` y no el escenario.
- Paso cerrado (ref. 07): media a pantalla completa con `yPercent ±100` y ease `slide` (`power2.inOut`, token nuevo). Motivo: el marco ve solo el tramo central del recorrido; con `power4.inOut` el corte cruzaba el marco en ~0,3 s.
- Wheel: un paso por gesto (umbral acumulado 50). Gesto nuevo = pausa > 200 ms o re-aceleración después de haber decaído (swipe nuevo sobre la inercia). Probado con secuencias simuladas: 6 notches → 1 paso; trackpad con inercia → 1 paso; segundo swipe sobre la inercia → se encola.
- Swipe: `Observer` (touch) al soltar, |dy| > 50 y dominante sobre dx. Espacio sobre un botón/link conserva su acción nativa. Hay soporte para `data-stage-scroller` (paso solo en el borde) para F4+.
- Títulos gigantes: los 6 apilados, cada uno un `Reveal`. `Reveal` (F2) se extendió con la salida: `active` true → false anima las letras hacia abajo con la misma máscara, y volver a `true` a mitad retoma desde donde están. Motivo: "no crear versiones paralelas" de las primitivas.
- Tamaño del título: se mide a 100px y se escala para entrar en el ancho, con tope mín(16vw, 25% del alto) en desktop y 24vw en vertical. Motivo: con `text-gigante` fijo "PREGUNTAS" no entraba.
- Etiquetas que ruedan: pila con `overflow:hidden` desplazada con `yPercent` (slot 0 vacío para "rodar hacia adentro" en la intro). No es una primitiva nueva: es específico del modo cerrado.
- "Clic en los números laterales": el índice izquierdo rueda y, con hover o foco (o un toque en táctil), se despliega la lista 01–06 sin mover el número actual (en vertical se despliega hacia abajo). Interpretación propia: las refs muestran un solo número.
- Mobile: la fila de etiquetas no entra (índice + 2 frases + total ≈ 410 px). Arriba quedan índice, frase izquierda y total; debajo del marco, "Tocá para entrar" a la izquierda y la frase derecha a la derecha.
- Indicación "Hacé clic para entrar": en desktop junto a la esquina inferior derecha del marco (al lado del borde derecho chocaba con la etiqueta derecha).
- Intro: espera fuentes (`document.fonts.load` de las 3 familias), póster (o la foto de la capa de entrada) y `loadeddata` del video, con tope 3,5 s. Motivo: con `preload="metadata"` `canplay` puede no llegar nunca; `loadeddata` ya garantiza el primer frame, que es lo que se ve.
- Hash: `/#clave` → loader → modo abierto directo. Al abrir se escribe `#clave` (`replaceState`); al cerrar se limpia. Motivo: en modo cerrado la URL queda limpia y recargar vuelve a mostrar la intro.
- Abrir en F3 es provisorio (`OpenPlaceholder`): el marco se expande al rectángulo con inset, título + frases + "Vista general" y `Esc`. El navbar sigue sin links (los links en modo abierto llegan en F4 con sus transiciones).
- Video: corre solo con HOME abriendo/abierto (pestaña visible, sin reduced motion); en modo cerrado queda pausado.
- Escenario: `html { overflow: hidden; overscroll-behavior: none }` mientras está montado y `touch-action: pinch-zoom` (sin pan nativo, con zoom). El wrapper del navbar no captura clics salvo en sus botones (el marco llega hasta arriba).
- Velo `noche/25` sobre el media del escenario y `velo` en el placeholder abierto. Motivo: legibilidad de etiquetas y texto sobre fotos claras.
- `Picture` suma `fetchPriority` y `onLoad`: la foto del panel de entrada carga con prioridad alta y el resto con baja, todas `eager` (en capas ocultas `lazy` no cargaba hasta mostrarse).
- `getReducedMotionSnapshot()` para la intro (timeline que se arma una sola vez por montaje).

## F4 — Escenario II: modo abierto, transiciones y HOME (2026-10-21)

- El reducer acepta `STEP`/`GOTO` también en modo abierto (misma cola de 1). `Stage` elige el timeline por modo: corte dentro del marco (cerrado) o el paso de §5 (abierto). Motivo: una sola máquina y un solo input para los dos modos.
- Paso abierto con los tiempos de `motionDuration.stage.openStep` (ya estaban desde F2): textos fuera 0–0,45 s (opacity + y -12, stagger 0,04), marco a inset 0 a los 0,2 s, panel nuevo desde abajo 0,6–1,4 s mientras el actual sube un 30% y baja a `brightness(0.35)`, marco al inset a 1,4 s, textos nuevos a 1,8 s. El input se libera a 2,0 s; los reveals siguen hasta ~2,6 s.
- `textsPanel` (estado de `Stage`) decide qué panel muestra sus textos, y lo cambian los timelines (abrir a 0,55 s, paso a 1,8 s, cerrar después de la salida). Motivo: separa "qué panel está activo" de "cuándo entran sus textos" sin tocar la máquina.
- La salida de textos del panel es un fundido de los `[data-open-text]` (wrappers), no la salida enmascarada de `Reveal`. Motivo: §5 pide "se desvanecen (opacity + y -12px)"; el wrapper se limpia antes de que el panel vuelva a entrar.
- El video corre cuando HOME es el panel que se muestra en modo abierto (`displayIndex`): se pausa apenas arranca la salida de HOME y vuelve a correr al empezar la entrada. Sigue pausado en modo cerrado, con la pestaña oculta y con reduced motion.
- Hash: abrir y cada paso abierto escriben `#clave` (`replaceState`); cerrar lo limpia. Un hash que no es un panel se ignora y se limpia al cargar.
- Navbar: la píldora de links y el botón de la lámina quedan siempre montados y aparecen/desaparecen con fundido (antes se montaban de golpe con `showLinks`). La lámina se cierra sola si los links se ocultan. El wordmark lleva a HOME en los dos modos.
- HOME (§8, ref. 01): un bloque `champan` por línea, del ancho del texto (`whitespace-nowrap`, tamaño fluido 2,25–5,75 rem); subtítulo con `Reveal words`; "Ver la carta" (por ahora abre el estado del botón MENU; el overlay es F9) y "Reservar mesa" (WhatsApp de config); "Conocer la casa" → LA CASA; columna derecha con `CountUp` (cuenta desde 0 al entrar). En vertical, la columna de datos pasa abajo en grilla 2×2.
- Cada panel abierto es un scroller interno (`data-stage-scroller`, `touch-action: pan-y`). En HOME en 390×844 entra sin scroll; en pantallas bajas scrollea y el paso de panel llega recién en el borde.
- Swipe: se decide al apoyar el dedo si el scroller interno podía moverse en esa dirección. Motivo: antes un mismo swipe scrolleaba hasta el borde y además pasaba de panel.
- Velo (`velo`) sobre el media en modo abierto, con fundido al abrir y cerrar.
- `OpenPlaceholder` de F3 se reemplaza por `OpenView`; los 5 paneles que faltan usan un placeholder simple (título + frases + "Este panel se está armando.") hasta F5–F8.
- QA versionada: planes en `qa/plans/*.json` con `expect` (comparación por JSON; el plan falla si difiere) y `pnpm qa:regresion` (`scripts/qa-all.mjs`) los corre todos. Las capturas van a `qa/shots/` (ignorada). Motivo: la regresión de F3 tiene que poder repetirse en cada fase, también por otro agente. Los planes no tienen nada privado.

## F5 — LA CASA (2026-10-21)

- Fondo radial `hoja → monte → noche` colocado dentro del inset del marco abierto (`inset-[clamp(12px,1.6vw,28px)]`) con margen interno `-inset-6` y envuelto en `[data-open-text]` → respeta el borde negro del marco abierto, entra con fundido al activarse `LA CASA` y se desvanece junto con los textos al salir sin tapar la transición de escena entre paneles.
- Lista de los 6 ítems (`copy.laCasa.items`) como `role="tablist"` con `role="tab"` y `aria-selected` → clic inmediato, hover-intent de 200 ms solo con puntero de mouse (`pointerType === 'mouse'`) que se cancela al salir antes de los 200 ms, y navegación por teclado (`ArrowDown`/`ArrowRight`/`ArrowUp`/`ArrowLeft`/`Home`/`End`) que consume el evento (`preventDefault`) cuando el foco está en la lista para no disparar el paso de sección del escenario.
- En mobile/vertical (`< lg` o portrait), los 6 ítems van en grilla 3×2 compacta (`whitespace-nowrap`) arriba del marco inclinado → las 6 opciones, la foto central y las tarjetas derechas entran completas en 390×844 sin scroll vertical ni truncado de etiquetas.
- Foto central fija (`editorial.medios.laCasa` → `r2` en `shape="retrato"`) dentro del marco inclinado (`rotate-(--marco-rotacion)`) con `scale-[1.18]` y parallax leve con `gsap.quickTo` (±11 px X / ±9 px Y sobre puntero mouse, desactivado con reduced motion).
- Columna derecha con dos tarjetas claras `bg-champan` (como ref. 02 y §1): arriba la cita en Caslon cursiva (`Reveal words`), abajo el panel de detalle con título (`font-gigante text-monte`) y descripción (`font-ui text-noche/90`) envueltos cada uno en su `WipeSwap`.

## F6 — PLATOS (2026-10-21)

- Franja superior (~40%) usa directamente la foto de fondo `f8` del escenario (`StageMedia` + `velo` de `OpenView`), sin duplicar un `<Picture>` propio → respeta la continuidad visual al abrir o pasar desde otra sección y evita cargar dos veces la misma imagen.
- Respaldo instantáneo (`FALLBACK_PLATOS`) a partir de `editorial.insignia` mientras `useLocal()` completa su carga inicial (150 ms) → la estructura y las fotos están listas desde el frame 0 sin parpadeo al hidratarse los datos del repositorio.
- Detección de sección activa leyendo `useStage()` (`active && state.mode === 'open' && state.transition === null && paneles[state.activeIndex]?.key === 'platos'`), sin tocar la máquina de estados → el autoplay de 7 s solo corre cuando `PLATOS` está efectivamente abierto y en reposo.
- Anillo de progreso SVG en el botón "Plato siguiente" animado con un tween lineal de GSAP (`0 → 1` en 7 s sobre `strokeDashoffset`) que se pausa/reanuda en el lugar (`tween.paused(isPaused)`) ante hover de mouse (`pointerType === 'mouse'`), foco de teclado dentro de la fila, pestaña oculta (`visibilitychange`) o `useReducedMotion()`, y se reinicia de cero al cambiar de plato (manual o automático).
- En mobile/vertical (`< lg` o portrait), la fila inferior se organiza en grilla de 2 columnas arriba (foto `BlurSwapImage` a la izquierda + panel `monte` de origen a la derecha, `h-36 sm:h-44`) y el panel `tizon` de detalle abajo ocupando las 2 columnas → los tres paneles y la cabecera entran en 390×844 sin scroll vertical ni desborde horizontal.

## F7 — EVENTOS (2026-10-21)

- Se reutilizan las fórmulas, constantes y tipos ya creados en `src/content/eventos.ts` (F1), que coinciden con la tabla de §8 EVENTOS, completando ese mismo módulo con `clampInvitados`, `formatearResultado`, `armarMensajeEvento`, `whatsappEventoUrl` y `mailtoEventoUrl` → toda la lógica de cálculo y armado del resumen de WhatsApp/mail vive en `src/content/eventos.ts` sin duplicar en el componente.
- Selección inicial en `invitados.inicial` (`40`), `ocasiones[0].id` (`'dia-de-la-madre'`) y `formatos[0].id` (`'coctel'`) → al entrar a `EVENTOS` el primer chip de cada grupo está activo, consistente con `LA CASA` y `PLATOS`.
- En la tarjeta de `kg` (`id: 'kg'`), `CountUp` recibe `decimals={1}` con un formateador `maximumFractionDigits: 1, minimumFractionDigits: 0` → cuando el resultado es entero (`18`, `6`, `90`) se muestra sin `,0` y cuando tiene decimal (`24,8`, `4,5`) no se redondea a entero por el `decimals={0}` por defecto de `CountUp`.
- En la tarjeta de `pasos` (`id: 'pasos'`), la etiqueta usa `WipeSwap` (`"bocados"` en `Cóctel` ↔ `"pasos de menú"` en `Mesa servida` y `Asado a la vista`) → cumple la regla de oro de movimiento cuando cambia la unidad del resultado.
- Fondo con veta cálida diagonal (`radial-gradient` mezclando `--color-oro`, `--color-hoja` y `--color-monte` con `color-mix`, sin `--color-vino`) dentro del inset del marco abierto sobre la foto `r3` oscurecida de `StageMedia` → reproduce el brillo cálido de la ref. 04 usando exclusivamente tokens permitidos (§1 reserva `vino` al líquido del `MenuButton`).

## F8 — PREGUNTAS y CONTACTO (2026-10-21)

- En `PREGUNTAS`, el acordeón mantiene montadas las 3 filas de cada página y anima el título de cada fila con `<WipeSwap>` al paginar o filtrar → cumple §8 ("los títulos cambian con `<WipeSwap>`") sin desmontar las filas entre páginas.
- Una sola pregunta abierta a la vez (`openQuestion` por texto de pregunta) con cuerpo medido en un contenedor interno (`innerRef.offsetHeight`) y animado con GSAP (`0 ↔ inner.offsetHeight`, `height: 'auto'` al terminar) + `ResizeObserver` mientras está abierto → nunca hay saltos de altura ni cuando se cargan las zonas de delivery de la pregunta 12 ni al redimensionar la ventana.
- El filtro del buscador (`normalizar` de `src/content/faq.ts`) busca en `pregunta`, `respuesta` y, para la pregunta 12 (`dinamica: 'zonas-delivery'`), también en los nombres de los barrios devueltos por `useLocal()` → buscar un barrio como `"bajo la vina"` encuentra directamente `"¿Hacen delivery?"`.
- Cuando la búsqueda no arroja resultados (`filtradas.length === 0`), la lista y el bloque de `copy.preguntas.sinResultados` se cruzan con fundido GSAP → nunca queda el panel vacío de golpe y al escribir o limpiar la paginación vuelve a `1`.
- `ContactoMapa` se importa con `React.lazy(() => import('./ContactoMapa'))` y solo se monta a partir del momento en que `CONTACTO` está por mostrarse (`active` o `state.activeIndex === 5` / `state.transition?.to === 5` en modo abierto/abriendo) → Leaflet + su CSS salen en un chunk separado (`ContactoMapa-*.js/css`) y no descargan teselas antes de llegar a `CONTACTO`.
- El filtro oscuro (`invert(1) hue-rotate(180deg) grayscale(0.6) brightness(0.85)`) se aplica exclusivamente sobre `.leaflet-tile-pane` con `!bg-tizon` y `[&_.leaflet-tile]:!mix-blend-normal`, y el contenedor del mapa lleva `isolate z-0` → ni el marcador SVG dorado ni la atribución/controles se invierten, las teselas no se mezclan en gris claro (`mix-blend-mode: plus-lighter` por defecto de Leaflet) y los `z-index: 200..600` internos de Leaflet no tapan la tarjeta `champan` (`z-10`).
- Mientras el mapa no fue activado (`interactive === false`), un escudo transparente con `[touch-action:pan-y]` deja pasar la rueda normal y el swipe táctil al escenario (`useStepInput`), y activa el mapa recién al hacer clic/tap (`"Hacé clic para mover el mapa"` / `"Tocá para mover el mapa"`) o con `Ctrl + rueda` (y vuelve a bloquearse al salir de `CONTACTO`).




