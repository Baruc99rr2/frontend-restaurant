# ROADMAP — Frontend genérico de restaurante (template vendible)

Carpeta de trabajo: `D:\WebsSkyTech\trabajos\frontend` (repo git propio, hermano de `proyecto-ia` y `proyecto-ia-panel`, **no** dentro de `proyecto-ia`).
Repo remoto **público**: https://github.com/Baruc99rr2/frontend-restaurant. Nada privado del backend entra al repo (ni el contrato `api/openapi.json`, ni tokens, ni URLs internas).
Ejecutor: Claude Code. Planificación y revisión: chat de Claude.
Backend: no se conecta todavía, pero los datos locales imitan desde el día uno la forma exacta del endpoint público del backend (sub-fase 6.8), así conectar es cambiar una implementación (ver §4).

Qué es y qué no es: esta es la **web pública** de un restaurante (lo que ve el comensal). No es el panel del dueño, que va en `proyecto-ia-panel`. Comparten stack y forma de consumir la API, nada más.

---

## 0. Reglas de trabajo para Claude Code

- Una sub-fase por sesión, un commit por sub-fase. Trabajo autónomo dentro de la sub-fase, sin pedir aprobación a mitad. Al terminar: actualizar `ESTADO.md` y reportar (qué se hizo, decisiones tomadas, pendientes, capturas si se pudo).
- Leer solo los archivos indicados en cada sub-fase + `CLAUDE.md` + `ESTADO.md`.
- Windows/PowerShell: todo script va a un archivo (`scripts/*.mjs`), nunca inline ni en heredoc.
- Paquetes con `pnpm`. Repo independiente: no leer ni tocar nada de `proyecto-ia` .
- Plata en **centavos enteros** y horarios en **UTC**, convertidos a `America/Argentina/Jujuy` solo al mostrarlos (mismas reglas que el backend).
- Las imágenes de `references/` se miran con la herramienta de visión cuando la sub-fase lo indique. Son referencia de layout y movimiento, no de colores.
- Decisiones nuevas → `DECISIONES.md` (una línea por decisión + motivo).

### Mapa de referencias (`references/`)

Los archivos se llaman `imagenN.png`, con N = número de la tabla (ref. 06 = `references/imagen6.png`). La carpeta está fuera del repo (`.gitignore`).

| Archivo | Uso |
|---|---|
| 01 | Hero en modo abierto (layout final de HOME) |
| 02 | Sección LA CASA (lista con íconos / imagen central / título+texto) |
| 03 | Sección PLATOS (carrusel: solo botones, progreso y puntos) |
| 04 | Sección EVENTOS (calculadora con steppers y tarjetas de resultado) |
| 05 | Sección CONTACTO (tarjeta de datos + redes; la foto se reemplaza por mapa) |
| 06 | Modo cerrado: marco inclinado, título gigante, etiquetas laterales, botón MENU |
| 07 | Scroll en modo cerrado (cambio de panel dentro del marco) |
| 08–09 | Overlay de la carta (cartelitos desalineados, flip, nombre gigante abajo) |
| 10 | Sección PREGUNTAS (buscador, acordeón, paginación) |
| 11 | Página de categoría de la carta (portada + lista con precio y descripción) |
| 12–14 | Intro: loader → imagen chica → crece hasta el marco |

---

## 1. Concepto y marca (demo)

**Restaurante ficticio: QUEBRACHO — cocina de fuego y bodega.** El quebracho es la leña dura del asado argentino: negro como el carbón, dorado como la brasa, verde como el monte. El nombre, los datos y la paleta salen de `site.config.ts`, así el template se re-marca por cliente sin tocar componentes.

**Motivo visual único:** el *marco inclinado* (cuadrilátero rotado ~-16° de la ref. 06). Es el elemento memorable y se repite con intención: marco del modo cerrado, imagen central de LA CASA, cartelitos de la carta y polaroids de platos. Todo lo demás es sobrio.

**Regla de oro de movimiento:** ningún cambio de estado es brusco. Texto que cambia → barrido (sale enmascarado, entra enmascarado). Imagen que cambia → desenfoque + leve zoom → cambio → enfoque. Nada aparece/desaparece sin transición.

### Tokens de color

| Token | Hex | Uso |
|---|---|---|
| `noche` | `#000000` | Fondo del escenario y marcos |
| `tizon` | `#14120F` | Superficies oscuras, paneles |
| `oro` | `#B8914A` | Botón MENU, precios, acentos, líneas activas |
| `champan` | `#E6D7A8` | Títulos gigantes, bloques del hero, tarjetas claras |
| `monte` | `#13261C` | Verde oscuro: fondos de sección, números de la calculadora |
| `hoja` | `#2B4A38` | Verde secundario: hovers, gradientes |
| `vino` | `#5E1222` (+ `#7A1C2C`) | Solo el líquido del botón MENU |
| `ceniza` | `#9A9384` | Texto secundario |

Overlay oscuro sobre video/fotos: `rgba(0,0,0,.55)` + viñeta radial. Valores en `src/styles/tokens.css` como variables CSS mapeadas en Tailwind v4 (`@theme`).

### Tipografía

- **Archivo** (variable, eje `wdth`): ancho 125 + peso 800 para títulos gigantes (HOME, nombre del restaurante en la carta); ancho 100 para navegación, UI y cuerpo.
- **Libre Caslon Text**: wordmark de dos líneas (como ref. 06), nombres de origen en PLATOS, citas, nombre del plato en la polaroid.
- Autohospedadas con `@fontsource-variable/archivo` y `@fontsource/libre-caslon-text`. Escala tipográfica fluida con `clamp()` en tokens. Títulos gigantes ajustados al ancho con medición en JS (resize observer), no a ojo.

---

## 2. Stack

- Vite + React 19 + TypeScript strict.
- Tailwind CSS v4.
- GSAP 3 (gratis completo, incluye plugins) + `@gsap/react` (`useGSAP`). Plugins: `SplitText` (reveals por letra/palabra/línea), `Observer` (wheel/touch/teclado unificados para el paso entre secciones), `Flip` (polaroid y cartelitos), `CustomEase`.
- Lenis: solo en la página de categoría (scroll nativo suavizado). El escenario principal no usa scroll nativo.
- React Router (modo librería): `/` (escenario), `/carta` (overlay), `/carta/:slug` (categoría). Atrás del navegador funciona siempre.
- Leaflet + teselas OpenStreetMap con filtro CSS oscuro y marcador dorado propio. Sin cuentas ni API keys. Atribución OSM visible (obligatoria).
- `lucide-react` para íconos de UI; íconos de redes como SVG inline propios (`src/components/icons/social.tsx`).
- Assets: `sharp` (imágenes) + `ffmpeg-static` (video, sin instalar ffmpeg en Windows).

---

## 3. Estructura de carpetas

```
frontend/
  api/                       ← openapi.json del backend + tipos generados. LOCAL, fuera del repo a propósito: nunca se sube
  mocks/                     ← public-local.json (forma exacta del endpoint público)
  references/                ← capturas imagen1..imagen14.png, solo lectura, fuera del repo
  content/                   ← material crudo del usuario, solo lectura, fuera del repo
  public/media/              ← salida generada por scripts (no editar a mano); versionada desde v1.0.1
  scripts/
    process-images.mjs
    process-video.mjs
  src/
    app/          App.tsx, router.tsx, providers
    config/       site.config.ts   (marca, contacto, coordenadas, horarios, redes, textos de botones)
    content/      copy.es.ts, editorial.json, faq.ts, eventos.ts, media.generated.ts
    data/         PublicLocalRepository.ts (interfaz), MockPublicRepository.ts, useLocal.ts
    motion/       gsap.ts (registro de plugins), tokens.ts (duraciones/easings), primitives/
    stage/        StageProvider.tsx (máquina de estados), Frame.tsx (clip-path),
                  ClosedView.tsx, OpenView.tsx, useStepInput.ts, Intro.tsx
    sections/     Home/, LaCasa/, Platos/, Eventos/, Preguntas/, Contacto/
    carta/        CartaOverlay.tsx, CartaCard.tsx, CategoryPage.tsx, Polaroid.tsx, WipeTransition.tsx
    components/   Navbar.tsx, MenuButton.tsx, icons/
    styles/       tokens.css, globals.css
  CLAUDE.md  ROADMAP.md  ESTADO.md  DECISIONES.md
```

---

## 4. Capa de datos (calcada del backend)

El backend ya expone, sin login, la **API pública del local** (sub-fase 6.8). En el contrato real son tres endpoints que se usan acá: `GET /v1/public/{slug}` (datos, horario, abierto/cerrado, promociones), `GET /v1/public/{slug}/menu` (carta, menú del día, si la cocina toma pedidos) y `GET /v1/public/{slug}/delivery-zones`; `/services` es para el rubro salón y no se usa. El mock guarda las tres respuestas, una clave por endpoint. Entre los tres traen: nombre, dirección, horario semanal, días distintos (feriados, cierres), si está abierto ahora y cuándo abre, la carta por categorías con precio, alérgenos y **stock de hoy**, el **menú del día**, las zonas de delivery y si la cocina está tomando pedidos. No trae datos personales.

Los datos se parten en dos orígenes, y esa frontera es la que hace vendible el template:

| Origen | Qué trae | Hoy | Después |
|---|---|---|---|
| **Operativo** (backend) | nombre, dirección, teléfono, horarios, abierto/cerrado, categorías, platos, precios, alérgenos, stock, menú del día, zonas, cocina tomando pedidos | `mocks/public-local.json` con la forma exacta del endpoint | `ApiPublicRepository` contra el endpoint |
| **Editorial** (este repo) | fotos, textos de LA CASA, platos insignia, eventos, FAQ, redes, coordenadas del mapa, colores, tipografías | `site.config.ts`, `copy.es.ts`, `editorial.json` | queda igual: es lo que se diseña por cliente |

- **Contrato:** vive en `api/openapi.json`, una copia local del backend que está **fuera del repo a propósito** (es local y nunca se sube). Los tipos propios (`src/data/types.ts`, versionados) siguen la forma del endpoint público; `pnpm api:types` genera los tipos reales desde ese archivo dentro de `api/`, y un chequeo local verifica que los propios coincidan. Sin `api/` el proyecto compila igual. En F12 se escribe el mapper API → tipos propios (si hace falta). Los componentes no cambian.
- **Unión por id:** `editorial.json` asocia fotos y textos extra a categorías y platos por su id del backend (`{ dishId → mediaId, categoryId → coverMediaId, origen, región }`). Un plato sin entrada editorial se muestra igual, sin foto; un plato nuevo cargado por el dueño aparece solo.
- **Interfaz única:** `PublicLocalRepository` con `getLocal()`, `getCarta()`, `getMenuDelDia()`, `getZonasDelivery()`. Hoy `MockPublicRepository`; después `ApiPublicRepository`. Los componentes solo conocen la interfaz y un hook `useLocal()` que hace **un solo pedido por carga** y lo cachea (la API tiene límite de pedidos por minuto).
- Campos que probablemente no estén en el backend (porción o gramos, fotos, origen del plato) van a `editorial.json`, no al mock operativo.
- Precios: centavos → `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`. Horarios: UTC → `America/Argentina/Jujuy`.
- Para conectar de verdad hará falta cargar el dominio de la web en la variable de CORS del backend; se anota en el README, no se toca ahora.

---

## 5. Arquitectura del escenario (lo más importante)

El sitio principal es un **escenario a pantalla completa** (100svh, sin scroll nativo) con 6 paneles y dos modos.

| # | Clave / hash | Título modo cerrado | Navbar | Media modo cerrado |
|---|---|---|---|---|
| 00 | `home` | HOME | Home | Video (pausado, primer frame) |
| 01 | `la-casa` | LA CASA | Sobre nosotros | Restaurante 2 |
| 02 | `platos` | PLATOS | (sin link, se llega por scroll) | Comida destacada |
| 03 | `eventos` | EVENTOS | Nuestros servicios | Restaurante 3 |
| 04 | `preguntas` | PREGUNTAS | Preguntas frecuentes | Restaurante 4 |
| 05 | `contacto` | CONTACTO | Contacto | Restaurante 5 |

### Máquina de estados (`StageProvider`)

`loading → intro → closed ⇄ opening/closing → open`, más `transitioning` (bloquea input). Estado: `{ mode, activeIndex, lock }`. Un solo `useReducer`; las animaciones son timelines GSAP disparados por cambios de estado y que al terminar despachan el evento siguiente. Cola de 1 input como máximo (si el usuario scrollea durante una transición, se encola un paso, no más).

### Input (`useStepInput`)

`Observer` de GSAP: wheel (umbral acumulado ~50, ignorar inercia del trackpad durante el lock), swipe táctil > 50px, `↓/↑`, `PageDown/PageUp`, `Espacio`. Paneles con contenido más alto que la pantalla (mobile, FAQ abierto) tienen un scroller interno: el paso de sección solo se dispara cuando ese scroller llegó al borde.

### Frame (`Frame.tsx`)

Contenedor del media a pantalla completa recortado con `clip-path: polygon()` de 4 puntos. Los puntos se calculan en JS según viewport:

- **cerrado:** cuadrilátero rotado ~-16° centrado (proporciones aprox. ref. 06: 34vw × 72vh en desktop; más alto y angosto en mobile). Variación sutil de ±2° por panel.
- **abierto:** rectángulo con inset `clamp(12px, 1.6vw, 28px)` (el "marco" de la ref. 01, en negro).
- **sin marco:** inset 0 (durante transiciones abiertas).

GSAP interpola los 8 números y escribe el `clip-path` en `onUpdate`. El media no se escala para abrir: se revela. Recalcular en resize sin animar.

### Intro (ref. 12–14)

1. Fondo negro, loader: logo chico con anillo de progreso dorado. Espera poster del video + fuentes + `canplay` (tope 3,5 s).
2. El marco aparece a escala 0.25 en el centro y crece hasta la forma cerrada (media con leve zoom 1.15 → 1).
3. "HOME" sube letra por letra desde una máscara inferior; etiquetas laterales ruedan hacia adentro; wordmark y botón MENU aparecen con fade.
4. Indicación discreta junto al marco: "Hacé clic para entrar" / "Tocá para entrar" (según puntero).

Si la URL trae hash (`/#eventos`), intro corta y se entra directo en modo abierto en ese panel.

### Modo cerrado (ref. 06–07)

- Solo wordmark (arriba izq.) y botón MENU (arriba der.). Sin navbar de links.
- Título gigante abajo, superpuesto al borde inferior del marco, color `champan`.
- Etiquetas laterales: izq. `índice` + frase de 2 líneas; der. frase de 2 líneas + total. Ruedan verticalmente al cambiar (texto apilado con `overflow:hidden`).
- Paso entre paneles (ref. 07): dentro del mismo marco, el media actual sube y el siguiente entra desde abajo (corte horizontal en pantalla, no rotado); el título sale hacia abajo letra por letra y entra el nuevo; etiquetas ruedan. ~1,1 s.
- Clic/tap en el marco o `Enter` → abrir ese panel. Clic en los números laterales → ir a ese panel.

### Abrir / cerrar

- **Abrir:** el polígono se expande hacia los lados hasta el rectángulo con inset; video empieza a reproducirse (si es HOME); título gigante y etiquetas salen con fade; entran navbar y textos del panel con sus reveals (§6). ~1,4 s.
- **Cerrar (volver a vista general):** botón "Vista general" (abajo a la derecha, ícono de marco) y tecla `Esc`. Proceso inverso; el video se pausa.

### Paso entre secciones en modo abierto

Timeline (duraciones en `motion/tokens.ts`, ajustables):

1. 0–0,45 s: todos los textos del panel actual se desvanecen (opacity + y -12px, stagger corto). Navbar y botón MENU no se tocan.
2. 0,2–0,7 s: el marco va a inset 0.
3. 0,6–1,4 s: el panel siguiente entra desde abajo (yPercent 100 → 0) mientras el actual se va a -30% oscureciéndose.
4. 1,4–1,9 s: el marco vuelve a su inset.
5. 1,8–2,6 s: los textos del nuevo panel aparecen con sus reveals.

Input se libera a ~2,0 s. Los links del navbar usan la misma transición hacia cualquier índice (salto directo, sin pasar por los intermedios). El hash se actualiza (`history.replaceState`) en cada cambio.

### Video

`muted playsinline loop preload="metadata"` con poster. Fuente 720p en pantallas < 1024px. Se pausa cuando HOME no está activo o la pestaña está oculta. Con `prefers-reduced-motion`: queda el poster, sin autoplay.

---

## 6. Primitivas de movimiento (`motion/primitives`)

- `<Reveal mode="chars|words|lines">`: SplitText con máscara; entrada desde abajo. Para títulos y frases.
- `<SlideIn from="left|right">`: bloques que entran desde fuera de pantalla y se acomodan (bloques del hero).
- `<WipeSwap value>`: cuando cambia `value`, el texto actual sale con barrido (clip-path inset de izquierda a derecha) y el nuevo entra con barrido. Se usa en LA CASA, PLATOS, EVENTOS, botón MENU/CERRAR.
- `<BlurSwapImage src>`: blur 0 → 14px + scale 1 → 1.08 (sin salir del contenedor), cambio de src precargado, vuelta a blur 0 / scale 1.
- `<CountUp value>`: números que cambian con tween.
- Hook `useReducedMotion`: todas las primitivas degradan a fades cortos de 200 ms.

Easings base: `expo.out` para entradas, `power4.inOut` para transiciones de escena, `power2.out` para UI.

---

## 7. Navbar y botón MENU

- **Navbar** (solo modo abierto y página de categoría): transparente. Izq.: wordmark Caslon de dos líneas. Centro: píldora de vidrio (fondo `rgba(255,255,255,.08)` + `backdrop-blur`) con Home, Sobre nosotros, Nuestros servicios, Preguntas frecuentes, Contacto; barra dorada sobre el ítem activo que se desliza entre ítems (ref. 02–05). Mobile: wordmark + ícono de links (abre una lámina simple con los 5 links) + MENU.
- **Botón MENU**: píldora `oro`, bordes totalmente redondeados, texto `noche`. Hover: el vino asoma ~15% con ola. Clic: el líquido sube hasta llenar (~0,9 s) con dos ondas SVG desfasadas en `vino` y `#7A1C2C` que se desplazan horizontalmente; el texto pasa a `champan` y cambia a "CERRAR" con `WipeSwap`; se abre el overlay de la carta. Al cerrar, el líquido baja. Siempre visible arriba a la derecha (también en modo cerrado).

---

## 8. Contenido de cada panel en modo abierto

> El copy de abajo es el definitivo salvo los platos: Claude Code **debe mirar las 10 fotos de comida** y nombrar/describir los platos según lo que muestren, manteniendo el concepto (cocina de fuego argentina) y el tono. Si las fotos no encajan con el concepto, adaptar categorías y reportarlo.

Tono: rioplatense, frases cortas, concretas, sin adjetivos de relleno.

### 00 HOME (ref. 01)

- Bloques `champan` con texto `noche`, entrando con `SlideIn` desde la izquierda: **FUEGO LENTO,** / **MESA LARGA.**
- Subtítulo (`Reveal words`): "Cocina a la brasa de quebracho, pastas amasadas cada mañana y una bodega de 140 etiquetas argentinas."
- Botones píldora: "Ver la carta" (abre overlay) y "Reservar mesa" (WhatsApp desde config; la IA del backend toma pedidos, no reservas de mesa).
- Abajo izq.: círculo con flecha + "Conocer la casa" (va a 01).
- Columna der. (lugar de los logos de la ref.): bloque "Desde 2011" y cuatro datos: "140 etiquetas en bodega", "12 h de brasa en el asado", "38 cubiertos", "4,8 en reseñas". Placeholder, marcado en config.

### 01 LA CASA — Sobre nosotros (ref. 02)

- Fondo: gradiente radial `hoja` → `monte` → `noche`.
- Izq.: lista con ícono + nombre; el activo con fondo `champan` (como la ref.). Clic o hover-intent (200 ms) cambia el activo.
- Centro: foto Restaurante 2 en el **marco inclinado** (motivo de marca), parallax leve con el mouse. Fija.
- Der.: cita arriba "Cocinar es saber esperar." y panel con título + texto que cambian con `WipeSwap`.

| Ícono (lucide) | Ítem | Título | Texto |
|---|---|---|---|
| Flame | Fuego | El fuego manda | Leña de quebracho y paciencia. El asado de tira pasa doce horas entre brasas antes de llegar a la mesa. |
| Wheat | Masa | Amasado del día | Las pastas se estiran cada mañana con harina de molino de piedra y huevos de granja. |
| Sprout | Huerta | Lo que da la estación | Compramos a tres productores del cinturón verde. Cuando cambia la tierra, cambia la carta. |
| Wine | Bodega | Bodega de autor | 140 etiquetas de bodegas chicas, de la Quebrada a la Patagonia. Pedí que te recomendemos una. |
| UtensilsCrossed | Mesa | Mesa larga | Un salón de 38 cubiertos pensado para quedarse. Acá la sobremesa no tiene apuro. |
| Users | Familia | Tres generaciones | Empezó la abuela Teresa con un horno de barro en el patio. Hoy la cocina la llevan sus nietos. |

### 02 PLATOS — los de siempre (ref. 03)

- Franja superior (~40%): foto oscurecida con título "Los que nunca salen de la carta" y link "Ver la carta completa" (abre overlay).
- Fila inferior de tres paneles:
  - Izq.: marco con borde blanco 1px y la foto del plato (`BlurSwapImage`).
  - Centro: panel `monte` con el nombre de origen del plato en Caslon grande + región chica (ej.: "Al asador" / "Pampa húmeda"; "Mar del Plata" para sorrentinos; "Noroeste" para locro). `WipeSwap`.
  - Der.: panel `tizon`. Arriba los puntos/guía del carrusel (activo `oro`, ancho mayor). Descripción en cursiva, nombre del plato en `oro`, categoría. Botones circulares atrás/adelante; el de adelante tiene anillo de progreso (7 s) que al completarse avanza.
- Pausa del autoplay: hover/focus en la fila, sección no activa, pestaña oculta, reduced motion.
- 5 platos, elegidos en `editorial.json` por id de plato (precio y stock desde el repositorio).

### 03 EVENTOS — Nuestros servicios (ref. 04)

Calculadora de catering que habla del restaurante.

- Fondo: foto Restaurante 3 oscurecida con veta cálida.
- Título: "Armá tu evento y te decimos cuánto fuego hace falta."
- Izq., controles estilo ref. (etiqueta en píldora `champan` + stepper oscuro):
  - Invitados: 10–200, paso 5, inicial 40.
  - Ocasión (chips): Día de la Madre, Día del Padre, Navidad, Año Nuevo, Cumpleaños, Empresa.
  - Formato (chips): Cóctel, Mesa servida, Asado a la vista.
- Der., 6 tarjetas `champan` con número en `monte` (`CountUp`) y etiqueta de área chica (`WipeSwap` si cambia):

| Área | Resultado | Fórmula (en `eventos.ts`, editable) |
|---|---|---|
| Cocina | kg a la brasa | invitados × (asado 0,45 / mesa 0,30 / cóctel 0,15) |
| Bodega | botellas sugeridas | ⌈invitados / 2,5⌉ × (Navidad/Año Nuevo 1,2) |
| Salón | mozos asignados | ⌈invitados / 12⌉ (cóctel ⌈/15⌉) |
| Cocina | pasos de menú | cóctel 8 bocados / mesa 4 pasos / asado 5 |
| Equipo | horas de servicio | 4 (Año Nuevo 6, Empresa 3) |
| Presupuesto | desde $ por persona | base por formato × multiplicador por ocasión (placeholder) |

- Nota chica: "Valores orientativos. Te confirmamos el presupuesto en el día."
- Botón "Pedir presupuesto": abre WhatsApp (`wa.me`) con el resumen de la selección ya escrito; alternativa `mailto:`.

### 04 PREGUNTAS (ref. 10)

- Fondo: diagonales `monte` → `noche`.
- Título: "Lo que más nos preguntan." Bajada: "Si no está acá, escribinos por mail, llamanos o mandanos un WhatsApp." (links reales desde config).
- Buscador en píldora (filtra pregunta + respuesta, sin acentos, con `WipeSwap` en la lista).
- Acordeón: una abierta a la vez, chevron que rota, altura animada. 3 por página, paginación "1 / 4" con botones circulares.

1. **¿Hace falta reservar?** De jueves a sábado, sí. El resto de la semana guardamos mesas para quien llega sin reserva.
2. **¿Cómo reservo?** Por WhatsApp o desde el botón "Reservar mesa". Para pedir comida, llamá: te atendemos aunque el salón esté lleno.
3. **¿Tienen opciones vegetarianas o sin TACC?** Sí, están marcadas en la carta. La cocina es compartida: avisanos cualquier alergia al reservar.
4. **¿Puedo traer mi vino?** Sí. Cobramos descorche por botella y te la servimos a la temperatura justa.
5. **¿Hay estacionamiento?** Tenemos convenio con la playa de la esquina.
6. **¿Aceptan mascotas?** En las mesas de la vereda, siempre.
7. **¿Hacen eventos privados?** Sí: el salón completo hasta 38 personas o el sector del fondo hasta 16.
8. **¿Con cuánta anticipación pido catering?** Diez días. Para Navidad y Año Nuevo, tres semanas.
9. **¿El catering incluye personal?** Sí: mozos, vajilla y parrillero según el formato que elijas.
10. **¿Qué medios de pago aceptan?** Efectivo, débito, crédito, transferencia y QR.
11. **¿Tienen menú para chicos?** Sí, media porción de cualquier plato principal.
12. **¿Hacen delivery?** Sí, a los barrios de la lista. El envío y el pedido mínimo dependen de la zona. (La lista sale de las zonas del backend, no se escribe a mano.)

### 05 CONTACTO (ref. 05)

- Arriba izq.: etiqueta en Caslon cursiva "Te esperamos. Desde 2011."
- Tarjeta `champan`: QUEBRACHO cocina de fuego y bodega; dirección; teléfono ("Pedidos por teléfono"); email; horario semanal y próximo día distinto (feriado/cierre) **desde el endpoint**; estado en vivo: "Abierto ahora, cierra a las 00:30" / "Cerrado, abre mañana a las 12". Si la cocina no toma pedidos: "La cocina vuelve a tomar pedidos a las 20".
- Derecha (donde estaba la foto): **mapa Leaflet** ocupando todo el fondo, teselas OSM con filtro `invert(1) hue-rotate(180deg) grayscale(.6) brightness(.85)`, marcador SVG dorado con forma del marco inclinado, zoom con rueda deshabilitado (no debe robar el input del escenario; se habilita con clic/Ctrl). Carga diferida al acercarse a la sección. Botón "Cómo llegar" → URL de Google Maps con las coordenadas. Atribución OSM visible.
- Abajo izq.: redes en círculos (Instagram, Facebook, TikTok, YouTube, WhatsApp) y "Volver al inicio" (flecha arriba → panel 00).
- Coordenadas de ejemplo en config: San Salvador de Jujuy (placeholder, editable). La dirección escrita sale del endpoint; las coordenadas no existen en el backend y viven en `site.config.ts`.

---

## 9. Carta

### Overlay `/carta` (ref. 08–09)

- Se abre desde MENU, "Ver la carta" y "Ver la carta completa". Fondo `tizon`.
- Arriba izq.: si hay menú del día, "Hoy: {nombre} — {precio}" con barrido de entrada (sale de `getMenuDelDia()`); si no, "Carta de temporada". Arriba der.: el botón MENU ya convertido en CERRAR.
- 6 cartelitos con rotación (-4° a 5°) y desplazamiento vertical distintos (fijos por índice, no aleatorios en cada render). Frente: número + nombre de categoría. Entrada: caen en cascada con rotación.
- **1er clic** en un cartelito: flip `rotateY(180deg)` (0,8 s, `perspective`) mostrando la foto de portada con el nombre y un botón "Ver categoría". Si había otro dado vuelta, vuelve a su frente.
- **2do clic** (o el botón): barrido negro de abajo hacia arriba que cubre la pantalla → navega a `/carta/:slug` → el barrido sigue subiendo y descubre la página.
- Abajo: dirección + teléfono (izq.), "Reservar mesa" (centro), "Restaurante y bodega" + email (der.). Debajo, **QUEBRACHO** gigante en Archivo ancho 125 / 800, ajustado al ancho exacto.
- Mobile: cartelitos en carrusel horizontal con snap; mismo flip.
- `Esc` o CERRAR: los cartelitos se van, el líquido del botón baja, vuelve al estado anterior.

Categorías sugeridas (ajustar a las fotos): 00 Entradas, 01 Fuegos, 02 Pastas, 03 Del horno, 04 Postres, 05 Bodega. Portadas: una foto de comida distinta por categoría; si Bodega no tiene foto adecuada, usar una del restaurante.

### Página de categoría `/carta/:slug` (ref. 11)

- Fondo `monte`, texto `champan`, precios `oro`, separadores 1px `hoja`.
- Barra superior: píldora centrada estilo ref. 11 con "← Categorías" (reabre el overlay), wordmark (→ Inicio, panel 00 abierto) y el botón MENU.
- Portada: foto de la categoría a lo ancho (~60vh, oscurecida) con número y nombre gigantes.
- Debajo: nombre de categoría + horario a la derecha; grupos en dos columnas (una en mobile). Cada ítem: NOMBRE (porción, si existe) …… precio, descripción en `ceniza`, alérgenos del backend como marcas chicas con leyenda al pie. Plato **sin stock hoy**: atenuado, precio tachado suave y "No hay hoy"; sigue visible (no se oculta). Si la categoría no existe en el backend o quedó vacía, volver a la carta con aviso.
- **Polaroid**: clic en el nombre de un plato con foto → fondo oscurecido con blur; la foto aparece creciendo desde el punto del clic (Flip) dentro de un marco blanco cálido `#F3EEE2` (14px de lados, 56px abajo con el nombre del plato en Caslon y el precio), rotación leve fija por plato. Flechas ← → para recorrer los platos con foto de esa categoría, cerrar con ✕, clic afuera o `Esc`. Los nombres sin foto no son clickeables (sin cursor de link).
- Pie: "← Categoría anterior" / "Categoría siguiente →" grandes, más "Volver a la carta" y "Volver al inicio".
- Scroll con Lenis. Al volver al inicio, transición con el mismo barrido negro.

Cada categoría: 4–7 platos en el mock, precios de ejemplo en centavos, al menos un plato sin stock y un menú del día cargado, para que esos estados se diseñen desde ya. Si el backend no tiene grupos dentro de una categoría, los grupos salen de `editorial.json` o no se usan.

---

## 10. Pipeline de assets

Entrada esperada en `content/`: 1 video (~30 s, 1920×1080, ~6 MB), 5 fotos de restaurante, 10 fotos de comida de tamaños variados. Si faltan o sobran archivos, reportar y seguir con lo que haya.

**`scripts/process-images.mjs`** (sharp, recorte por `attention`):
- Restaurante → 16:9 en 1920×1080 y 1280×720.
- Comida → 4:5 en 900×1125 y 600×750 (cartelitos, polaroid, carrusel) y apaisado 1920×800 (portadas de categoría).
- Formatos AVIF + WebP. Placeholder borroso de 16px en base64 para carga progresiva.
- Genera `src/content/media.generated.ts` con id (`r1..r5`, `f1..f10`), variantes, dimensiones y placeholder. Nombres de salida estables.

**`scripts/process-video.mjs`** (ffmpeg-static):
- `hero-1080.mp4`: H.264, CRF 24, `yuv420p`, `+faststart`, sin audio.
- `hero-720.mp4`: CRF 26.
- `hero-poster` (primer frame) en AVIF/WebP vía sharp.
- Reportar pesos finales.

Ambos scripts idempotentes, en `package.json` como `pnpm media`.

---

## 11. Sub-fases

Cada sub-fase: leer `CLAUDE.md`, `ESTADO.md`, la sección indicada de este ROADMAP y las referencias listadas.

### F0 — Andamiaje y documentación
- Leer: §0, §1, §2, §3.
- Hacer: Vite + React + TS strict + Tailwind v4 + ESLint + alias `@/`. Tokens de color y tipografía, fuentes autohospedadas. Crear `CLAUDE.md` (reglas §0 + regla de oro de movimiento), copiar este archivo como `ROADMAP.md`, crear `ESTADO.md` y `DECISIONES.md`. Página de prueba con muestras de tokens. `git init` propio.
- Listo cuando: `pnpm dev` y `pnpm build` sin errores; tokens visibles.
- Commit: `feat(web): andamiaje y tokens`

### F1 — Assets, contrato y contenido
- Leer: §4, §8, §9 (solo datos), §10. Mirar todo `content/`.
- Hacer: scripts de §10; tipos propios en `src/data/types.ts`; `PublicLocalRepository` + `MockPublicRepository`; `mocks/public-local.json` con esos tipos (platos nombrados según las fotos); `editorial.json`, `site.config.ts`, `copy.es.ts`, `faq.ts`, `eventos.ts`. Documentar en `DECISIONES.md` la asignación foto → uso y qué campos quedaron en editorial.
- Listo cuando: `pnpm media` genera todo; el mock compila contra los tipos; reporte con tabla foto → uso.
- Commit: `feat(web): medios, contrato y contenido`

### F2 — Primitivas de movimiento, Navbar y botón MENU
- Leer: §6, §7. Mirar refs 01, 02, 06.
- Hacer: registro de plugins GSAP, tokens de movimiento, las 6 primitivas, `useReducedMotion`, Navbar (con barra activa deslizante) y MenuButton con líquido. Página de pruebas `/dev` (solo en desarrollo) para ver cada primitiva.
- Listo cuando: todas las primitivas funcionan en `/dev`, con y sin reduced motion; el líquido sube y baja sin saltos.
- Commit: `feat(web): primitivas de movimiento, navbar y botón menu`

### F3 — Escenario I: intro y modo cerrado
- Leer: §5 (Máquina, Input, Frame, Intro, Modo cerrado, Video). Mirar refs 06, 07, 12, 13, 14.
- Hacer: `StageProvider`, `useStepInput`, `Frame`, `Intro`, `ClosedView` con los 6 paneles (media + título + etiquetas), clic para abrir (por ahora abre un placeholder).
- Listo cuando: intro completa; paso entre paneles cerrado con wheel, touch y teclado sin saltos ni dobles pasos con trackpad; resize no rompe el polígono.
- Commit: `feat(web): escenario, intro y modo cerrado`

### F4 — Escenario II: modo abierto, transiciones y HOME
- Leer: §5 (Abrir/cerrar, Paso en modo abierto, Video), §8 HOME. Mirar refs 01, 06.
- Hacer: `OpenView`, apertura/cierre del marco, paso entre secciones abiertas, saltos desde navbar, hash en URL, botón "Vista general" + `Esc`, panel HOME completo. Los otros 5 paneles con placeholder simple.
- Listo cuando: el ciclo cerrado → abierto → recorrer → cerrar es fluido; links del navbar saltan bien; `/#eventos` entra directo; el video solo corre en HOME.
- Commit: `feat(web): modo abierto y home`

### F5 — LA CASA
- Leer: §8 LA CASA. Mirar ref 02.
- Listo cuando: cambio de ítem con `WipeSwap` sin cortes aunque se cambie rápido (interrumpir y retomar bien); navegable con teclado.
- Commit: `feat(web): seccion la casa`

### F6 — PLATOS
- Leer: §8 PLATOS. Mirar ref 03.
- Listo cuando: anillo de progreso, autoplay con pausas, `BlurSwapImage` dentro del marco sin desbordar, atrás/adelante y puntos sincronizados.
- Commit: `feat(web): seccion platos`

### F7 — EVENTOS
- Leer: §8 EVENTOS. Mirar ref 04.
- Listo cuando: fórmulas en `eventos.ts`, `CountUp` en cada cambio, mensaje de WhatsApp correcto (URL-encoded), entra en 100svh en desktop.
- Commit: `feat(web): seccion eventos`

### F8 — PREGUNTAS y CONTACTO
- Leer: §8 PREGUNTAS y CONTACTO. Mirar refs 05, 10.
- Listo cuando: búsqueda + paginación + acordeón suaves; mapa carga diferido, oscuro, sin capturar la rueda, con atribución; "Volver al inicio" funciona.
- Commit: `feat(web): preguntas y contacto con mapa`

### F9 — Overlay de la carta
- Leer: §9 Overlay. Mirar refs 08, 09.
- Listo cuando: flip, un solo cartelito dado vuelta, barrido de entrada a categoría, nombre gigante ajustado, `Esc` y atrás del navegador cierran.
- Commit: `feat(web): overlay de carta`

### F10 — Página de categoría y polaroid
- Leer: §9 Página de categoría. Mirar ref 11.
- Listo cuando: navegación completa (categorías / inicio / anterior / siguiente / atrás del navegador), polaroid con Flip desde el clic y recorrido con flechas, Lenis solo acá.
- Commit: `feat(web): categoria y polaroid`

### F11 — Pulido: mobile, accesibilidad, rendimiento, SEO, white-label
- Leer: §12.
- Hacer: pasada completa en 375 / 768 / 1280 / 1920; foco visible; trampas de foco en overlay y polaroid; `aria-live` en cambios de panel; reduced motion revisado; precarga de medias del panel siguiente; meta tags + Open Graph + JSON-LD `Restaurant` desde config; `README.md` "Cómo adaptar a un cliente" (qué archivos tocar).
- Listo cuando: Lighthouse móvil ≥ 85 performance y ≥ 95 accesibilidad; sin errores de consola; build final.
- Commit: `chore(web): pulido y documentacion white-label`

### F12 — Conexión al backend (no ejecutar todavía)
- Se planifica cuando haya un local real. Tipos con `openapi-typescript` desde `api/openapi.json` (local, actualizado desde `/docs/json` del backend; nunca se sube), mapper a los tipos propios, `ApiPublicRepository`, URL por variable de entorno, dominio cargado en CORS del backend, estados de carga y error con el estilo del sitio, y prueba contra `restaurante-demo`.

---

## 12. Criterios globales de terminado

- Ninguna transición brusca: todo cambio visible tiene animación (≥ 200 ms; 200 ms fade si reduced motion).
- Ninguna animación se rompe si se interrumpe (timelines que se matan y recrean, no se apilan).
- Siempre hay salida clara: desde cualquier pantalla se llega a Inicio, a la carta y a la lista de categorías en 1–2 clics; el atrás del navegador hace lo esperable.
- Teclado completo; `Esc` cierra lo último abierto.
- Mobile real (touch, `svh`, safe areas), no solo desktop achicado.
- Sin dependencias con cuenta o API key.
- Todo dato del restaurante sale del repositorio (operativo) o de `site.config.ts` / `editorial.json` (editorial); cero textos de marca hardcodeados en componentes.
- Precios y horarios nunca escritos a mano en editorial: si existen en el backend, salen de ahí.

---

## 13. Prompt de arranque para cada sesión de Claude Code

```
Trabajamos en D:\WebsSkyTech\trabajos\frontend.
Leé CLAUDE.md, ESTADO.md y del ROADMAP.md solo la sub-fase F<N> y las secciones que esa sub-fase indica.
Mirá las referencias listadas en esa sub-fase.
Ejecutá F<N> completa de forma autónoma, sin pedir aprobación a mitad.
Al terminar: un commit con el mensaje indicado, actualizá ESTADO.md y DECISIONES.md, y reportame qué hiciste, qué decidiste y qué quedó pendiente.
```
