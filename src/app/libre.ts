/**
 * Corre `fn` cuando el navegador está libre (`requestIdleCallback`, con tope `timeout`);
 * donde no existe (Safari), con un `setTimeout` corto. Devuelve la cancelación.
 */
export function cuandoEsteLibre(fn: () => void, timeout = 1500): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout })
    return () => window.cancelIdleCallback(id)
  }
  const t = setTimeout(fn, 200)
  return () => clearTimeout(t)
}
