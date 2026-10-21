import { lazy, Suspense } from 'react'
import TokensPage from '@/app/TokensPage'

// Páginas de QA hasta que llegue el router con el escenario (F3+).
// /dev/datos solo existe en desarrollo.
const DatosPage = import.meta.env.DEV ? lazy(() => import('@/app/DatosPage')) : null

export default function App() {
  if (DatosPage && window.location.pathname === '/dev/datos') {
    return (
      <Suspense fallback={null}>
        <DatosPage />
      </Suspense>
    )
  }
  return <TokensPage />
}
