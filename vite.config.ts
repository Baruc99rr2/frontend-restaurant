import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loaderEstatico } from './src/config/loaderEstatico.ts'
import { etiquetasHead, precargasHead } from './src/config/seo.ts'

/** Fuentes que espera la intro (Archivo ancho, Caslon 400): se precargan en el build. */
const FUENTES_INTRO = /(archivo-latin-wdth-normal|libre-caslon-text-latin-400-normal)-[\w-]+\.woff2$/

/**
 * index.html desde site.config.ts: title, description y Open Graph, las precargas del póster
 * de HOME y de las fuentes de la intro (con el nombre con hash del build) y el loader estático.
 */
const indexHtml = (): Plugin => ({
  name: 'quebracho-index-html',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      const salida = Object.values(ctx.bundle ?? {})
      const fuentes = salida.map((s) => s.fileName).filter((f) => FUENTES_INTRO.test(f))
      // Chunk de la página de categoría y sus imports: el loader los precarga en `/carta/:slug`.
      const categoria = salida.find((s) => s.type === 'chunk' && s.facadeModuleId?.endsWith('/carta/CategoryPage.tsx'))
      const jsCategoria = categoria?.type === 'chunk' ? [categoria.fileName, ...categoria.imports] : []
      return html
        .replace(/<!-- seo:.*?-->/, `${etiquetasHead()}\n    ${precargasHead(fuentes)}`)
        .replace(/<!-- loader:.*?-->/, loaderEstatico(jsCategoria))
    },
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), indexHtml()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // React y GSAP en chunks propios: cambian poco entre versiones del sitio (caché del
        // navegador) y el chunk de la app queda chico. Las rutas pesadas ya son import().
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            // Flip queda afuera: viaja con la página de categoría (src/motion/flip.ts).
            { name: 'gsap', test: /node_modules[\\/](gsap|@gsap)[\\/](?!Flip)/ },
          ],
        },
      },
    },
  },
})
