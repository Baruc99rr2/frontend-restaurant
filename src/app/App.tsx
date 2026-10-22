import { lazy, Suspense } from 'react'
import { useRuta } from '@/app/router'
import { Seo } from '@/app/Seo'
import { cargarCategoria } from '@/carta/cargas'
import { WipeTransitionProvider } from '@/carta/WipeTransition'
import Stage from '@/stage/Stage'

// Rutas (src/app/router.ts):
// `/` escenario · `/carta` escenario + overlay de la carta (el mismo <Stage>, no se desmonta;
// el overlay va en su chunk) · `/carta/:slug` página de categoría (chunk propio con Lenis y Flip).
const CategoryPage = lazy(() => cargarCategoria().then((m) => ({ default: m.CategoryPage })))
// Páginas de QA solo en desarrollo (fuera del bundle de producción):
// /dev (primitivas, navbar, botón MENU) · /dev/datos (datos y medios) · /dev/tokens (muestras).
const DevPage = import.meta.env.DEV ? lazy(() => import('@/app/DevPage')) : null
const DatosPage = import.meta.env.DEV ? lazy(() => import('@/app/DatosPage')) : null
const TokensPage = import.meta.env.DEV ? lazy(() => import('@/app/TokensPage')) : null

function Rutas() {
  const ruta = useRuta()
  if (ruta.nombre === 'categoria') {
    return (
      <Suspense fallback={<div className="min-h-svh bg-monte" />}>
        <CategoryPage key={ruta.slug} slug={ruta.slug} />
      </Suspense>
    )
  }
  if (ruta.nombre === 'otra') {
    const dev =
      (DevPage && ruta.path === '/dev' && <DevPage />) ||
      (DatosPage && ruta.path === '/dev/datos' && <DatosPage />) ||
      (TokensPage && ruta.path === '/dev/tokens' && <TokensPage />)
    if (dev) return <Suspense fallback={null}>{dev}</Suspense>
  }
  // `/`, `/carta` y cualquier otra ruta: el escenario (misma posición → no se re-monta al abrir la carta).
  return <Stage carta={ruta.nombre === 'carta'} />
}

export default function App() {
  return (
    <WipeTransitionProvider>
      <Seo />
      <Rutas />
    </WipeTransitionProvider>
  )
}
