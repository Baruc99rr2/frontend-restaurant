import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import App from '@/app/App'
import { applyBrandTheme } from '@/config/site.config'
import { instalarGanchoQa } from '@/motion/qa'

applyBrandTheme()
if (import.meta.env.DEV) instalarGanchoQa()

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root en index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
