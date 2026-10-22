// Flip de GSAP aparte de `gsap.ts`: solo lo usa la polaroid, así viaja en el chunk de la
// página de categoría y no en el principal. Importar `Flip` desde acá (queda registrado).

import { gsap } from '@/motion/gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

export { Flip }
