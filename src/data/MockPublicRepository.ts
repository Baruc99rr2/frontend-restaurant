import mockJson from '../../mocks/public-local.json'
import { PublicRepositoryError, type PublicLocalRepository } from './PublicLocalRepository'
import type { DeliveryZone, MenuItem, PublicLocal, PublicLocalData, PublicMenu } from './types'

// Un JSON importado infiere `string` donde el tipo pide una unión de literales
// (p. ej. `vertical`). Widen<> compara todo lo demás en compilación: si al mock
// le falta o le sobra un campo, o un tipo no coincide, esto no compila.
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T

const raw = mockJson satisfies Widen<PublicLocalData>

const VERTICALS: readonly PublicLocal['vertical'][] = ['salon', 'restaurant']

function validar(data: typeof raw): PublicLocalData {
  // Lo único que Widen<> no puede verificar: los valores de las uniones.
  if (!VERTICALS.includes(data.local.vertical as PublicLocal['vertical'])) {
    throw new PublicRepositoryError('MOCK_INVALID', `vertical inválido en el mock: ${data.local.vertical}`)
  }
  return data as PublicLocalData
}

type Options = {
  /** Demora simulada en ms, para diseñar estados de carga. */
  delay?: number
}

/** Implementación local: lee mocks/public-local.json (forma exacta de la API). */
export class MockPublicRepository implements PublicLocalRepository {
  private readonly data: PublicLocalData
  private readonly delay: number

  constructor({ delay = 0 }: Options = {}) {
    this.data = validar(raw)
    this.delay = delay
  }

  private respond<T>(value: T): Promise<T> {
    // Copia profunda: nadie puede mutar el mock compartido.
    const copy = structuredClone(value)
    if (this.delay <= 0) return Promise.resolve(copy)
    return new Promise((resolve) => setTimeout(() => resolve(copy), this.delay))
  }

  private assertRestaurant() {
    if (this.data.local.vertical !== 'restaurant') {
      return Promise.reject(new PublicRepositoryError('NOT_FOR_THIS_VERTICAL', 'Solo locales de rubro Restaurante.', 404))
    }
    return null
  }

  getLocal(): Promise<PublicLocal> {
    return this.respond(this.data.local)
  }

  getCarta(): Promise<PublicMenu> {
    return this.assertRestaurant() ?? this.respond(this.data.menu)
  }

  getMenuDelDia(): Promise<MenuItem[]> {
    return this.assertRestaurant() ?? this.respond(this.data.menu.daily_menu)
  }

  getZonasDelivery(): Promise<DeliveryZone[]> {
    return this.assertRestaurant() ?? this.respond(this.data.delivery_zones.items)
  }
}
