// Chequeo LOCAL del contrato: los tipos propios (src/data/types.ts) tienen que ser
// idénticos a los generados desde api/openapi.json. Necesita api/ (fuera del repo).
// Uso: `pnpm api:check` (genera los tipos y corre este archivo con tsc).
import type { paths } from '../api/schema'
import type { ApiError, PublicDeliveryZones, PublicLocal, PublicMenu } from '../src/data/types'

type Get<P extends keyof paths> = paths[P] extends { get: infer G } ? G : never
type Ok<P extends keyof paths> = Get<P> extends { responses: { 200: { content: { 'application/json': infer B } } } }
  ? B
  : never
type Err<P extends keyof paths> = Get<P> extends { responses: { '4XX': { content: { 'application/json': infer B } } } }
  ? B
  : never

// Igualdad estricta: falla si sobra, falta o cambia cualquier campo.
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

export type Checks = [
  Assert<Equals<PublicLocal, Ok<'/v1/public/{slug}'>>>,
  Assert<Equals<PublicMenu, Ok<'/v1/public/{slug}/menu'>>>,
  Assert<Equals<PublicDeliveryZones, Ok<'/v1/public/{slug}/delivery-zones'>>>,
  Assert<Equals<ApiError, Err<'/v1/public/{slug}'>>>,
  Assert<Equals<ApiError, Err<'/v1/public/{slug}/menu'>>>,
]
