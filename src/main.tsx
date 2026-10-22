import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import App from '@/app/App'
import { applyBrandTheme } from '@/config/site.config'
import { cargarPlaceholders } from '@/content/placeholders'
import { instalarGanchoQa } from '@/motion/qa'

applyBrandTheme()
// Miniaturas borrosas en un chunk aparte: se piden ya, en paralelo con el primer render.
void cargarPlaceholders()
if (import.meta.env.DEV) instalarGanchoQa()

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root en index.html')

// Primero se pinta el loader estático de index.html (src/config/loaderEstatico.ts); el primer
// render de React va en la tarea siguiente, así no lo demora.
requestAnimationFrame(() => {
  setTimeout(() => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }, 0)
})
