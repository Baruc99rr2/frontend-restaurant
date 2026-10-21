import { lazy, Suspense } from 'react'
import TokensPage from '@/app/TokensPage'

// Páginas de QA hasta que llegue el router con el escenario (F3+).
// /dev y /dev/datos solo existen en desarrollo.
const DevPage = import.meta.env.DEV ? lazy(() => import('@/app/DevPage')) : null
const DatosPage = import.meta.env.DEV ? lazy(() => import('@/app/DatosPage')) : null

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (DevPage && path === '/dev') {
    return (
      <Suspense fallback={null}>
        <DevPage />
      </Suspense>
    )
  }
  if (DatosPage && path === '/dev/datos') {
    return (
      <Suspense fallback={null}>
        <DatosPage />
      </Suspense>
    )
  }
  return <TokensPage />
}
