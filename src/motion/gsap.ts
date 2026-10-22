// Registro centralizado de plugins de GSAP.
// Importar `gsap`, `useGSAP` y los plugins desde acá garantiza que estén registrados.

import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { SplitText } from 'gsap/SplitText'
import { Observer } from 'gsap/Observer'
import { CustomEase } from 'gsap/CustomEase'

// Flip va aparte (`@/motion/flip`): solo lo usa la polaroid, en el chunk de la categoría.
gsap.registerPlugin(useGSAP, SplitText, Observer, CustomEase)

export { gsap, useGSAP, SplitText, Observer, CustomEase }
