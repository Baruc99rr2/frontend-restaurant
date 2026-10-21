import type { DeliveryZone, MenuItem, PublicLocal, PublicMenu } from './types'

/**
 * Única puerta a los datos operativos del local. Los componentes solo conocen
 * esta interfaz (vía `useLocal()`); hoy la implementa MockPublicRepository y
 * en F12 ApiPublicRepository, sin tocar componentes.
 *
 * Mapa a la API pública del backend:
 *   getLocal()          → GET /v1/public/{slug}
 *   getCarta()          → GET /v1/public/{slug}/menu
 *   getMenuDelDia()     → GET /v1/public/{slug}/menu (campo daily_menu; mismo pedido que getCarta)
 *   getZonasDelivery()  → GET /v1/public/{slug}/delivery-zones
 *
 * Errores: se rechaza con `PublicRepositoryError` (código estable del backend).
 */
export interface PublicLocalRepository {
  getLocal(): Promise<PublicLocal>
  getCarta(): Promise<PublicMenu>
  getMenuDelDia(): Promise<MenuItem[]>
  getZonasDelivery(): Promise<DeliveryZone[]>
}

export class PublicRepositoryError extends Error {
  readonly code: string
  readonly status: number | null

  constructor(code: string, message: string, status: number | null = null) {
    super(message)
    this.name = 'PublicRepositoryError'
    this.code = code
    this.status = status
  }
}
