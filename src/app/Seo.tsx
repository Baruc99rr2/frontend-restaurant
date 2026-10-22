import { useEffect } from 'react'
import { jsonLdRestaurante } from '@/config/seo'
import { useLocal } from '@/data/useLocal'

/**
 * JSON-LD `Restaurant` en el `<head>`, con los datos del repositorio (nombre, dirección,
 * horario). Mientras carga o si falla, no se escribe nada (nada inventado).
 * Los meta tags y Open Graph ya vienen en index.html desde el build (`vite.config.ts`).
 */
export function Seo() {
  const local = useLocal()
  const datos = local.status === 'ready' ? local.data.local : null

  useEffect(() => {
    if (!datos) return
    let script = document.getElementById('ld-restaurante') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = 'ld-restaurante'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(jsonLdRestaurante(datos))
  }, [datos])

  return null
}
