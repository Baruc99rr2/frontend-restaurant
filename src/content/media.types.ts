// Forma del catálogo que genera `pnpm media` en media.generated.ts.

export type ImageVariant = {
  width: number
  height: number
  avif: string
  webp: string
}

/** Una forma (proporción) de una foto, en dos tamaños + placeholder borroso de 16px. */
export type ImageShape = {
  lg: ImageVariant
  sm: ImageVariant
  /** data: URI WebP de 16px de ancho, para carga progresiva. */
  placeholder: string
}

export type MediaImage = {
  id: string
  kind: 'restaurante' | 'comida'
  source: { file: string; width: number; height: number }
  /** 16:9 — escenario y fondos. */
  paisaje: ImageShape
  /** 4:5 — cartelitos, polaroid, carrusel, marco inclinado. */
  retrato: ImageShape
  /** 12:5 — portadas de categoría. */
  banda: ImageShape
}

export type MediaVideoSource = { src: string; width: number; height: number; kb: number }
export type MediaPoster = { width: number; height: number; avif: string; webp: string }

export type MediaVideo = {
  source: { file: string; width: number; height: number; duration: number | null; kb: number }
  /** lg: pantallas ≥ 1024px; sm: el resto. */
  sources: { lg: MediaVideoSource; sm: MediaVideoSource }
  poster: { lg: MediaPoster; sm: MediaPoster; placeholder: string }
}

export type MediaCatalog = {
  images: Record<string, MediaImage>
  video: MediaVideo | null
}

export type ImageShapeName = 'paisaje' | 'retrato' | 'banda'
