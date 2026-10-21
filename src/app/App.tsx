import { lazy, Suspense } from 'react'
import Stage from '@/stage/Stage'

// `/` = escenario. Páginas de QA solo en desarrollo (fuera del bundle de producción):
// /dev (primitivas, navbar, botón MENU) · /dev/datos (datos y medios) · /dev/tokens (muestras).
// El router con /carta y /carta/:slug llega en F9–F10.
const DevPage = import.meta.env.DEV ? lazy(() => import('@/app/DevPage')) : null
const DatosPage = import.meta.env.DEV ? lazy(() => import('@/app/DatosPage')) : null
const TokensPage = import.meta.env.DEV ? lazy(() => import('@/app/TokensPage')) : null

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const dev =
    (DevPage && path === '/dev' && <DevPage />) ||
    (DatosPage && path === '/dev/datos' && <DatosPage />) ||
    (TokensPage && path === '/dev/tokens' && <TokensPage />)
  if (dev) return <Suspense fallback={null}>{dev}</Suspense>
  return <Stage />
}
