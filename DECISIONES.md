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

## Regresión estable (2026-10-21) — `test(web): regresion estable`

- Los planes de F3 y F4 ya no esperan con tiempos fijos: cada estado se espera con `__waitUntil` o `__qa.estable()` → la intro tarda entre ~2,5 y ~6 s según la carga (tope de 3,5 s del loader) y los `wait` de 4500 ms fallaban cuando Vite compilaba en frío o la máquina estaba cargada.
- `scripts/qa-browser.mjs` inyecta en cada página `__waitUntil(fn, pred, timeout)`, `__frames(n)` y `__sleep(ms)` (`Page.addScriptToEvaluateOnNewDocument`) → los planes no los redefinen; los de F5–F8 que los definen siguen andando.
- Gancho de QA `window.__qa` (`src/motion/qa.ts`, solo en dev, fuera del build): `reloj(escala)` cambia `gsap.globalTimeline.timeScale`, `estable()` espera modo cerrado/abierto sin bloqueo y `reposo()` además sin animaciones finitas (para capturas) → la app conoce su estado; el script de QA sigue siendo genérico.
- Muestras a mitad de animación (`f3-6` T, `f4-4` 21 y las capturas de pasos): reloj de GSAP 5–50 veces más lento y `__waitUntil` hasta que la animación esté en el tramo buscado (p. ej. opacidad entre 0,1 y 0,9) → la muestra ya no depende de cuánto tarda el protocolo de DevTools. Se enlentece en vez de congelar: con `timeScale(0)` GSAP no aplica los `set()` inmediatos (`_hasNoPausedAncestors`).
- Los chequeos negativos ("↓ en el último no hace nada", "clic fuera no abre") esperan 3 frames y `estable()` → si el input hubiera disparado un paso, el bloqueo ya estaría marcado.
- `useStepInput` sincroniza `enabled`/`onStep` en `useLayoutEffect` (antes `useEffect`) → al entrar por hash el escenario se habilita desde un tick de GSAP (actualización no discreta) y el efecto pasivo podía correr después del primer ↓, que se perdía (falló así una vez `f8-2` en la 3.ª corrida). Es un error de la app, no solo de la prueba.
- Los `__sleep` que quedan en los planes solo marcan el ritmo de los eventos simulados (rueda, notches): el detector de gestos depende de ese ritmo, no de un estado.

## Revisión de F5 a F8 (2026-10-21) — `fix(web): revision de F5 a F8`

Revisado en Chrome headless con `scripts/qa-browser.mjs` (la extensión no sirvió: ver QA al final), desktop 1440×900 y mobile 390×844 táctil, contra las refs. 02, 03, 04, 05 y 10 y §8. Gravedad entre corchetes.

**Transiciones (§5)**
- [alta] LA CASA, EVENTOS, PREGUNTAS y CONTACTO tenían su fondo dentro de `[data-open-text]`: en el paso entre secciones el fondo se desvanecía con los textos y lo que subía o entraba desde abajo era la foto del modo cerrado (que en modo abierto no se ve); el fondo nuevo aparecía recién a 1,8 s con un fundido. HOME y PLATOS (fondo = su media) sí respetaban §5. Unificado: cada sección exporta su fondo (`LaCasaFondo`, `EventosFondo`, `PreguntasFondo`, `ContactoFondo`) y `StageMedia` lo monta en la capa del panel, encima de la foto, junto con el velo. Motivo: la capa es lo que el escenario mueve (sube 30 % oscureciéndose / entra desde abajo), así el fondo hace exactamente el mismo recorrido en las 6 secciones sin tocar los timelines de `Stage.tsx`.
- El velo del modo abierto pasa de `OpenView` a cada capa (debajo del fondo de sección) → si quedaba arriba, oscurecía los fondos; con el fondo arriba del velo los colores son los mismos que antes. Fundido al abrir/cerrar con los mismos tiempos (`stage.open.velo`, demora 0,3 s).
- Los fondos quedan a pantalla completa y los recorta el marco (`clip-path`) → durante el paso, con el marco a inset 0, el fondo llena la pantalla igual que una foto (antes quedaba encerrado en el inset).
- CONTACTO: la sección deja pasar los clics (`FONDO_INTERACTIVO` en `OpenView`) y solo sus bloques los toman → el mapa, ahora debajo, en la capa, sigue respondiendo.

**src/stage**
- Solo habían cambiado las ramas de `OpenView` (verificado con `git diff 9e8b2f9 b2d96a1 -- src/stage`). Cambios de esta revisión en `src/stage`: `StageMedia` (velo + fondos), `OpenView` (sin velo, `FONDO_INTERACTIVO`), `Stage` (pasa `abierto`) y `useStepInput` (`data-stage-gestos-propios`).
- Tokens: sin colores fuera de marca salvo sombras `rgb(0 0 0 / …)` en LA CASA y `rgba(0,0,0,.75)` en el marcador del mapa → [baja] pasadas a `var(--color-noche)` con `color-mix`. `vino` solo aparece en `MenuButton` (y en las páginas de dev). Primitivas: ninguna versión paralela; las secciones usan `Reveal`, `SlideIn`, `WipeSwap`, `BlurSwapImage` y `CountUp`.

**PLATOS**
- [media] `FALLBACK_PLATOS` repetía la unión editorial + repositorio de `platosInsignia` con datos inventados (nombre = título de la sección, categoría "01"). Eliminado: mientras carga la lista está vacía, la foto es la de la franja y los textos entran con su `WipeSwap` al llegar los datos. Motivo: una sola unión (`platosInsignia`) y nada inventado en pantalla.
- [baja] Los puntos eran `role="tab"` sin panel → botones con `aria-current` y área de toque de 24 px (el punto sigue de 8 px).

**CONTACTO**
- [alta] Con el mapa activo, el swipe vertical para moverlo también pasaba de sección (Leaflet no frena la propagación del toque y el `Observer` escucha en `window`). Nuevo atributo `data-stage-gestos-propios`: `useStepInput` ignora rueda y swipe que empiezan ahí; el mapa lo lleva solo mientras está activo.
- [media] `Ctrl + rueda` hacía zoom en el mapa **y** en la página: el `onWheel` de React es pasivo y su `preventDefault` no tiene efecto. Ahora es un listener nativo `{ passive: false }` sobre el escudo.
- [media] Carga diferida: el mapa se montaba recién al ir a CONTACTO, así que el panel entraba sin teselas. Ahora se descarga al acercarse (modo abierto en PREGUNTAS o yendo a CONTACTO), como dice §8 ("al acercarse a la sección"); desde dos secciones o más no se carga. Fundido de teselas de Leaflet activado (antes aparecían de golpe).
- [baja] Atribución: "© OpenStreetMap" → "© colaboradores de OpenStreetMap" (forma pedida por la OSMF); en mobile quedaba pegada al aviso "Tocá para mover el mapa" → va debajo del aviso.
- [baja] El aviso táctil se armaba con `replace('Hacé clic', 'Tocá')` sobre el copy → dos textos en `copy.contacto.moverMapa`. Las redes se anunciaban como "instagram" → nombres en `copy.contacto.redes`.
- Verificado y sin cambios: rueda sin Ctrl sobre el mapa bloqueado pasa de sección y no hace zoom; clic/toque activa; al salir de CONTACTO se vuelve a bloquear; `map.remove()` en el desmontaje (con StrictMode hay un solo `.leaflet-container`); filtro oscuro solo en `.leaflet-tile-pane`; ninguna capa del mapa tapa la tarjeta ni los botones (`elementFromPoint` en el plan).
- [media] La tarjeta tapaba el marcador: el mapa centraba la coordenada en el medio de la pantalla, justo detrás de la tarjeta (en desktop y en mobile). Ahora se encuadra con el marcador en la zona libre (72 % del ancho en horizontal; arriba a la izquierda en vertical) y vuelve a ese encuadre al bloquearse.
- [baja] En la tarjeta, dirección y horarios usaban `text-etiqueta` + `sm:text-ui`: el tamaño cambiaba pero quedaba el `letter-spacing` de etiqueta (0,18 em) y "Martes a jueves" se partía en dos renglones → `tracking-normal` y días sin cortar.

**PREGUNTAS (ref. 10)**
- [baja] Con `justify-between` + `my-auto` quedaba un hueco grande entre la cabecera y el acordeón (la ref. los tiene juntos) → el contenido arranca arriba (`justify-start`, `gap-8`). Arriba y no centrado: al abrir una respuesta la cabecera no se mueve.

**WipeSwap**
- [baja] Al ocultar la capa saliente se vacía (`innerHTML = ''`) → el `textContent` del contenedor es solo el valor actual.

**Accesibilidad**
- [media] EVENTOS: los chips eran `role="radio"` sin teclado de radio; ↑/↓ sobre un chip pasaba de sección (reproducido: ↓ sobre "Día de la Madre" llevaba a PREGUNTAS). Ahora foco itinerante (`tabIndex` 0 solo el elegido) y flechas/Inicio/Fin eligen y mueven el foco sin pasar de sección (`src/components/roving.ts`, compartido con LA CASA).
- [baja] LA CASA: pestañas sin foco itinerante (Tab recorría las 6) → solo la elegida es tabulable.
- [baja] PREGUNTAS: el botón de cada pregunta no apuntaba a su respuesta → `aria-controls` + `role="region"` con `aria-labelledby`; "Q:" oculto para lectores.
- Foco visible: todos los controles de las 4 secciones tienen `focus-visible:outline-oro` (los links de teléfono y mail de la tarjeta usan el contorno del navegador, visible sobre `champan`).

**QA**
- `f8-2-contacto.json` reescrito para la nueva estructura (el mapa se busca en la capa `[data-panel=contacto]`) y con chequeos nuevos: no carga desde dos secciones, se precarga desde PREGUNTAS, entra desde abajo con su panel a mitad del paso, `elementFromPoint` sobre tarjeta/botones/atribución, un solo `.leaflet-container`, Ctrl+rueda con `defaultPrevented`, rueda con el mapa activo, swipe con el mapa activo y bloqueado. `f6-1-platos.json`: los puntos se leen por `aria-current`.
- Los dos errores de CONTACTO (Ctrl+rueda y swipe con el mapa activo) se reprodujeron sobre el código anterior antes de corregirlos.
- La extensión de Chrome conectó pero la ventana estaba tapada y Chrome le daba ~2 frames por segundo (capturas a mitad de animación y un timeout): la revisión visual se hizo con el Chrome headless de `scripts/qa-browser.mjs`.

## F9 — Overlay de la carta (2026-10-21) — `feat(web): overlay de carta`

**Rutas e historial**
- Router propio mínimo (`src/app/router.ts`: `useSyncExternalStore` sobre `pathname` + `popstate`), sin dependencia → son 3 rutas y el escenario ya maneja su hash; una librería no aporta nada.
- `/` y `/carta` renderizan el mismo `<Stage>` en la misma posición → abrir la carta no desmonta el escenario y al cerrar queda exactamente donde estaba (modo, sección, textos, posición del video).
- El estado de la carta **es** la ruta: el botón MENU (`menuOpen = carta`), "Ver la carta", "Ver la carta completa", `Esc`, CERRAR, atrás y adelante pasan todos por la URL → el líquido y MENU ↔ CERRAR no pueden desincronizarse.
- Cerrar = `history.back()` si la entrada `/carta` la creó esta carga (marca `CARGA` en `history.state`); si no (URL directa o recarga), `replaceState('/')` → el historial queda limpio, "adelante" reabre y una recarga en `/carta` no saca al usuario del sitio al cerrar.
- Mientras la ruta es `/carta`, el escenario no escribe su hash (quedaría `/carta#home`); al cerrar lo re-sincroniza. `escribirHash` conserva `history.state`.
- Al abrir se guarda en el historial cómo estaba el escenario (`{ index, abierto }`). Si se vuelve a montar en `/carta` (recarga o atrás desde una categoría) entra directo a ese estado; en modo cerrado, sin el crecimiento del marco (`Intro closedOnEnter`, mismo camino que reduced motion) porque quedaría escondido detrás de la carta y el CERRAR tardaría en aparecer. URL directa sin dato → HOME abierto.
- `/carta/:slug` desmonta el escenario (la página de categoría scrollea; el escenario fija `overflow: hidden` y no tiene sentido mantener video y GSAP vivos detrás). Volver atrás a `/carta` lo vuelve a montar como estaba. F10 puede revisarlo.
- Atajos ignorados mientras hay un `history.back()` pendiente o un barrido en curso → un doble clic rápido en MENU/CERRAR no retrocede dos entradas (podía sacar al usuario del sitio).

**Overlay**
- Vive dentro del escenario (`z-25`), debajo del navbar (`z-30`): el CERRAR es el mismo `MenuButton` del navbar, un solo líquido. Con la carta abierta el navbar oculta wordmark y links con fundido escalonado con el "Hoy: …" (ocupan el mismo lugar).
- Con la carta abierta: `useStepInput({ enabled: false })` (y su `keydown` ya no hace `preventDefault` deshabilitado, así las flechas llegan a los cartelitos), video en pausa (`videoPlaying && !carta`), `inert` en marco, modo cerrado y modo abierto; `Enter` no abre el panel de abajo.
- Diálogo modal (`role="dialog"`, `aria-modal`): foco atrapado entre CERRAR y el overlay (`src/components/focusTrap.ts`, CERRAR primero porque está arriba a la derecha); al abrir el foco va al cartelito actual; al cerrar vuelve a quien abrió ("Ver la carta", "Ver la carta completa", MENU) o al botón.
- Menú del día: `useLocal().data.menu.daily_menu` (el repositorio ya lo trae con `/menu`, un pedido) → primer plato disponible, "Hoy: {nombre} — {precio}" con `Reveal words`; sin plato disponible "Carta de temporada"; mientras carga, nada (no se inventa).
- Cartelitos: categorías de `categoriasCarta()` (repositorio + editorial). Rotación `[-3, 2.5, -1.5, 4, -4, 5]°` y desplazamiento `[1.75, -0.75, 2.25, -1.25, 2.75, -1.5] rem` (la mitad en mobile), fijos por índice. Base fija en CSS `rotate`/`translate` del `li`; la caída la anima GSAP en otra capa; el hover usa `translate` del botón → nadie se pisa el `transform`.
- Cada cartelito es **un solo botón** (frente y dorso adentro); "Ver categoría" es parte del dorso, no un botón aparte → sin botones anidados; el `aria-label` cambia a "Ver categoría {nombre}" cuando está dado vuelta.
- Entrada: los cartelitos caen desde arriba girados (±12–14°) en cascada (`expo.out` 1,1 s, stagger 0,08). Salida: caen hacia abajo (`power2.in` 0,55 s) mientras el líquido baja; el fondo se va después. Interrumpible: las que estaban saliendo vuelven desde donde iban. Si la carta llega con el overlay abierto, caen al llegar.
- Flip `rotationY` 0,8 s `power4.inOut` con `perspective` en el botón; uno solo dado vuelta (estado `volteado`). Reduced motion: fundido de 100 + 100 ms con el cambio de cara en el medio.
- Al terminar de cerrar, la carta vuelve a cero (todos de frente, foco en el primero, carrusel al principio) → reproducido en mobile: si no, al reabrir el carrusel quedaba corrido y un toque podía caer fuera de pantalla.
- Pie: dirección del repositorio + teléfono (config), "Reservar mesa" (WhatsApp), rubro + email (config, con corte después de la @ en mobile). Nombre gigante con `useAjusteAncho` (mide a 100 px y escala al ancho exacto del contenedor; `ResizeObserver` + fuentes) y barrido de entrada desde abajo con máscara (no `Reveal chars`: partir en letras pierde el kerning y cambia el ancho medido). `pb-[0.07em]` para que la máscara no corte la cola de la Q.
- Mobile (< `lg`): carrusel horizontal con `scroll-snap` (`x mandatory`, `snap-center`, padding para centrar el primero y el último), `touch-action: pan-x pan-y`; el overlay entero scrollea en vertical si no entra.
- Error del repositorio: mensaje + "Probar de nuevo" (`retryLocal`). Copy nuevo en `copy.carta` (`titulo`, `listaCategorias`, `irACategoria`, `error`, `reintentar`, `enPreparacion`).

**Barrido**
- `src/carta/WipeTransition.tsx`: `WipeTransitionProvider` (en `App`, por encima de las rutas, así sobrevive al cambio de página) + `useWipeTransition().transicion(cambio)`. La lámina `noche` sube desde abajo (`yPercent 100 → 0`, 0,65 s `power4.inOut`), corre `cambio()` (navegar, volver atrás…), espera 2 frames y sigue subiendo (`0 → -100`). Genérico a propósito: F10 lo usa para entrar, salir y volver al inicio sin tocarlo. Reduced motion: fundido a negro de 200 ms.
- Una transición a la vez (estado de módulo en `src/carta/barrido.ts`); mientras cubre, la lámina toma los clics.
- `/carta/:slug` es un placeholder mínimo (número + nombre con `Reveal`, "Esta página se está armando.", "← Categorías" y "Volver al inicio" ya con el barrido; categoría inexistente → aviso). "← Categorías" vuelve con `history.back()` si se llegó desde la carta.

**Componentes compartidos**
- `roving.ts` reconoce también `[data-roving]` (botones comunes); en los cartelitos las flechas mueven el foco y Enter/clic elige (en pestañas y chips elegir sigue a las flechas).
- `focusTrap.ts` (`tabulables`, `atraparFoco`) y `useAjusteAncho.ts` en `src/components/` → los va a usar la polaroid de F10 y cualquier título gigante.
- `MenuButton` lleva `data-menu-button` y `aria-haspopup="dialog"`; `Navbar` suma `ocultarMarca`.

**QA**
- `qa-browser.mjs`: teclas ←/→/Inicio/Fin, `"shift": true`, pasos `atras`/`adelante` (botones del navegador por el historial de DevTools, no `history.back()` de la página), `click` por `selector`, y en viewport mobile el `click` es un toque (`dispatchMouseEvent` con táctil emulado no volvía nunca; por eso ningún plan mobile hacía clics).
- `window.__qa`: `quieto()`/`estable()` también esperan a la carta y al barrido; `cartaQuieta()`/`cartaEstable()` sirven sin escenario (página de categoría).
- Planes `f9-1-carta.json` (desktop), `f9-2-barrido.json` (barrido, categoría, atrás, recarga), `f9-3-carta-mobile.json` (390×844 táctil), `f9-4-carta-reduced.json`, sin esperas fijas.

## F10 — Página de categoría y polaroid (2026-10-21) — `feat(web): categoria y polaroid`

**Página de categoría (`src/carta/CategoryPage.tsx`)**
- `Lenis` (`lenis` 1.3.27) se instancia solo al montar `CategoryPage` (`autoRaf: true`, `lerp: reduced ? 1 : 0.1`, `smoothWheel: !reduced`) y se destruye en el cleanup (`lenis.destroy()`), cumpliendo §2 y §9 → el escenario y el overlay de la carta nunca tienen `Lenis` vivo. Al cambiar de `:slug` o al entrar se hace `lenis.scrollTo(0, { immediate: true })` + `window.scrollTo(0, 0)`, y mientras la polaroid está abierta se llama `lenis.stop()`.
- Barra superior en píldora fija (`bg-noche/75 border-champan/15 backdrop-blur-md`) con `"← Categorías"`, wordmark en Caslon y `MenuButton` (todos pasan por `useWipeTransition().transicion(...)`). El wordmark lleva también `data-categoria-inicio` (además de `data-categoria-wordmark`) y el botón del pie lleva `data-categoria-pie-inicio data-categoria-inicio` → así tanto el wordmark como el botón del pie llevan a `/#home` con el barrido y `document.querySelector('[data-categoria-inicio]')` sigue visible en el viewport sin scrollear (`f9-2-barrido.json` paso 10).
- Grilla de platos de 2 columnas en desktop (`md:grid-cols-2`) y 1 en mobile: si la categoría tiene varios grupos editoriales (p. ej. `Bodega`: `Tintos`, `Blancos y rosados`, `Tu botella`), cada grupo es un bloque en la grilla de 2 columnas con su subtítulo en cursiva; si tiene un solo grupo sin título (`Entradas`, `Fuegos`, `Pastas`, `Del horno`, `Del mar y la huerta`), sus platos se reparten en 2 columnas equilibradas (`ceil(N / 2)` y resto) en desktop para reproducir la composición en dos columnas de la ref. 11.
- Datos del repositorio sin inventar nada mientras carga: horario semanal con `resumirHorario(local.data.local.weekly)`, precios en centavos con `formatPrecio(plato.price_cents)`, porción (`(500 g)`) solo si existe en `editorial.json`, marcas de alérgenos (`G`, `L`, `H`, `FS`, `M`, `P`, `S`, `V`) en chapitas junto a cada plato que los tenga y leyenda al pie (`[data-leyenda-alergenos]`) con los alérgenos presentes en esa categoría desde `copy.alergenos`.
- Plato sin stock hoy (`available: false`): visible y nunca oculto, atenuado (`opacity-60`), con el precio tachado (`line-through`) y la etiqueta `"No hay hoy"` (`copy.carta.agotadoHoy`) al lado.
- Platos con foto vs. sin foto: si `plato.foto` existe, el nombre se renderiza como `<button data-plato-con-foto>` con subrayado punteado sutil y cursor pointer; si `plato.foto === null`, se renderiza como `<span data-plato-sin-foto>` sin `onClick` ni cursor de link.
- Categoría inexistente o sin platos: muestra `[data-categoria-aviso]` con `copy.carta.noExiste` (sin `<h1>`, preservando el chequeo de `f9-2-barrido.json` paso 13) y agenda un `gsap.delayedCall(reduced ? 0.25 : 0.7, () => void transicion(volverALaCarta))` que vuelve sola a `/carta` con el barrido negro; nunca queda una página rota ni colgada.

**Navegación e historial (`src/app/router.ts`, `src/carta/navegacion.ts`)**
- `navegarACategoria(slug)` guarda en `history.state` el contador `pasos` desde `/carta` (`prev.pasos + 1` si ya estábamos en `/carta/:slug`, o `1` si veníamos de `/carta`) junto con `escenario`.
- `volverALaCarta()` usa `atras(pasos)` (`history.go(-pasos)`) cuando se entró desde `/carta` (así `"← Categorías"` y `"Volver a la carta"` regresan directo al overlay `/carta` aunque el usuario haya recorrido varias categorías con `"Categoría siguiente →"`), y `navegar('/carta', { replace: true })` cuando se entró directo por URL externa, mientras que el botón Atrás del navegador sigue desandando categoría por categoría (`history.back()`).

**Polaroid (`src/carta/Polaroid.tsx`)**
- Usa `bg-champan text-noche` (tokens de marca, sin `#F3EEE2` crudo) con padding superior y laterales de `14px` y pie de `min-h-[56px]` con el nombre del plato en Caslon (`WipeSwap`) y el precio (`WipeSwap`), e imagen cuadrada con `BlurSwapImage` (`shape="retrato"`).
- Apertura y cierre con `Flip` de GSAP (`Flip.fit` + `Flip.getState` + `Flip.from`) sobre `[data-polaroid-flip]` desde/hacia un ancla invisible de `48×60 px` centrada en las coordenadas del clic (`origen.x`, `origen.y`, acotada al viewport).
- Regla "un elemento, un dueño": `[data-polaroid-flip]` pertenece exclusivamente a `Flip` (posición y escala), mientras que la rotación leve fija por plato (`ROTACIONES = [-2.5, 2, -1.5, 3, -2, 2.5]°`) vive en el hijo `[data-polaroid-marco]` mediante la variable CSS `--rot` y `rotate-(--rot)`.
- Navegación con `ArrowLeft` / `ArrowRight` y botones anterior/siguiente que recorren únicamente los platos con foto de esa categoría (con vuelta al llegar al extremo); cierre con `Escape`, botón `✕` y clic en el telón de fondo; foco atrapado con `atraparFoco` (`src/components/focusTrap.ts`) y devuelto a `openerRef.current` (el botón del nombre del plato que la abrió) al terminar de cerrar.

**QA**
- Planes `f10-1-categoria-polaroid.json` (21 chequeos en desktop 1440×900) y `f10-2-categoria-mobile.json` (8 chequeos en mobile 390×844 táctil), escritos exclusivamente con `__waitUntil` y `__qa.cartaEstable()` / `__qa.estable()` (sin esperas fijas).

## Revisión de F10 (2026-10-21) — `fix(web): revision de F10`

Gravedad: **alta** (rompe navegación o datos) · **media** (se ve mal en un caso común) · **menor** · **cosmético**. Cada problema se reprodujo con un plan sobre el código de F10 antes de corregirlo.

**Historial (`volverALaCarta` con `history.go(-pasos)`) — sin problemas**
- Reproducidos en `f10-3-historial.json`: entrada desde otra página (link externo) a `/carta/fuegos`, recarga en una categoría a la que se llegó desde la carta, cadena larga siguiente ×4 + atrás ×2 + adelante + anterior (corta el adelante) + "← Categorías", wordmark → HOME → atrás, MENU de la categoría, y doble clic en "← Categorías" y en CERRAR. Ningún botón interno saca del sitio; "← Categorías" deja el historial limpio (atrás desde `/carta` cae en el escenario, no en la cadena). Se conserva el diseño: `pasos` se lee del `history.state` de la entrada actual en el momento de navegar (con la pantalla ya tapada), así un atrás del navegador a mitad del barrido no lo desfasa; sin carta debajo (`desde` ≠ esta carga) se reemplaza por `/carta`.
- `qa-browser.mjs` suma el paso `{ "reload": true }` (F5 real: conserva historial y `history.state`).

**Problemas encontrados**
- **Media** — Título gigante de la portada desbordado: `text-gigante` (16vw) sacaba "FUEGOS" del margen del contenido (hasta 1420 de 1440 px) y "Del mar y la huerta" caía en 4 líneas (756 px): la portada pasaba la pantalla y el número quedaba pegado a la barra. → `useTopeTitulo` (`src/components/useAjusteAncho.ts`): el tamaño de la clase es el tope y se achica si la palabra más larga no entra o si el texto pasa de 2 líneas (mide con un clon oculto, sirve con `Reveal` partido); el tamaño va en un envoltorio y el `h1` lo hereda (un elemento, un dueño). Mobile ya entraba y sigue igual.
- **Menor** — La leyenda de alérgenos listaba siempre los 8 del catálogo (Bodega, que solo tiene Sulfitos, mostraba Gluten, Pescado…), contra lo que decía F10. → Solo los presentes en la categoría, en el orden de `copy.alergenos`; sin alérgenos, no hay leyenda.
- **Menor** — El contador "1 / 3" de la polaroid cambiaba de golpe (regla de oro: texto que cambia → barrido). → `WipeSwap`.
- **Menor** — El aviso de categoría inexistente duraba 0,7 s (0,25 s con reduced motion) antes de irse: no se alcanzaba a leer. → 1,8 s en los dos casos (es tiempo de lectura, no de movimiento).
- **Cosmético** — Doble línea entre el último plato y la leyenda; el borde del pie era más ancho que el contenido (tomaba el padding). → Una sola línea; el borde va en un bloque interno.
- **Menor, no corregido** — Atrás del navegador con la polaroid abierta sale de la categoría en vez de cerrar la foto (la polaroid no tiene URL; ✕, `Esc` y clic afuera sí cierran). Darle URL o entrada de historial a la foto es una decisión de producto → pendiente.
- **Cosmético, se corrige en F11** — Tamaños tipográficos sueltos fuera de la escala (`text-[0.625rem]`, `text-[0.95rem]`…) en la página de categoría y la polaroid.
- **Documentación** — ESTADO decía cuerpo `noche` (es `monte`) y `copy.carta.agotadoHoy` (es `sinStock`); DECISIONES de F10 en párrafos en vez de una línea por decisión. Corregido en ESTADO.

**Verificado sin cambios**
- Lenis solo en la categoría (se destruye al salir), en pausa con la polaroid: la rueda y el swipe sobre el fondo no mueven la página; al cerrar, el foco vuelve al plato y el scroll queda donde estaba.
- Sin stock (atenuado, precio tachado, "No hay hoy"), platos sin foto sin cursor ni clic, categoría inexistente con aviso, desktop 1440 y mobile 390 sin desborde, contra la ref. 11 (dos columnas, nombre + horario arriba, porción entre paréntesis).
- Reglas aprendidas: colores solo tokens (sombra con `var(--color-noche)`), transform con un dueño (Flip en `[data-polaroid-flip]`, rotación en `[data-polaroid-marco]`), estado de listeners en `useLayoutEffect`, navegación por ruta, copy desde `copy.es.ts`, planes sin `wait`. F10 solo tocó archivos de su alcance (`src/carta/`, `router.ts`, `package.json`, planes, docs).
- Plan nuevo `f10-4-revision.json` (títulos, leyenda, contador, línea).

## F11 — Pulido: rendimiento, accesibilidad, SEO, white-label (2026-10-21) — `chore(web): pulido y documentacion white-label`

**Bundle (chunk principal 540 kB → 148 kB, sin el aviso de 500 kB)**
- Miniaturas borrosas fuera del principal: `pnpm media` escribe `media.generated.ts` (rutas y medidas; `placeholder` pasa a ser una clave `f1/paisaje`) y `media.placeholders.generated.ts` (data URIs) → el chunk de miniaturas se pide al arrancar (`cargarPlaceholders()` en `main.tsx`) y `usePlaceholder(clave)` (`src/content/placeholders.ts`) lo resuelve cuando llega; mientras, se ve el fondo del contenedor.
- Por ruta: overlay de la carta y página de categoría en chunks propios (`src/carta/cargas.ts`); la categoría lleva Lenis y Flip. El barrido espera el chunk con la pantalla tapada (nunca descubre una página vacía) y cada uno precarga al otro en un rato libre.
- Flip fuera de `gsap.ts` (`src/motion/flip.ts`, solo la polaroid). React y GSAP en chunks propios (`codeSplitting.groups` de rolldown) → caché entre versiones; Flip excluido del grupo de GSAP.
- `/dev` ya estaba fuera del build (`import.meta.env.DEV`).

**Lighthouse móvil (simulado, `pnpm preview` local): de 49 a 92 en el inicio**
- Lo que pesaba: React montaba los 6 paneles del modo abierto aunque no se ven (tarea larga de ~850 ms con CPU ×4), reflows forzados por frame en el marco, 4 saltos de layout en paneles ocultos al llegar los datos, y el LCP atado al final de la intro.
- Paneles del modo abierto: el activo se monta al toque (también por hash); el resto de a uno por rato libre después de la intro (`OpenView` + `cuandoEsteLibre`, `src/app/libre.ts`). Montado no se desmonta (conserva su estado).
- Paneles inactivos con `content-visibility: hidden` → no se maquetan: CLS 0,15 → 0 y menos estilo/layout. Es seguro: el escenario desvanece los textos del panel saliente antes de cambiar `textsPanel`, y los inactivos ya son `inert` + `aria-hidden`.
- `frameController` cachea viewport y ángulo (se miden en `attach`/`relayout`), en vez de leer `clientWidth` y el estilo en cada `onUpdate` (forzaba un reflow por frame). `ClosedView` ajusta los títulos en tres pasadas (escribir, medir, escribir).
- Loader de la intro ya en `index.html` (`src/config/loaderEstatico.ts`, mismas clases que `Intro.tsx`) y el primer render de React después del primer pintado (`requestAnimationFrame` + `setTimeout`) → se pinta antes de que corra el JS.
- La intro ya no espera el primer cuadro del video (el póster lo cubre) y el video va con `preload="none"` hasta que tiene que correr → póster, fuentes y JS no compiten con 2,3 MB de video.
- Precargas: fuentes de la intro (nombres con hash, desde el bundle) en el `<head>`; el póster de HOME (solo en `/`) y, en `/carta/:slug`, la portada de esa categoría + su chunk, desde el script del loader (la ruta solo se sabe en el navegador).
- La carta se monta al terminar la intro (en reposo) y `StageMedia` pide primero las fotos del panel actual y sus vecinos (precarga del panel siguiente); el resto en reposo, antes de que el navbar pueda saltar lejos.
- PLATOS reserva alto en mobile (`min-h-56`) para que no salte al llegar los datos.
- La portada de la categoría sale de `editorial.json` por slug (`portadaDeSlug`) y se ve sin esperar al repositorio (es el LCP); número y título entran con su `Reveal` cuando llegan los datos.

**Accesibilidad**
- Anuncio `aria-live` del panel movido de `ClosedView` (oculto en modo abierto) a `Stage` → se anuncian también los pasos abiertos.
- Números laterales: el nombre accesible empieza con el número visible (`"01: ir a HOME"`); botón de mail de EVENTOS sin `aria-label` (texto visible + `sr-only`).
- Plato sin stock atenuado con color (`ceniza`, 5,2:1 sobre `monte`) en vez de `opacity: 0.6` (dejaba descripción y precio por debajo de 4,5:1).
- Token tipográfico `text-micro` (0,625 rem) para chapitas; la categoría y la polaroid ya no usan tamaños sueltos.

**SEO**
- `site.config.ts → seo` (dominio, título, descripción, cocina, rango de precios). El build escribe `<title>`, description, Open Graph y Twitter en `index.html` (plugin en `vite.config.ts`, `src/config/seo.ts`); la foto de Open Graph es `medios.openGraph` de editorial.
- JSON-LD `Restaurant` armado en el navegador (`src/app/Seo.tsx`) con nombre, dirección y horario del repositorio + contacto/coordenadas/redes de config → sigue valiendo con el backend real en F12; mientras carga o si falla, no se escribe nada.
- `public/robots.txt` (Lighthouse lo pedía: el fallback devolvía el HTML).
- `vite.config.ts` importa con extensión y atributo JSON (`with { type: 'json' }`) → sin el aviso del cargador nativo de Vite; `tsconfig.node.json` suma `DOM`, `resolveJsonModule` y el alias.

**Despliegue**
- Fallback de SPA para `/carta` y `/carta/:slug`: `vercel.json` y `public/_redirects` (Netlify y Cloudflare Pages); nginx, Apache y otros en el README. Solo esas rutas: el resto que no existe da 404 del hosting.

**QA**
- Plan `f11-1-pulido.json` (head, JSON-LD, aria-live en modo abierto, content-visibility, carta en reposo, miniaturas, reduced motion en categoría y polaroid).
- Ajustes por el montaje diferido: `f6-1` cambia sus dos `{ "wait": 2600 }` por esperar el panel activo; el `__waitUntil` propio de `f7-1` y `f8-1` tolera que el panel todavía no esté; `f9-2` paso 10 acepta la carta sin montar; `f10-1` mide el color del precio sin stock en vez de la opacidad.

## v1.0.1 — Medios al repo (2026-10-21) — `chore(web): versionar medios`

- `public/media/` sale del `.gitignore` y se versiona (14 MB, 188 archivos) → proyecto personal que se publica en Vercel desde GitHub; un clon limpio hace `pnpm install && pnpm build` con fotos y video (verificado: las 186 rutas de `media.generated.ts` existen en `dist/`). Para un cliente, los medios se reemplazan por los suyos.

## v1.0.1 — Responsividad de 240 a 2560 (2026-10-21) — `fix(web): responsividad de 240 a 2560`

**Criterios y variantes**
- Áreas de toque: 44 px con puntero táctil (`pointer: coarse`), sin cambios con mouse (ahí el mínimo es 24 px, WCAG 2.5.8 AA) → agrandar todo para el mouse cambiaba el diseño de escritorio sin necesidad. Utilidades `area-tactil` (min 44×44 táctil) y `toque-linea` (link de texto suelto: padding + margen negativo, 24/44 px sin mover lo de alrededor), variante `tactil:` (`src/styles/tokens.css`).
- Variantes por tamaño en `tokens.css`: `angosto:` (< 360 px: 240–320), `minimo:` (≤ 260 px, solo 240) y `bajo:` (≤ 480 px de alto: celular acostado y 240×320) → media queries con nombre en un solo lugar, en vez de valores sueltos en cada componente.
- Links dentro de un párrafo (bajada de PREGUNTAS) quedan como están → excepción de WCAG para links en línea.

**Escenario**
- Modo cerrado vertical: el marco se dimensiona dentro de la banda libre entre la fila de arriba y el título (`filasVertical` en `geometry.ts`, compartida con `ClosedView`); donde hay lugar queda igual que antes (54 % del alto, centro al 47 %). Antes el alto era fijo y en 240–320 px el marco se pisaba con etiquetas, indicación y título.
- Vertical bajo (< 480 px de alto): sin frases laterales (no entran con el marco); angosto (< 340 px): la frase derecha va debajo de "Tocá para entrar" (en la misma fila se pisaban).
- Tope del título gigante en vertical: `min(24vw, 12vh)` → en pantallas bajas el título no se come el marco.
- Números laterales: slot de 3,4 em táctil (44 px) y 1,75 em con mouse (antes 1,5 em = 20 px); el número sigue alineado con la etiqueta (margen negativo). Desplegada en pantallas bajas, la lista se corre lo justo para entrar en la pantalla. La lista lleva `data-desplegable`: sus números ocultos se alcanzan con foco/hover/toque.
- Navbar en < 360 px: wordmark en `text-ui` (`text-etiqueta` y una línea en 240), MENU compacto, menos margen → antes MENU quedaba afuera de la pantalla en 240, 280 y 320. Lámina con alto máximo y scroll interno (`data-stage-scroller`).

**Secciones**
- HOME: bloques gigantes con tope `(100vw − 2rem) / 9,8` → "FUEGO LENTO," entra entero desde 240 (antes se cortaba).
- LA CASA: pestañas en 2 columnas en 240 (en 3 se cortaban "Huerta" y "Familia"); desde 280 siguen en 3.
- PLATOS: puntos de 24 px con mouse / 44 táctil (antes 16×24); menos padding en angosto para que los 5 entren en una fila desde 280 (en 240 bajan a una segunda fila).
- EVENTOS: stepper de 44 px táctil y fila que baja si no entra (en 240 el "+" quedaba recortado); chips y botones de 44 px.
- PREGUNTAS: el buscador ocupa todo el alto de la píldora (era de 17 px).
- CONTACTO: redes con `flex-wrap` (en 240 WhatsApp quedaba afuera); en vertical el contenido arranca más abajo (`pt-48`) para no tapar la atribución de OSM; tipografía de la tarjeta pasada a la escala (`text-ui`, `text-etiqueta`) → pendiente de F10/F11.

**Carta, categoría y polaroid**
- Cartelitos con ancho limitado por el alto (`(100svh − 9,5rem) × 0,75`) y menos padding en pantallas bajas → en 667×375 un cartelito medía más que la pantalla.
- Pie de la carta en una columna en angosto (el email se salía en 240, 280 y 320).
- EVENTOS en 240: tarjetas en una columna ("$ 22.000" no entraba en media tarjeta).
- Barra de la categoría: debajo de 384 px se oculta el wordmark (no entran los tres y MENU quedaba afuera en 360; "Volver al inicio" sigue en el pie).
- Horario de la categoría: cada franja no se parte (`whitespace-nowrap`) y baja entera si no entra.
- Polaroid: ancho limitado por el alto; en pantallas bajas, controles al costado en columna y nombre/precio apilados → en 667×375 los controles quedaban debajo de la pantalla.
- Tamaños sueltos pasados a la escala: títulos de EVENTOS, PLATOS y PREGUNTAS → `text-titulo`; cifras de EVENTOS → `text-titulo`/`text-subtitulo`; nombre de los cartelitos → `text-subtitulo`.

**QA**
- `__auditar(opts)` en `qa-browser.mjs`: scroll horizontal (`scrollWidth` vs `innerWidth`), interactivos fuera del viewport o recortados (teniendo en cuenta scrollers y `fixed`), tapados (salvo que el scroller los pueda sacar de abajo), áreas táctiles, texto cortado (mirando el 60 % central de la caja del texto, por el interlineado ajustado de los títulos) y letra ≥ 10 px.
- `qa/plans/responsive.json` generado por `scripts/qa-responsive.mjs` (14 tamaños × intro, cerrado, 6 secciones, lámina, carta frente y dorso, categoría, pie, polaroid); capturas en `qa/shots/responsive/`. Táctil hasta 1024 (1024×768 = tablet acostada), mouse desde 1280.
- `f3-4-abrir-cerrar.json`: el número 05 desplegado pasa de y=516 a y=531 (el slot de los números creció de 1,5 a 1,75 em con mouse).
- `qa-browser.mjs`: al volver de un viewport táctil a escritorio apaga la emulación táctil del mouse (el clic quedaba colgado).
