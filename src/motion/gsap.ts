// Registro centralizado de plugins de GSAP.
// Importar `gsap`, `useGSAP` y los plugins desde acá garantiza que estén registrados.

import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { SplitText } from 'gsap/SplitText'
import { Observer } from 'gsap/Observer'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(useGSAP, SplitText, Observer, Flip, CustomEase)

export { gsap, useGSAP, SplitText, Observer, Flip, CustomEase }
