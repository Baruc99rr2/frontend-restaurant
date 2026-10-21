import { MockPublicRepository } from './MockPublicRepository'
import type { PublicLocalRepository } from './PublicLocalRepository'

// Punto único donde se elige la implementación. En F12: ApiPublicRepository
// con la URL del backend desde una variable de entorno.
export const repository: PublicLocalRepository = new MockPublicRepository({ delay: 150 })
