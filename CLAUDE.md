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

## Rutas reales (difieren del ROADMAP)

- Las capturas están en `references/imagenN.png` (no `reference/NN`). `imagenN.png` = ref. N del mapa de §0 (p. ej. `imagen6.png` = ref. 06).
- `content/` (material crudo) y `api/` son solo lectura y se abren recién en F1.

## Comandos

- `pnpm dev` — servidor de desarrollo (http://localhost:5173)
- `pnpm build` — typecheck (`tsc -b`) + build de producción
- `pnpm lint` — ESLint

## Convenciones técnicas

- Alias `@/` → `src/`.
- Colores: solo los tokens de marca (`bg-oro`, `text-champan`, …). Los colores por defecto de Tailwind están desactivados.
  Los valores viven en `src/styles/tokens.css` como `--brand-*` en `:root` (lo que se re-marca por cliente) y se exponen con `@theme inline`.
- Tipografía: `font-gigante` (Archivo ancho 125 / 800), `font-ui` (Archivo ancho 100), `font-serif` (Libre Caslon Text).
  Escala fluida: `text-gigante`, `text-display`, `text-titulo`, `text-subtitulo`, `text-cuerpo`, `text-ui`, `text-etiqueta`.
- Overlay oscuro sobre fotos/video: utilidad `velo`.
- TypeScript fijado en 6.0.x hasta que `typescript-eslint` soporte TS 7.
