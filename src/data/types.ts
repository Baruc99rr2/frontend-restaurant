// Tipos propios con la forma EXACTA de los endpoints públicos del backend.
// `pnpm api:check` verifica que sigan siendo idénticos a los generados desde
// api/openapi.json (local, fuera del repo). Si el backend cambia, falla ahí.
//
// Convenciones del backend:
// - Plata en centavos enteros (`*_cents`).
// - Instantes (`open_until`, `next_opening`, `until`, `resumes_at`) en ISO 8601 UTC;
//   se muestran convertidos a la zona del local (`time_zone`).
// - Horario semanal y días distintos (`opens_at`, `closes_at`) en "HH:MM" de hora local.
// - Fechas (`date`) en AAAA-MM-DD de la zona del local.

/** GET /v1/public/{slug} — encabezado y pie: datos, horario y si está abierto. */
export type PublicLocal = {
  slug: string
  name: string
  /** Decide qué más tiene la web: `/services` (salon) o `/menu` (restaurant). */
  vertical: 'salon' | 'restaurant'
  /** null: el local todavía no la cargó. */
  address: string | null
  time_zone: string
  open_now: boolean
  /** Abierto: hasta cuándo (ISO UTC). */
  open_until: string | null
  /** Cerrado: cuándo abre (ISO UTC). null si está abierto o no abre en los próximos 8 días. */
  next_opening: string | null
  /** Horario de siempre, por día (0 = domingo) y franja. */
  weekly: WeeklySlot[]
  /** Feriados y días con otro horario, de hoy a 60 días. Sin el motivo. */
  special_days: SpecialDay[]
  /** Las vigentes hoy. */
  promotions: Promotion[]
}

export type WeeklySlot = {
  weekday: number
  opens_at: string
  closes_at: string
  closes_next_day: boolean
}

export type SpecialDay = {
  date: string
  closed: boolean
  opens_at: string | null
  closes_at: string | null
}

export type Promotion = {
  title: string
  body: string | null
}

/** GET /v1/public/{slug}/menu — carta, menú del día y si la cocina toma pedidos. */
export type PublicMenu = {
  /** Hoy, en la zona del local. */
  date: string
  /** En el orden del local. */
  categories: MenuCategory[]
  /** Ítems sin categoría (la IA los ofrece aparte). */
  uncategorized: MenuItem[]
  /** Solo el de hoy. */
  daily_menu: MenuItem[]
  orders: OrderIntake
}

export type MenuCategory = {
  id: string
  name: string
  items: MenuItem[]
}

export type MenuItem = {
  id: string
  name: string
  description: string | null
  /** En centavos. */
  price_cents: number
  /** false: sin stock hoy. Se muestra atenuado, no se saca. */
  available: boolean
  /** Texto libre del local (p. ej. "gluten"). */
  allergens: string[]
}

export type OrderIntake = {
  taking_orders: boolean
  until: string | null
  /** Sin tomar: cuándo vuelve. null si la cocina está en pausa. */
  resumes_at: string | null
}

/** GET /v1/public/{slug}/delivery-zones — las activas, por nombre. */
export type PublicDeliveryZones = {
  items: DeliveryZone[]
}

export type DeliveryZone = {
  name: string
  fee_cents: number
  min_order_cents: number
  eta_minutes: number | null
}

/** Cuerpo de error 4XX / 5XX. `code` es estable; `message` no es contrato. */
export type ApiError = {
  error: {
    code: string
    message: string
    details?: { [key: string]: unknown }
  }
}

/** Todo lo público de un local, como lo guarda el mock: una clave por endpoint. */
export type PublicLocalData = {
  local: PublicLocal
  menu: PublicMenu
  delivery_zones: PublicDeliveryZones
}
